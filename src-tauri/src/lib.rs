//! Volox — Windows/macOS tray app for fast global volume control.
//! Tauri 2 + Rust port of the original Electron app.

mod commands;
mod config;
mod dispatch;
mod input_hook;
mod osd;
mod panels;
mod settings;
mod state;
mod tray;
mod volume;

use tauri_plugin_autostart::{ManagerExt, MacosLauncher};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Single-instance lock must be registered first.
        .plugin(tauri_plugin_single_instance::init(|_app, _argv, _cwd| {}))
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::save_settings,
            commands::start_capture,
            commands::cancel_capture,
            commands::get_volume_state,
            commands::set_volume,
            commands::toggle_mute_from_tray,
            commands::open_settings,
            commands::open_theme_picker,
            commands::quit_app,
            commands::close_window,
            commands::get_platform,
            commands::get_theme,
            commands::set_theme,
            commands::get_firebase_config,
            commands::get_user,
            commands::auth_sign_in,
            commands::auth_sign_out,
            commands::get_subscription,
            commands::save_subscription,
            commands::open_auth_window,
            commands::close_auth_window,
            commands::frontend_log,
        ])
        .setup(|app| {
            let handle = app.handle().clone();

            // Seed the hook's shortcut table from persisted settings.
            state::set_shortcuts(settings::get_shortcuts());

            // Apply the launch-at-startup preference.
            let launcher = app.autolaunch();
            let _ = if settings::get_auto_start() {
                launcher.enable()
            } else {
                launcher.disable()
            };

            // Dispatcher (owns the volume cache + COM endpoint), windows, tray, hook.
            // The tray menu window is created lazily on first right-click (creating
            // it hidden up-front made WebView2 paint it blank).
            dispatch::start(handle.clone());
            osd::create(&handle);
            if let Err(e) = tray::create(&handle) {
                eprintln!("[setup] tray creation failed: {e}");
            }
            input_hook::start();

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building Volox")
        .run(|_app_handle, event| {
            // Tray app: keep running when transient windows close; only an
            // explicit Quit allows the process to exit.
            if let tauri::RunEvent::ExitRequested { api, .. } = event {
                if !state::allow_exit() {
                    api.prevent_exit();
                }
            }
        });
}
