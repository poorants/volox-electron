# Volox

> Volume, the way it should be.

System tray utility for controlling system volume with keyboard shortcuts and mouse wheel. Built with Electron.

## Features

- **Global Shortcuts** — Alt + Arrow Up/Down (macOS) or Alt + Mouse Wheel (Windows) for volume control
- **Mute Toggle** — Alt + M (macOS) or Alt + Middle Click (Windows)
- **On-Screen Display** — Glassmorphism OSD with fade-in/out animation
- **Themes** — Dark, Light, Cyber Pulse with per-theme OSD layouts
- **Custom Tray Menu** — Styled popup menu matching the active theme
- **Configurable** — Customizable shortcuts and volume step size

## Screenshots

*Coming soon*

## Getting Started

### Prerequisites

- Node.js 18+
- npm

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
# macOS
npm run build:mac

# Windows
npm run build:win
```

## Default Shortcuts

| Action | macOS | Windows |
|--------|-------|---------|
| Volume Up | Alt + Up Arrow | Alt + Wheel Up |
| Volume Down | Alt + Down Arrow | Alt + Wheel Down |
| Mute Toggle | Alt + M | Alt + Middle Click |

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
electron/           Main process
  main.js           App entry, IPC handlers
  tray.js           System tray, menu, settings/theme windows
  tray-icon.js      Dynamic tray icon generation
  osd.js            OSD window management
  volume.js         System volume control (loudness)
  settings.js       Persistent settings (electron-store)
  preload.js        Context bridge API
  input-hook/       Global input hooks (koffi, Win32)
renderer/           Renderer HTML/CSS
  osd.html          Volume OSD overlay
  settings.html     Settings window
  theme-picker.html Theme selection window
  tray-menu.html    Custom tray context menu
  theme.css         Base reset
  theme-dark.css    Dark theme tokens
  theme-light.css   Light theme tokens
  theme-cyber-pulse.css  Cyber Pulse theme tokens + OSD layout
assets/             Icons and images
```

## Tech Stack

- [Electron](https://www.electronjs.org/) — Cross-platform desktop app
- [electron-store](https://github.com/sindresorhus/electron-store) — Persistent settings
- [loudness](https://github.com/nicehash/loudness) — System volume control
- [koffi](https://koffi.dev/) — Win32 FFI for global mouse hooks (Windows only)

## License

ISC
