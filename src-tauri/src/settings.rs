//! Persistent settings store.
//!
//! Mirrors the original electron-store schema (shortcuts / volume / osd / theme /
//! autoStart / user / subscription) and serializes to a JSON file under the OS
//! per-user config directory:
//!   - Windows: %APPDATA%\Volox\config.json
//!   - macOS:   ~/Library/Application Support/Volox/config.json

use std::path::PathBuf;
use std::sync::{LazyLock, Mutex};

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

// ── Types (camelCase on the wire to match the renderer / Firebase) ──

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Shortcut {
    pub modifier: String,
    pub trigger: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Shortcuts {
    pub volume_up: Shortcut,
    pub volume_down: Shortcut,
    pub mute: Shortcut,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VolumeCfg {
    pub step: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct OsdCfg {
    pub duration: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub uid: String,
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub display_name: Option<String>,
    #[serde(default, rename = "photoURL")]
    pub photo_url: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Subscription {
    pub plan: String,
    pub status: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Store {
    pub shortcuts: Shortcuts,
    pub volume: VolumeCfg,
    pub osd: OsdCfg,
    pub theme: String,
    pub auto_start: bool,
    #[serde(default)]
    pub user: Option<User>,
    #[serde(default)]
    pub subscription: Option<Subscription>,
}

// Partial update sent by the settings window.
#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct SettingsPatch {
    shortcuts: Option<Shortcuts>,
    volume: Option<VolumeCfg>,
    osd: Option<OsdCfg>,
    theme: Option<String>,
    auto_start: Option<bool>,
}

// ── Platform-aware defaults ──

fn default_shortcuts() -> Shortcuts {
    Shortcuts {
        volume_up: Shortcut { modifier: "alt".into(), trigger: "wheelUp".into() },
        volume_down: Shortcut { modifier: "alt".into(), trigger: "wheelDown".into() },
        mute: Shortcut { modifier: "alt".into(), trigger: "middleClick".into() },
    }
}

impl Default for Store {
    fn default() -> Self {
        Store {
            shortcuts: default_shortcuts(),
            volume: VolumeCfg { step: 2.0 },
            osd: OsdCfg { duration: 1500.0 },
            theme: "dark".into(),
            auto_start: false,
            user: None,
            subscription: None,
        }
    }
}

// ── File location ──

fn config_dir() -> PathBuf {
    // Windows: %APPDATA%\Volox
    let base = std::env::var_os("APPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."));
    base.join("Volox")
}

fn config_path() -> PathBuf {
    config_dir().join("config.json")
}

fn load_from_disk() -> Store {
    match std::fs::read_to_string(config_path()) {
        Ok(text) => serde_json::from_str::<Store>(&text).unwrap_or_else(|e| {
            eprintln!("[settings] parse error ({e}); using defaults");
            Store::default()
        }),
        Err(_) => Store::default(),
    }
}

fn persist(store: &Store) {
    let dir = config_dir();
    if let Err(e) = std::fs::create_dir_all(&dir) {
        eprintln!("[settings] mkdir failed: {e}");
        return;
    }
    match serde_json::to_string_pretty(store) {
        Ok(text) => {
            if let Err(e) = std::fs::write(config_path(), text) {
                eprintln!("[settings] write failed: {e}");
            }
        }
        Err(e) => eprintln!("[settings] serialize failed: {e}"),
    }
}

static STORE: LazyLock<Mutex<Store>> = LazyLock::new(|| Mutex::new(load_from_disk()));

fn with_store<T>(f: impl FnOnce(&mut Store) -> T) -> T {
    let mut guard = STORE.lock().expect("settings store poisoned");
    f(&mut guard)
}

// ── Public API ──

/// The subset returned to the renderer by `get_settings`
/// (intentionally excludes user/subscription, matching the original).
pub fn get_settings_json() -> Value {
    with_store(|s| {
        json!({
            "shortcuts": s.shortcuts,
            "volume": s.volume,
            "osd": s.osd,
            "theme": s.theme,
            "autoStart": s.auto_start,
        })
    })
}

/// Apply a partial settings patch and persist. Returns the merged shortcuts so the
/// caller can refresh the input hook.
pub fn apply_patch(patch: Value) -> Store {
    let patch: SettingsPatch = serde_json::from_value(patch).unwrap_or_default();
    with_store(|s| {
        if let Some(v) = patch.shortcuts {
            s.shortcuts = v;
        }
        if let Some(v) = patch.volume {
            s.volume = v;
        }
        if let Some(v) = patch.osd {
            s.osd = v;
        }
        if let Some(v) = patch.theme {
            s.theme = v;
        }
        if let Some(v) = patch.auto_start {
            s.auto_start = v;
        }
        persist(s);
        s.clone()
    })
}

pub fn get_theme() -> String {
    with_store(|s| s.theme.clone())
}

pub fn set_theme(theme: String) {
    with_store(|s| {
        s.theme = theme;
        persist(s);
    });
}

pub fn get_shortcuts() -> Shortcuts {
    with_store(|s| s.shortcuts.clone())
}

pub fn get_volume_step() -> u8 {
    with_store(|s| s.volume.step.round().clamp(1.0, 10.0) as u8)
}

pub fn get_osd_duration() -> u64 {
    with_store(|s| s.osd.duration.max(0.0) as u64)
}

pub fn get_auto_start() -> bool {
    with_store(|s| s.auto_start)
}

pub fn get_user_json() -> Value {
    with_store(|s| match &s.user {
        Some(u) => serde_json::to_value(u).unwrap_or(Value::Null),
        None => Value::Null,
    })
}

pub fn set_user(value: Value) {
    with_store(|s| {
        s.user = if value.is_null() {
            None
        } else {
            serde_json::from_value::<User>(value).ok()
        };
        persist(s);
    });
}

pub fn get_subscription_json() -> Value {
    with_store(|s| match &s.subscription {
        Some(sub) => serde_json::to_value(sub).unwrap_or(Value::Null),
        None => Value::Null,
    })
}

pub fn set_subscription(value: Value) {
    with_store(|s| {
        s.subscription = if value.is_null() {
            None
        } else {
            serde_json::from_value::<Subscription>(value).ok()
        };
        persist(s);
    });
}
