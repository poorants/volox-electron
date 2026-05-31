//! Transient UI windows: Settings, Theme picker, and the Auth (sign-in) window.
//!
//! Settings and Theme close on blur (matching the original); Auth stays open
//! because the Google OAuth popup steals focus.

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};

fn open_panel(app: &AppHandle, label: &str, file: &str, w: f64, h: f64, close_on_blur: bool) {
    if let Some(win) = app.get_webview_window(label) {
        let _ = win.set_focus();
        return;
    }

    let built = WebviewWindowBuilder::new(app, label, WebviewUrl::App(file.into()))
        .title("Volox")
        .inner_size(w, h)
        .decorations(false)
        .resizable(false)
        .build();

    match built {
        Ok(win) => {
            if close_on_blur {
                let target = win.clone();
                win.on_window_event(move |event| {
                    if let WindowEvent::Focused(false) = event {
                        let _ = target.close();
                    }
                });
            }
        }
        Err(e) => eprintln!("[panels] failed to open {label}: {e}"),
    }
}

pub fn open_settings(app: &AppHandle) {
    open_panel(app, "settings", "settings.html", 420.0, 540.0, true);
}

pub fn open_theme_picker(app: &AppHandle) {
    open_panel(app, "theme", "theme-picker.html", 360.0, 400.0, true);
}

pub fn open_auth(app: &AppHandle) {
    open_panel(app, "auth", "auth.html", 360.0, 400.0, false);
}

pub fn close_auth(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("auth") {
        let _ = win.close();
    }
}
