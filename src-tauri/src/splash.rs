//! Startup splash window.
//!
//! A small, centered, frameless glass window shown the moment the app launches
//! (since this is a tray app with no main window, it's the only visible sign of
//! startup) and automatically closed after a short delay.

use std::time::Duration;

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub const LABEL: &str = "splash";
const VISIBLE_MS: u64 = 1800;

/// Show the splash window and schedule it to close after [`VISIBLE_MS`].
pub fn show(app: &AppHandle) {
    // Created visible (not hidden-then-shown) so WebView2 paints it immediately.
    let built = WebviewWindowBuilder::new(app, LABEL, WebviewUrl::App("splash.html".into()))
        .title("Volox")
        .inner_size(360.0, 220.0)
        .center()
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .focused(false)
        .shadow(false)
        .visible(true)
        .build();

    match built {
        Ok(_) => {
            let app = app.clone();
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_millis(VISIBLE_MS));
                if let Some(win) = app.get_webview_window(LABEL) {
                    let _ = win.close();
                }
            });
        }
        Err(e) => eprintln!("[splash] failed to create window: {e}"),
    }
}
