# Plan: auto-start

> 시스템 재시작 시 Voly가 자동 실행되도록 설정 메뉴에 옵션 추가

## 1. 배경 (Background)

현재 Voly는 시스템 부팅 후 사용자가 수동으로 실행해야 함.
시스템 트레이 유틸리티 특성상, 부팅 시 자동 실행은 필수적인 UX 기능.

## 2. 목표 (Goals)

- Settings UI에 "시스템 시작 시 자동 실행" 토글 옵션 추가
- 설정 ON/OFF에 따라 OS 로그인 시 자동 실행 등록/해제
- electron-store에 설정값 영속 저장

## 3. 요구사항 (Requirements)

### 기능 요구사항
- [ ] Settings UI에 자동 실행 토글(체크박스 또는 스위치) 추가
- [ ] 토글 변경 시 Electron `app.setLoginItemSettings()` API로 자동 실행 등록/해제
- [ ] electron-store schema에 `autoStart` (boolean, default: false) 추가
- [ ] 앱 시작 시 저장된 설정값과 실제 로그인 아이템 상태 동기화

### 비기능 요구사항
- [ ] Windows 환경 지원 (Registry 기반 자동 실행)
- [ ] 기존 Settings UI 레이아웃/스타일과 일관성 유지

## 4. 기술 접근 (Technical Approach)

### Electron API
- `app.setLoginItemSettings({ openAtLogin: true/false })` — OS 자동 실행 등록
- `app.getLoginItemSettings()` — 현재 자동 실행 상태 조회

### 변경 파일
| 파일 | 변경 내용 |
|------|-----------|
| `electron/settings.js` | schema에 `autoStart` 필드 추가 |
| `electron/main.js` | IPC 핸들러 추가 + 저장 시 `setLoginItemSettings` 호출 |
| `electron/preload.js` | 필요 시 API 노출 (기존 saveSettings로 충분할 수 있음) |
| `renderer/settings.html` | 자동 실행 토글 UI 추가 |

### 구현 순서
1. `electron/settings.js` — schema에 `autoStart: { type: 'boolean', default: false }` 추가
2. `electron/main.js` — `save-settings` 핸들러에서 `autoStart` 값 처리, `app.setLoginItemSettings()` 호출
3. `renderer/settings.html` — Volume 섹션 아래에 "Launch at startup" 토글 추가
4. 동작 검증

## 5. 리스크 (Risks)

- 프로덕션 빌드(.exe)에서만 `setLoginItemSettings`가 정상 동작 (개발 모드에서는 electron.exe가 등록됨)
- 패키징 방식(NSIS)에 따라 경로가 달라질 수 있으므로 빌드 후 테스트 필요

## 6. 범위 제외 (Out of Scope)

- macOS 자동 실행 (현재 Windows 전용 앱)
- 최소화 상태로 시작 옵션 (별도 기능)
