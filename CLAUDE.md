# Voly

> Volume, the way it should be.

Windows 시스템 볼륨을 단축키+마우스 휠로 조절하는 시스템 트레이 유틸리티.

## Level: Starter

## Tech Stack
- Electron (순수 HTML/CSS/JS renderer)
- koffi (Win32 WH_MOUSE_LL 글로벌 마우스 훅)
- loudness (시스템 볼륨/뮤트 제어)
- electron-store (설정 저장)
- Firebase Authentication (Google OAuth)

## Design System
- Prime Color: Electric Violet (#8B5CF6)
- Dark theme + Glass morphism + Neon glow
- Tray icon: "Vy" lettermark

## Current Features (v2.1.0)
- 글로벌 마우스/키보드 단축키로 볼륨 조절 (Alt+Wheel, 커스텀 가능)
- Alt + Middle Click 뮤트 토글
- 연속 입력 시 볼륨 스텝 가속 (최대 10%)
- OSD (On-Screen Display) 볼륨/뮤트 상태 표시
- 시스템 트레이 아이콘 (일반/뮤트 상태 구분)
- 트레이 메뉴: 로그인/로그아웃, 테마, 설정, 종료
- 설정 창: 단축키 설정, 볼륨 스텝(1-10%), 시작 시 자동 실행
- 테마 3종: Dark, Light, Cyber Pulse
- 단일 인스턴스 잠금
- Google OAuth 로그인/로그아웃 (Firebase Auth)
- 로그인 상태 앱 재시작 시 유지 (electron-store 캐시)
- Windows / macOS 지원

## Project Structure
- `electron/` - Main process modules (tray, osd, input-hook, volume, settings, auth)
- `renderer/` - HTML files (osd.html, settings.html, auth.html)
- `assets/` - Tray icons (.ico)
- `docs/` - PDCA documents

## Commands
- `npm run dev` - Electron 실행 (시스템 트레이)
- `npm run build` - 프로덕션 빌드 (.exe)

## Default Shortcuts
- Alt + Wheel Up/Down → 볼륨 조절
- Alt + Middle Click → 뮤트 토글

## Roadmap
- [x] 로그인 기능 (Google OAuth + Firebase Auth) - 트레이 메뉴에서 로그인/로그아웃
- [ ] 사용자 정보 / 구독 테이블 연동
