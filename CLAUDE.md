# Voly

> Volume, the way it should be.

Windows 시스템 볼륨을 단축키+마우스 휠로 조절하는 시스템 트레이 유틸리티.

## Level: Starter

## Tech Stack
- Electron (순수 HTML/CSS/JS renderer)
- koffi (Win32 WH_MOUSE_LL 글로벌 마우스 훅)
- loudness (시스템 볼륨/뮤트 제어)
- electron-store (설정 저장)

## Design System
- Prime Color: Electric Violet (#8B5CF6)
- Dark theme + Glass morphism + Neon glow
- Tray icon: "Vy" lettermark

## Project Structure
- `electron/` - Main process modules (tray, osd, input-hook, volume, settings)
- `renderer/` - HTML files (osd.html, settings.html)
- `assets/` - Tray icons (.ico)
- `docs/` - PDCA documents

## Commands
- `npm run dev` - Electron 실행 (시스템 트레이)
- `npm run build` - 프로덕션 빌드 (.exe)

## Default Shortcuts
- Alt + Wheel Up/Down → 볼륨 조절
- Alt + Middle Click → 뮤트 토글
