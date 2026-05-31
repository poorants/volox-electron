//! System tray icon and the custom HTML popup menu window.
//!
//! Like the original, the tray uses a frameless, transparent webview window
//! (`tray-menu.html`) shown next to the cursor on click and hidden on blur,
//! rather than a native context menu.

use tauri::image::Image;
use tauri::tray::{MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{
    AppHandle, Manager, PhysicalPosition, WebviewUrl, WebviewWindowBuilder, WindowEvent,
};

pub const MENU_LABEL: &str = "menu";
const TRAY_ID: &str = "main";

const MENU_W: f64 = 200.0;
const MENU_H: f64 = 200.0;

// "VX" lettermark tray icon, embedded at compile time.
const TRAY_ICON_PNG: &[u8] = include_bytes!("../icons/tray.png");

/// Build the tray icon and wire up click handling.
pub fn create(app: &AppHandle) -> tauri::Result<()> {
    let icon = Image::from_bytes(TRAY_ICON_PNG)?;
    let tray = TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .tooltip("Volox - Volume, the way it should be.")
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button_state, position, .. } = event {
                // Toggle once, on button release.
                if button_state == MouseButtonState::Up {
                    toggle_menu(tray.app_handle(), position);
                }
            }
        })
        .build(app)?;

    // Keep the handle alive for the life of the app.
    app.manage(tray);
    Ok(())
}

/// Pre-create the hidden menu popup window.
pub fn create_menu_window(app: &AppHandle) {
    if app.get_webview_window(MENU_LABEL).is_some() {
        return;
    }
    let built = WebviewWindowBuilder::new(app, MENU_LABEL, WebviewUrl::App("tray-menu.html".into()))
        .title("Volox Menu")
        .inner_size(MENU_W, MENU_H)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .visible(false)
        .build();

    match built {
        Ok(win) => {
            let hide_target = win.clone();
            win.on_window_event(move |event| {
                if let WindowEvent::Focused(false) = event {
                    let _ = hide_target.hide();
                }
            });
        }
        Err(e) => eprintln!("[tray] failed to create menu window: {e}"),
    }
}

fn toggle_menu(app: &AppHandle, cursor: PhysicalPosition<f64>) {
    let Some(win) = app.get_webview_window(MENU_LABEL) else {
        return;
    };

    if win.is_visible().unwrap_or(false) {
        let _ = win.hide();
        return;
    }

    // Anchor the menu so its bottom-right corner sits at the cursor (matching the
    // original's `cursor.x - menuW`, `cursor.y - menuH` placement).
    let scale = win.scale_factor().unwrap_or(1.0);
    let w = MENU_W * scale;
    let h = MENU_H * scale;
    let x = (cursor.x - w).max(0.0);
    let y = (cursor.y - h).max(0.0);
    let _ = win.set_position(PhysicalPosition::new(x, y));
    let _ = win.show();
    let _ = win.set_focus();
}

/// Reflect mute state in the tray tooltip (the original keeps the same icon for
/// both states; we surface the state via the tooltip instead).
pub fn set_state(app: &AppHandle, muted: bool) {
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        let tooltip = if muted {
            "Volox - Muted"
        } else {
            "Volox - Volume, the way it should be."
        };
        let _ = tray.set_tooltip(Some(tooltip));
    }
}
