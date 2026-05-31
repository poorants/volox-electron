# Volox

> Volo + Vox — 가볍고 편하게, 확실한 편의를 제공하는 볼륨 제어

Windows/Mac 데스크톱 트레이 앱. 볼륨·뮤트 제어를 가볍고 편하게.

## Level: Starter

## Tech Stack
- Tauri 2 + Rust 백엔드 / 순수 HTML/CSS/JS renderer (네이티브 웹뷰: WebView2/WKWebView)
- windows crate (Win32 WH_MOUSE_LL + WH_KEYBOARD_LL 글로벌 훅, 직접 호출)
- Windows Core Audio `IAudioEndpointVolume` (시스템 볼륨/뮤트 제어)
- serde + JSON 파일 (설정 저장, electron-store 스키마 호환)
- tauri-plugin-single-instance / tauri-plugin-autostart
- Firebase Authentication (Google OAuth — 웹뷰 + Firebase JS SDK)

> Electron → Tauri 마이그레이션 상세: [docs/tauri-migration.md](docs/tauri-migration.md)

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
- `src-tauri/src/` - Rust 백엔드 모듈 (lib, commands, dispatch, input_hook, volume, settings, tray, osd, panels, config, state)
- `src-tauri/tauri.conf.json` / `capabilities/` / `icons/` - Tauri 설정·권한·아이콘
- `renderer/` - HTML/CSS/JS (osd, settings, theme-picker, auth, tray-menu) + `tauri-bridge.js` (electronAPI shim) + `assets/`
- `assets/` - 원본 아이콘 (volox-icon.png 512px, volox-tray-icon.png 16px)
- `website/` - Landing page (Vite + React + Tailwind)
- `docs/` - PDCA 문서 + 마이그레이션 노트
- `.github/workflows/` - CI/CD workflows

## Commands
- `npm run dev` - Tauri 개발 실행 (시스템 트레이 상주)
- `npm run build` - 프로덕션 빌드 (.exe / .dmg)
- `npm run build:win` / `npm run build:mac` - 플랫폼별 번들
- `cargo check --manifest-path src-tauri/Cargo.toml` - Rust 백엔드 컴파일 체크

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

- Windows: NSIS 설치 파일 (`src-tauri/target/release/bundle/nsis/*-setup.exe`)
- macOS: DMG (`src-tauri/target/release/bundle/dmg/*.dmg`)
- 배포 위치: https://github.com/poorants/volox/releases

### 웹사이트 배포
`website/` 폴더 변경 시 자동으로 GitHub Pages에 배포됩니다.
- 배포 위치: https://poorants.github.io/volox/

### GitHub Secrets 필요
- `RELEASE_REPO_TOKEN`: volox 저장소(릴리스/Pages) 접근용 Personal Access Token
- `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID` (빌드 step env로 주입)

## Roadmap
- [x] 로그인 기능 (Google OAuth + Firebase Auth)
- [x] 사용자 정보 / 구독 테이블 연동 (Firestore)
- [x] 단축키 매칭 시 원본 이벤트 차단 + 키보드 훅
- [x] GitHub Actions 빌드 자동화 + 홈페이지 & 다운로드 배포
- [x] Electron → Tauri 2 (Rust) 마이그레이션 (`migrate/electron-to-tauri`)
- [ ] 자동 업데이트 구성 (tauri-plugin-updater + GitHub Releases)
- [ ] macOS 네이티브 훅/볼륨 구현 (현재 Windows만, macOS는 스텁)
- [ ] Firebase OAuth Tauri 네이티브화 (tauri-plugin-oauth 루프백 + signInWithCredential)
- [ ] 앱 시작 스플래시 화면 (앱 아이콘 + 로딩 표시, 잠시 후 사라짐)
