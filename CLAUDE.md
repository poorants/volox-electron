# Volox

> Volo + Vox — 가볍고 편하게, 확실한 편의를 제공하는 볼륨 제어

Windows/Mac 데스크톱 트레이 앱. 볼륨·뮤트 제어를 가볍고 편하게.

## Level: Starter

## Tech Stack
- Electron (순수 HTML/CSS/JS renderer)
- koffi (Win32 WH_MOUSE_LL + WH_KEYBOARD_LL 글로벌 훅)
- loudness (시스템 볼륨/뮤트 제어)
- electron-store (설정 저장)
- Firebase Authentication (Google OAuth)

## Design System
- Prime Color: Electric Violet (#8B5CF6)
- Dark theme + Glass morphism + Neon glow
- Logo Font: Jaro (Google Fonts)
- Tray icon: "VX" lettermark

## Current Features (v2.0.4)
- 글로벌 마우스/키보드 단축키로 볼륨 조절 (Alt+Wheel, 커스텀 가능)
- 단축키 매칭 시 원본 이벤트 차단 (Alt+Wheel → 스크롤 안 됨)
- WH_KEYBOARD_LL 훅으로 키보드 trigger 지원 (arrowUp/Down, keyM)
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
- `assets/` - App icons (volox-icon.png, volox-tray-icon.png)
- `website/` - Landing page (Vite + React + Tailwind)
- `docs/` - PDCA documents
- `.github/workflows/` - CI/CD workflows

## Commands
- `npm run dev` - Electron 실행 (시스템 트레이)
- `npm run build` - 프로덕션 빌드 (.exe / .dmg)

## Default Shortcuts
- Alt + Wheel Up/Down → 볼륨 조절
- Alt + Middle Click → 뮤트 토글

## Deployment (GitHub Actions)

### 앱 배포 (Windows/macOS)
v태그 푸시 시 자동으로 빌드 & GitHub Releases에 업로드됩니다.

```bash
# 버전 업데이트 후 태그 푸시
npm version patch  # or minor, major
git push && git push --tags
```

- Windows: `volox-setup.exe`
- macOS: `volox.dmg`
- 배포 위치: https://github.com/poorants/volox/releases

### 웹사이트 배포
`website/` 폴더 변경 시 자동으로 GitHub Pages에 배포됩니다.
- 배포 위치: https://poorants.github.io/volox/

### GitHub Secrets 필요
- `VOLOX_PAT`: volox 저장소 접근용 Personal Access Token
- `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`

## Roadmap
- [x] 로그인 기능 (Google OAuth + Firebase Auth)
- [x] 사용자 정보 / 구독 테이블 연동 (Firestore)
- [x] 단축키 매칭 시 원본 이벤트 차단 + 키보드 훅
- [x] GitHub Actions 빌드 자동화 + 홈페이지 & 다운로드 배포
- [ ] 자동 업데이트 구성 (electron-updater + GitHub Releases)
- [ ] 빌드 용량 최적화 (locales 정리, asar 압축, 불필요 파일 제외)
- [ ] 앱 시작 스플래시 화면 (앱 아이콘 + 로딩 표시, 잠시 후 사라짐)
