# Plan: theme-switcher

> 트레이 메뉴에 테마 선택 기능 추가 및 런타임 테마 전환 구현

## 1. 배경 (Background)

theme-dark.css와 theme-light.css가 준비되어 있으나,
런타임에 테마를 전환하는 메커니즘이 없음. theme.css가 @import로 dark를 고정 로드 중.
트레이 메뉴에서 테마를 선택하면 즉시 모든 UI에 반영되도록 한다.

## 2. 목표 (Goals)

- 트레이 메뉴에 Theme 선택 항목 추가 (Dark / Light)
- 선택 시 3개 UI(OSD, Settings, Tray Menu) 동시 전환
- electron-store에 선택 테마 저장 (앱 재시작 시 유지)
- Settings 윈도우의 backgroundColor도 테마에 맞게 변경

## 3. 요구사항 (Requirements)

### 기능 요구사항
- [ ] 트레이 메뉴에 Theme 섹션 추가 (Dark ✓ / Light)
- [ ] 테마 선택 시 현재 열린 모든 BrowserWindow에 CSS 전환 적용
- [ ] electron-store에 `theme` 키 저장 ('dark' | 'light')
- [ ] 앱 시작 시 저장된 테마로 로드
- [ ] Settings 윈도우 backgroundColor 테마 연동

### 비기능 요구사항
- [ ] 테마 전환 시 깜빡임 없음
- [ ] theme.css의 @import 방식 → 동적 로드 방식으로 전환

## 4. 범위 (Scope)

### In Scope
- 트레이 메뉴 UI에 테마 선택 항목
- 런타임 CSS 파일 교체 메커니즘
- electron-store 테마 저장/로드
- Settings backgroundColor 동적 변경
- IPC 통신 (테마 변경 broadcast)

### Out of Scope
- 추가 테마 프리셋 (이번은 Dark/Light 2개)
- 커스텀 테마 에디터
- OS 다크모드 연동 (자동 감지)

## 5. 기술 접근 (Technical Approach)

### 테마 전환 메커니즘
- theme.css에서 @import 제거 → 공통 리셋만 유지
- 각 HTML에서 theme.css + theme-{name}.css 2개 link 태그 사용
- 테마 변경 시 main process가 모든 BrowserWindow에 IPC로 테마명 broadcast
- renderer에서 theme-{name}.css의 link href를 동적 교체

### IPC 흐름
```
[Tray Menu] → set-theme('light') → [Main Process]
                                      ├─ electron-store 저장
                                      ├─ BrowserWindow.getAllWindows() 순회
                                      └─ webContents.send('theme-changed', 'light')
                                          ├─ tray-menu.html (CSS 교체)
                                          ├─ settings.html (CSS 교체)
                                          └─ osd.html (CSS 교체)
```

### 트레이 메뉴 높이 조정
- Theme 섹션 추가로 메뉴 높이 증가: 220px → 280px
- tray.js의 menuW/menuH 상수 업데이트

## 6. 영향 분석 (Impact)

| 파일 | 변경 내용 |
|------|----------|
| `renderer/theme.css` | @import 제거, 공통 리셋만 유지 |
| `renderer/osd.html` | theme-dark.css link 추가, 테마 전환 스크립트 |
| `renderer/settings.html` | theme-dark.css link 추가, 테마 전환 스크립트 |
| `renderer/tray-menu.html` | theme-dark.css link 추가, Theme 선택 UI, 테마 전환 스크립트 |
| `electron/settings.js` | schema에 theme 추가 |
| `electron/main.js` | set-theme / get-theme IPC 핸들러 |
| `electron/tray.js` | backgroundColor 동적 변경, 메뉴 높이 조정 |
| `electron/preload.js` | setTheme, getTheme, onThemeChanged API 추가 |

## 7. 리스크 (Risks)

| 리스크 | 대응 |
|--------|------|
| CSS 교체 시 깜빡임 (FOUC) | link preload + 교체 후 display |
| Settings 윈도우 생성 시 backgroundColor 불일치 | 생성 전 store에서 테마 조회 |
