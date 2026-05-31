# Volox

> Volume, the way it should be.

System tray utility for controlling system volume with keyboard shortcuts and mouse wheel. Built with Tauri 2 + Rust (native webview frontend).

## Features

- **Global Shortcuts** — Alt + Mouse Wheel Up/Down for volume control
- **Mute Toggle** — Alt + Middle Click
- **On-Screen Display** — Glassmorphism OSD with fade-in/out animation
- **Themes** — Dark, Light, Cyber Pulse with per-theme OSD layouts
- **Custom Tray Menu** — Styled popup menu matching the active theme
- **Configurable** — Customizable shortcuts and volume step size

## Screenshots

*Coming soon*

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Rust (stable) — https://rustup.rs
- Windows 10/11 with WebView2 runtime (preinstalled on Windows 11) + MSVC build tools

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build:win
```

## Default Shortcuts

| Action | Shortcut |
|--------|----------|
| Volume Up | Alt + Wheel Up |
| Volume Down | Alt + Wheel Down |
| Mute Toggle | Alt + Middle Click |

Shortcuts are customizable in Settings.

## Themes

| Theme | Description |
|-------|-------------|
| **Dark** | Default. Electric Violet on deep black |
| **Light** | Clean white with violet accents |
| **Cyber Pulse** | Cyan neon with slim pill-shaped OSD |

Select themes via tray menu > Theme.

## Project Structure

```
src-tauri/          Rust backend (Tauri 2)
  src/
    lib.rs          App builder, setup, tray-resident lifecycle
    main.rs         Binary entry
    commands.rs     #[tauri::command] handlers (the invoke surface)
    dispatch.rs     Volume cache + acceleration, OSD/tray orchestration
    input_hook.rs   Global WH_MOUSE_LL / WH_KEYBOARD_LL hooks (windows crate)
    volume.rs       System volume/mute (Windows Core Audio)
    settings.rs     Persistent settings (serde + JSON)
    tray.rs         System tray icon + custom popup menu window
    osd.rs          OSD window management
    panels.rs       Settings / Theme / Auth windows
    config.rs       Firebase config resolution
    state.rs        Shared state + hook→dispatcher bus
  tauri.conf.json   Tauri config
  capabilities/     Permission capabilities
  icons/            App + tray icons
renderer/           Frontend HTML/CSS/JS (native webview)
  tauri-bridge.js   window.electronAPI shim → Tauri invoke/listen
  osd.html          Volume OSD overlay
  settings.html     Settings window
  theme-picker.html Theme selection window
  tray-menu.html    Custom tray context menu
  auth.html         Google sign-in (Firebase JS SDK)
  theme*.css        Base reset + theme tokens
  assets/           Bundled images (sound.png)
assets/             Source icons and images
```

## Tech Stack

- [Tauri 2](https://tauri.app/) — Rust backend + native OS webview
- [windows](https://crates.io/crates/windows) crate — Win32 global hooks (WH_MOUSE_LL / WH_KEYBOARD_LL) + Core Audio volume control
- [serde](https://serde.rs/) — Persistent settings (JSON, electron-store schema compatible)
- tauri-plugin-single-instance / tauri-plugin-autostart
- [Firebase Auth](https://firebase.google.com/docs/auth) — Google OAuth (web SDK in the auth window)

> Migrated from Electron — see [docs/tauri-migration.md](docs/tauri-migration.md).

## License

ISC
