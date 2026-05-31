//! Shared, process-wide state.
//!
//! The low-level input hook runs in a dedicated OS thread and its callbacks are
//! plain `extern "system"` functions, so the data they need must live in statics.
//! Heavy work (COM volume calls, window manipulation) is pushed onto the
//! dispatcher thread via [`send_event`] to keep the hook callback fast.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::Sender;
use std::sync::{LazyLock, Mutex, OnceLock, RwLock};

use crate::settings::Shortcuts;

/// Work items handed from the hook (or commands) to the dispatcher thread.
#[derive(Debug)]
pub enum HookEvent {
    /// Wheel / keyboard volume change — acceleration is applied by the dispatcher.
    Volume { up: bool },
    /// Toggle system mute.
    Mute,
    /// A shortcut was captured during "capture mode" in the settings window.
    Capture {
        action: String,
        modifier: String,
        trigger: String,
    },
    /// Tray slider / tray-mute set the volume — keep the dispatcher cache in sync.
    SyncVolume(u8),
    /// Settings changed — refresh step / OSD duration used by the dispatcher.
    SettingsChanged { step: u8, osd_duration: u64 },
}

// ── Dispatcher bus ──
// `mpsc::Sender` is `Send` but not `Sync`, so it cannot live bare in a static;
// a `Mutex` makes the static `Sync`. Send traffic is user-paced, so contention
// is negligible.
static BUS: OnceLock<Mutex<Sender<HookEvent>>> = OnceLock::new();

pub fn set_bus(tx: Sender<HookEvent>) {
    let _ = BUS.set(Mutex::new(tx));
}

pub fn send_event(event: HookEvent) {
    if let Some(bus) = BUS.get() {
        if let Ok(tx) = bus.lock() {
            let _ = tx.send(event);
        }
    }
}

// ── Shortcuts (read by the hook on every matching event) ──
static SHORTCUTS: LazyLock<RwLock<Shortcuts>> =
    LazyLock::new(|| RwLock::new(crate::settings::get_shortcuts()));

pub fn set_shortcuts(shortcuts: Shortcuts) {
    if let Ok(mut w) = SHORTCUTS.write() {
        *w = shortcuts;
    }
}

pub fn shortcuts() -> Shortcuts {
    SHORTCUTS.read().expect("shortcuts lock poisoned").clone()
}

// ── Capture mode ──
static CAPTURING: AtomicBool = AtomicBool::new(false);
static CAPTURE_ACTION: Mutex<Option<String>> = Mutex::new(None);

pub fn begin_capture(action: String) {
    *CAPTURE_ACTION.lock().unwrap() = Some(action);
    CAPTURING.store(true, Ordering::SeqCst);
}

pub fn cancel_capture() {
    CAPTURING.store(false, Ordering::SeqCst);
    *CAPTURE_ACTION.lock().unwrap() = None;
}

pub fn is_capturing() -> bool {
    CAPTURING.load(Ordering::SeqCst)
}

/// Consume the pending capture action id, ending capture mode.
pub fn take_capture_action() -> Option<String> {
    CAPTURING.store(false, Ordering::SeqCst);
    CAPTURE_ACTION.lock().unwrap().take()
}

// ── Exit gate ──
// The tray app prevents exit when its transient windows close; only an explicit
// Quit flips this so `RunEvent::ExitRequested` is allowed through.
static ALLOW_EXIT: AtomicBool = AtomicBool::new(false);

pub fn set_allow_exit(value: bool) {
    ALLOW_EXIT.store(value, Ordering::SeqCst);
}

pub fn allow_exit() -> bool {
    ALLOW_EXIT.load(Ordering::SeqCst)
}
