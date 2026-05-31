//! System master-volume / mute control.
//!
//! On Windows this talks to the Core Audio `IAudioEndpointVolume` endpoint
//! (the same scalar API the original `loudness` npm module used). COM is
//! initialized lazily, once per calling thread, and the endpoint is cached in
//! thread-local storage — so both the dispatcher thread and Tauri command
//! worker threads can call these freely.
//!
//! Volume is expressed as 0..=100 to match the renderer.

#[cfg(target_os = "windows")]
mod imp {
    use std::cell::RefCell;

    use windows::core::Result;
    use windows::Win32::Foundation::BOOL;
    use windows::Win32::Media::Audio::Endpoints::IAudioEndpointVolume;
    use windows::Win32::Media::Audio::{
        eConsole, eRender, IMMDeviceEnumerator, MMDeviceEnumerator,
    };
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_MULTITHREADED,
    };

    thread_local! {
        static COM_READY: RefCell<bool> = const { RefCell::new(false) };
        static ENDPOINT: RefCell<Option<IAudioEndpointVolume>> = const { RefCell::new(None) };
    }

    fn ensure_com() {
        COM_READY.with(|ready| {
            if !*ready.borrow() {
                // Safe: COINIT_MULTITHREADED can be initialized once per thread.
                unsafe {
                    let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
                }
                *ready.borrow_mut() = true;
            }
        });
    }

    fn acquire() -> Result<IAudioEndpointVolume> {
        ensure_com();
        unsafe {
            let enumerator: IMMDeviceEnumerator =
                CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)?;
            let device = enumerator.GetDefaultAudioEndpoint(eRender, eConsole)?;
            let endpoint: IAudioEndpointVolume = device.Activate(CLSCTX_ALL, None)?;
            Ok(endpoint)
        }
    }

    /// Run `f` against a live endpoint, re-acquiring once if the cached endpoint
    /// has gone stale (e.g. the default output device changed).
    fn with_endpoint<T>(f: impl Fn(&IAudioEndpointVolume) -> Result<T>) -> Result<T> {
        ENDPOINT.with(|cell| {
            if cell.borrow().is_none() {
                *cell.borrow_mut() = Some(acquire()?);
            }
            let first = {
                let borrow = cell.borrow();
                f(borrow.as_ref().unwrap())
            };
            match first {
                Ok(value) => Ok(value),
                Err(_) => {
                    let fresh = acquire()?;
                    let result = f(&fresh);
                    *cell.borrow_mut() = Some(fresh);
                    result
                }
            }
        })
    }

    pub fn get_volume() -> Option<u8> {
        with_endpoint(|ep| unsafe { ep.GetMasterVolumeLevelScalar() })
            .ok()
            .map(|scalar| (scalar * 100.0).round().clamp(0.0, 100.0) as u8)
    }

    pub fn set_volume(level: u8) {
        let scalar = (level as f32 / 100.0).clamp(0.0, 1.0);
        let _ = with_endpoint(|ep| unsafe {
            ep.SetMasterVolumeLevelScalar(scalar, std::ptr::null())
        });
    }

    pub fn get_muted() -> bool {
        with_endpoint(|ep| unsafe { ep.GetMute() })
            .map(|b| b.as_bool())
            .unwrap_or(false)
    }

    pub fn set_muted(muted: bool) {
        let _ = with_endpoint(|ep| unsafe { ep.SetMute(BOOL::from(muted), std::ptr::null()) });
    }
}

// Non-Windows fallback so the crate type-checks cross-platform. macOS volume
// control is a documented follow-up (CoreAudio / AudioToolbox).
#[cfg(not(target_os = "windows"))]
mod imp {
    pub fn get_volume() -> Option<u8> {
        None
    }
    pub fn set_volume(_level: u8) {}
    pub fn get_muted() -> bool {
        false
    }
    pub fn set_muted(_muted: bool) {}
}

pub use imp::{get_muted, get_volume, set_muted, set_volume};

/// Toggle mute and report the resulting `(volume, muted)` state.
pub fn toggle_mute() -> (u8, bool) {
    let muted = !get_muted();
    set_muted(muted);
    let volume = get_volume().unwrap_or(0);
    (volume, muted)
}
