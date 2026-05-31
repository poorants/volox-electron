//! On-screen display window.
//!
//! A transparent, click-through, always-on-top window that shows the volume /
//! mute widget near the bottom-center of the primary display and auto-hides
//! after a configurable duration.

use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;

use serde_json::json;
use tauri::{
    AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, WebviewUrl, WebviewWindowBuilder,
};

use crate::settings;

pub const LABEL: &str = "osd";

/// Each `show` bumps this generation counter; the hide timer only fires if it is
/// still the latest, so rapid re-shows cancel earlier hide timers.
static GENERATION: AtomicU64 = AtomicU64::new(0);

fn size_for_theme() -> (f64, f64) {
    match settings::get_theme().as_str() {
        "cyber-pulse" => (520.0, 50.0),
        _ => (340.0, 90.0),
    }
}

/// Create the (initially hidden) OSD window at startup.
pub fn create(app: &AppHandle) {
    if app.get_webview_window(LABEL).is_some() {
        return;
    }
    let (w, h) = size_for_theme();
    let built = WebviewWindowBuilder::new(app, LABEL, WebviewUrl::App("osd.html".into()))
        .title("Volox OSD")
        .inner_size(w, h)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .focused(false)
        .shadow(false)
        .visible(false)
        .build();

    match built {
        Ok(win) => {
            let _ = win.set_ignore_cursor_events(true);
        }
        Err(e) => eprintln!("[osd] failed to create window: {e}"),
    }
}

/// Show the OSD with the given payload, then schedule an auto-hide.
pub fn show(app: &AppHandle, kind: &str, value: i32, duration_ms: u64, muted: bool) {
    let Some(win) = app.get_webview_window(LABEL) else {
        return;
    };

    let (w, h) = size_for_theme();
    let _ = win.set_size(LogicalSize::new(w, h));

    if let Ok(Some(monitor)) = win.primary_monitor() {
        let scale = monitor.scale_factor();
        let size = monitor.size();
        let screen_w = size.width as f64 / scale;
        let screen_h = size.height as f64 / scale;
        let x = ((screen_w - w) / 2.0).max(0.0);
        let y = (screen_h - h - 80.0).max(0.0);
        let _ = win.set_position(LogicalPosition::new(x, y));
    }

    let _ = win.emit(
        "osd-update",
        json!({ "type": kind, "value": value, "isMuted": muted, "action": "show" }),
    );
    let _ = win.show();

    let generation = GENERATION.fetch_add(1, Ordering::SeqCst) + 1;
    let app = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_millis(duration_ms));
        if GENERATION.load(Ordering::SeqCst) != generation {
            return; // superseded by a newer show
        }
        if let Some(win) = app.get_webview_window(LABEL) {
            // Trigger the CSS fade-out, then actually hide.
            let _ = win.emit("osd-update", json!({ "action": "hide" }));
            std::thread::sleep(Duration::from_millis(250));
            if GENERATION.load(Ordering::SeqCst) == generation {
                let _ = win.hide();
            }
        }
    });
}
