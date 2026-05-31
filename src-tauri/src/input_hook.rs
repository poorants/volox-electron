//! Global low-level input hooks.
//!
//! On Windows this installs `WH_MOUSE_LL` + `WH_KEYBOARD_LL` hooks on a dedicated
//! thread with its own message pump (required for low-level hooks). When an event
//! matches a configured shortcut the original event is swallowed (the callback
//! returns 1) and a [`HookEvent`] is forwarded to the dispatcher.
//!
//! The callbacks do only cheap work — read modifier key state, match against the
//! shortcut table, post a channel message — so the OS never times them out.

#[cfg(target_os = "windows")]
pub fn start() {
    std::thread::Builder::new()
        .name("volox-input-hook".into())
        .spawn(|| unsafe { imp::run() })
        .expect("failed to spawn input-hook thread");
}

#[cfg(not(target_os = "windows"))]
pub fn start() {
    // macOS/Linux global hooks are a documented follow-up (NSEvent monitor /
    // global shortcuts). The app runs without them.
}

#[cfg(target_os = "windows")]
mod imp {
    use windows::core::PCWSTR;
    use windows::Win32::Foundation::{HINSTANCE, LPARAM, LRESULT, WPARAM};
    use windows::Win32::System::LibraryLoader::GetModuleHandleW;
    use windows::Win32::UI::Input::KeyboardAndMouse::GetAsyncKeyState;
    use windows::Win32::UI::WindowsAndMessaging::{
        CallNextHookEx, DispatchMessageW, GetMessageW, SetWindowsHookExW, TranslateMessage, HHOOK,
        KBDLLHOOKSTRUCT, MSG, MSLLHOOKSTRUCT, WH_KEYBOARD_LL, WH_MOUSE_LL,
    };

    use crate::state::{self, HookEvent};

    const WM_MOUSEWHEEL: u32 = 0x020A;
    const WM_MBUTTONDOWN: u32 = 0x0207;
    const WM_KEYDOWN: u32 = 0x0100;
    const WM_SYSKEYDOWN: u32 = 0x0104;

    const VK_SHIFT: i32 = 0x10;
    const VK_CONTROL: i32 = 0x11;
    const VK_MENU: i32 = 0x12; // Alt
    const VK_LWIN: i32 = 0x5B;

    // ── Key-state helpers ──

    fn key_down(vk: i32) -> bool {
        unsafe { (GetAsyncKeyState(vk) as u16 & 0x8000) != 0 }
    }

    fn modifier_down(modifier: &str) -> bool {
        match modifier {
            "alt" => key_down(VK_MENU),
            "ctrl" => key_down(VK_CONTROL),
            "shift" => key_down(VK_SHIFT),
            "meta" => key_down(VK_LWIN),
            _ => false,
        }
    }

    fn active_modifier() -> Option<&'static str> {
        if key_down(VK_MENU) {
            Some("alt")
        } else if key_down(VK_CONTROL) {
            Some("ctrl")
        } else if key_down(VK_SHIFT) {
            Some("shift")
        } else if key_down(VK_LWIN) {
            Some("meta")
        } else {
            None
        }
    }

    fn vk_of_trigger(trigger: &str) -> Option<i32> {
        match trigger {
            "arrowUp" => Some(0x26),
            "arrowDown" => Some(0x28),
            "keyM" => Some(0x4D),
            _ => None,
        }
    }

    fn trigger_of_vk(vk: i32) -> Option<&'static str> {
        match vk {
            0x26 => Some("arrowUp"),
            0x28 => Some("arrowDown"),
            0x4D => Some("keyM"),
            _ => None,
        }
    }

    fn wheel_delta(lparam: isize) -> i32 {
        unsafe {
            let data = &*(lparam as *const MSLLHOOKSTRUCT);
            (data.mouseData >> 16) as i16 as i32
        }
    }

    fn fire(action: &str) {
        match action {
            "volumeUp" => state::send_event(HookEvent::Volume { up: true }),
            "volumeDown" => state::send_event(HookEvent::Volume { up: false }),
            "mute" => state::send_event(HookEvent::Mute),
            _ => {}
        }
    }

    // ── Matching ──

    fn match_mouse(wparam: u32, delta: i32) -> Option<&'static str> {
        let sc = state::shortcuts();
        for (action, s) in [
            ("volumeUp", &sc.volume_up),
            ("volumeDown", &sc.volume_down),
            ("mute", &sc.mute),
        ] {
            if !modifier_down(&s.modifier) {
                continue;
            }
            match wparam {
                WM_MOUSEWHEEL => {
                    if s.trigger == "wheelUp" && delta > 0 {
                        return Some(action);
                    }
                    if s.trigger == "wheelDown" && delta < 0 {
                        return Some(action);
                    }
                }
                WM_MBUTTONDOWN => {
                    if s.trigger == "middleClick" {
                        return Some(action);
                    }
                }
                _ => {}
            }
        }
        None
    }

    fn match_keyboard(vk: i32) -> Option<&'static str> {
        let sc = state::shortcuts();
        for (action, s) in [
            ("volumeUp", &sc.volume_up),
            ("volumeDown", &sc.volume_down),
            ("mute", &sc.mute),
        ] {
            if vk_of_trigger(&s.trigger) == Some(vk) && modifier_down(&s.modifier) {
                return Some(action);
            }
        }
        None
    }

    fn emit_capture(modifier: &str, trigger: &str) {
        if let Some(action) = state::take_capture_action() {
            state::send_event(HookEvent::Capture {
                action,
                modifier: modifier.to_string(),
                trigger: trigger.to_string(),
            });
        }
    }

    /// Returns true if the event should be blocked (swallowed).
    fn handle_mouse(wparam: u32, lparam: isize) -> bool {
        if wparam != WM_MOUSEWHEEL && wparam != WM_MBUTTONDOWN {
            return false;
        }
        let delta = if wparam == WM_MOUSEWHEEL {
            wheel_delta(lparam)
        } else {
            0
        };

        if state::is_capturing() {
            if let Some(modifier) = active_modifier() {
                let trigger = if wparam == WM_MOUSEWHEEL {
                    if delta > 0 {
                        "wheelUp"
                    } else {
                        "wheelDown"
                    }
                } else {
                    "middleClick"
                };
                emit_capture(modifier, trigger);
                return true;
            }
            return false;
        }

        if active_modifier().is_some() {
            if let Some(action) = match_mouse(wparam, delta) {
                fire(action);
                return true;
            }
        }
        false
    }

    /// Returns true if the event should be blocked (swallowed).
    fn handle_keyboard(vk: i32) -> bool {
        if state::is_capturing() {
            if let Some(modifier) = active_modifier() {
                if let Some(trigger) = trigger_of_vk(vk) {
                    emit_capture(modifier, trigger);
                    return true;
                }
            }
            return false;
        }

        if let Some(action) = match_keyboard(vk) {
            fire(action);
            return true;
        }
        false
    }

    // ── Hook procedures ──

    unsafe extern "system" fn mouse_proc(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
        if code >= 0 && handle_mouse(wparam.0 as u32, lparam.0) {
            return LRESULT(1);
        }
        CallNextHookEx(HHOOK::default(), code, wparam, lparam)
    }

    unsafe extern "system" fn keyboard_proc(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
        if code >= 0 {
            let msg = wparam.0 as u32;
            if msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN {
                let data = &*(lparam.0 as *const KBDLLHOOKSTRUCT);
                if handle_keyboard(data.vkCode as i32) {
                    return LRESULT(1);
                }
            }
        }
        CallNextHookEx(HHOOK::default(), code, wparam, lparam)
    }

    pub unsafe fn run() {
        let hmodule = GetModuleHandleW(PCWSTR::null()).unwrap_or_default();
        let hinstance = HINSTANCE(hmodule.0);

        match SetWindowsHookExW(WH_MOUSE_LL, Some(mouse_proc), hinstance, 0) {
            Ok(_) => println!("[hook] mouse hook installed"),
            Err(e) => eprintln!("[hook] mouse hook failed: {e}"),
        }
        match SetWindowsHookExW(WH_KEYBOARD_LL, Some(keyboard_proc), hinstance, 0) {
            Ok(_) => println!("[hook] keyboard hook installed"),
            Err(e) => eprintln!("[hook] keyboard hook failed: {e}"),
        }

        // Message pump — required for low-level hook callbacks to fire.
        let mut msg = MSG::default();
        loop {
            let ret = GetMessageW(&mut msg, None, 0, 0);
            if ret.0 <= 0 {
                break;
            }
            let _ = TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }
    }
}
