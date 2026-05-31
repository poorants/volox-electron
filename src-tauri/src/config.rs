//! Firebase web config resolution.
//!
//! Values are looked up in priority order:
//!   1. compile-time env (`option_env!`) — set by CI during release builds,
//!   2. runtime env vars,
//!   3. a `.env` file next to the executable or in the working directory.
//!
//! These are public Firebase *web* client values (not secrets), mirroring the
//! original `get-firebase-config` IPC handler.

use std::collections::HashMap;
use std::sync::LazyLock;

use serde_json::{json, Value};

static DOTENV: LazyLock<HashMap<String, String>> = LazyLock::new(load_dotenv);

fn load_dotenv() -> HashMap<String, String> {
    let mut map = HashMap::new();
    let mut candidates: Vec<std::path::PathBuf> = Vec::new();
    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(cwd.join(".env"));
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            candidates.push(dir.join(".env"));
        }
    }
    for path in candidates {
        if let Ok(text) = std::fs::read_to_string(&path) {
            for line in text.lines() {
                let line = line.trim();
                if line.is_empty() || line.starts_with('#') {
                    continue;
                }
                if let Some((key, value)) = line.split_once('=') {
                    map.entry(key.trim().to_string())
                        .or_insert_with(|| value.trim().trim_matches('"').to_string());
                }
            }
        }
    }
    map
}

fn resolve(key: &str, compiled: Option<&str>) -> String {
    if let Some(v) = compiled {
        if !v.is_empty() {
            return v.to_string();
        }
    }
    if let Ok(v) = std::env::var(key) {
        if !v.is_empty() {
            return v;
        }
    }
    DOTENV.get(key).cloned().unwrap_or_default()
}

pub fn firebase_config() -> Value {
    json!({
        "apiKey": resolve("FIREBASE_API_KEY", option_env!("FIREBASE_API_KEY")),
        "authDomain": resolve("FIREBASE_AUTH_DOMAIN", option_env!("FIREBASE_AUTH_DOMAIN")),
        "projectId": resolve("FIREBASE_PROJECT_ID", option_env!("FIREBASE_PROJECT_ID")),
        "appId": resolve("FIREBASE_APP_ID", option_env!("FIREBASE_APP_ID")),
    })
}
