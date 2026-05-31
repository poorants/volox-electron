//! Dispatcher thread.
//!
//! Owns the authoritative in-memory volume cache and the acceleration state, and
//! serializes all hook-driven audio work onto a single thread (which also keeps
//! its COM endpoint warm via the thread-local in `volume`). The hook callback
//! merely sends [`HookEvent`]s here, so it stays fast enough not to be evicted
//! by the OS.

use std::sync::mpsc;
use std::time::Instant;

use serde_json::json;
use tauri::{AppHandle, Emitter};

use crate::settings;
use crate::state::{self, HookEvent};
use crate::{osd, tray};

const ACCEL_WINDOW_MS: u128 = 500;
const ACCEL_MAX: i32 = 10;

/// Consecutive same-direction inputs within `ACCEL_WINDOW_MS` ramp the step up to
/// `ACCEL_MAX` — a direct port of the original `getAcceleratedStep`.
struct Accel {
    dir: Option<bool>,
    last: Option<Instant>,
    step: i32,
}

impl Accel {
    fn new() -> Self {
        Accel { dir: None, last: None, step: 0 }
    }

    fn next(&mut self, up: bool, base: i32) -> i32 {
        let now = Instant::now();
        let continued = self.dir == Some(up)
            && self
                .last
                .map(|t| now.duration_since(t).as_millis() < ACCEL_WINDOW_MS)
                .unwrap_or(false);
        if continued {
            self.step = (self.step + 1).min(ACCEL_MAX);
        } else {
            self.step = base;
            self.dir = Some(up);
        }
        self.last = Some(now);
        self.step
    }
}

/// Spawn the dispatcher thread and register its sender on the shared bus.
pub fn start(app: AppHandle) {
    let (tx, rx) = mpsc::channel::<HookEvent>();
    state::set_bus(tx);
    std::thread::Builder::new()
        .name("volox-dispatch".into())
        .spawn(move || run(app, rx))
        .expect("failed to spawn dispatcher thread");
}

fn run(app: AppHandle, rx: mpsc::Receiver<HookEvent>) {
    let mut cache: i32 = crate::volume::get_volume().map(i32::from).unwrap_or(50);
    let mut step: i32 = settings::get_volume_step() as i32;
    let mut osd_duration: u64 = settings::get_osd_duration();
    let mut accel = Accel::new();

    for event in rx {
        match event {
            HookEvent::Volume { up } => {
                let change = accel.next(up, step).max(1);
                cache = if up {
                    (cache + change).min(100)
                } else {
                    (cache - change).max(0)
                };
                crate::volume::set_volume(cache as u8);
                osd::show(&app, "volume", cache, osd_duration, false);
            }
            HookEvent::Mute => {
                let (volume, muted) = crate::volume::toggle_mute();
                cache = volume as i32;
                osd::show(&app, "mute", cache, osd_duration, muted);
                tray::set_state(&app, muted);
            }
            HookEvent::Capture { action, modifier, trigger } => {
                // Mirrors the original `capture-result` IPC broadcast.
                let _ = app.emit(
                    "capture-result",
                    json!({ "actionId": action, "modifier": modifier, "trigger": trigger }),
                );
            }
            HookEvent::SyncVolume(level) => {
                cache = level as i32;
            }
            HookEvent::SettingsChanged { step: new_step, osd_duration: new_osd } => {
                step = new_step as i32;
                osd_duration = new_osd;
            }
        }
    }
}
