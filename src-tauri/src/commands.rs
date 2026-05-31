//! Tauri command handlers — the `invoke` surface that backs `window.electronAPI`
//! in the renderer (see `renderer/tauri-bridge.js`).

use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, WebviewWindow};
use tauri_plugin_autostart::ManagerExt;

use crate::state::{self, HookEvent};
use crate::{config, panels, settings, tray, volume};

// ── Settings ──

#[tauri::command]
pub fn get_settings() -> Value {
    settings::get_settings_json()
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: Value) -> bool {
    let merged = settings::apply_patch(settings);

    // Refresh the hook's shortcut matcher and the dispatcher's tuning.
    state::set_shortcuts(merged.shortcuts.clone());
    state::send_event(HookEvent::SettingsChanged {
        step: merged.volume.step.round().clamp(1.0, 10.0) as u8,
        osd_duration: merged.osd.duration.max(0.0) as u64,
    });

    // Apply launch-at-startup.
    let launcher = app.autolaunch();
    let _ = if merged.auto_start {
        launcher.enable()
    } else {
        launcher.disable()
    };

    true
}

// ── Shortcut capture ──

#[tauri::command]
pub fn start_capture(action: String) {
    state::begin_capture(action);
}

#[tauri::command]
pub fn cancel_capture() {
    state::cancel_capture();
}

// ── Volume / mute (tray) ──

#[tauri::command]
pub async fn get_volume_state() -> Value {
    let (vol, muted) = tauri::async_runtime::spawn_blocking(|| {
        (volume::get_volume().unwrap_or(0), volume::get_muted())
    })
    .await
    .unwrap_or((0, false));
    json!({ "volume": vol, "muted": muted })
}

#[tauri::command]
pub async fn set_volume(vol: u8) -> bool {
    let _ = tauri::async_runtime::spawn_blocking(move || volume::set_volume(vol)).await;
    state::send_event(HookEvent::SyncVolume(vol));
    true
}

#[tauri::command]
pub async fn toggle_mute_from_tray(app: AppHandle) -> Value {
    let (vol, muted) = tauri::async_runtime::spawn_blocking(volume::toggle_mute)
        .await
        .unwrap_or((0, false));
    tray::set_state(&app, muted);
    state::send_event(HookEvent::SyncVolume(vol));
    json!({ "volume": vol, "muted": muted })
}

// ── Windows / lifecycle ──

#[tauri::command]
pub fn open_settings(app: AppHandle) {
    panels::open_settings(&app);
}

#[tauri::command]
pub fn open_theme_picker(app: AppHandle) {
    panels::open_theme_picker(&app);
}

#[tauri::command]
pub fn quit_app(app: AppHandle) {
    state::set_allow_exit(true);
    app.exit(0);
}

#[tauri::command]
pub fn close_window(window: WebviewWindow) {
    let _ = window.close();
}

#[tauri::command]
pub fn get_platform() -> String {
    if cfg!(target_os = "macos") {
        "darwin".into()
    } else {
        "win32".into()
    }
}

// ── Theme ──

#[tauri::command]
pub fn get_theme() -> String {
    settings::get_theme()
}

#[tauri::command]
pub fn set_theme(app: AppHandle, theme: String) {
    settings::set_theme(theme.clone());
    let _ = app.emit("theme-changed", theme);
}

// ── Auth ──

#[tauri::command]
pub fn get_firebase_config() -> Value {
    config::firebase_config()
}

#[tauri::command]
pub fn get_user() -> Value {
    settings::get_user_json()
}

#[tauri::command]
pub fn auth_sign_in(app: AppHandle, user: Value) -> bool {
    settings::set_user(user.clone());
    let _ = app.emit("auth-state-changed", user);
    true
}

#[tauri::command]
pub fn auth_sign_out(app: AppHandle) -> bool {
    settings::set_user(Value::Null);
    let _ = app.emit("auth-state-changed", Value::Null);
    true
}

#[tauri::command]
pub fn get_subscription() -> Value {
    settings::get_subscription_json()
}

#[tauri::command]
pub fn save_subscription(sub: Value) -> bool {
    settings::set_subscription(sub);
    true
}

#[tauri::command]
pub fn open_auth_window(app: AppHandle) {
    panels::open_auth(&app);
}

#[tauri::command]
pub fn close_auth_window(app: AppHandle) {
    panels::close_auth(&app);
}
