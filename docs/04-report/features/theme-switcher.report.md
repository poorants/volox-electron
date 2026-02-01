# Report: theme-switcher

> 트레이 메뉴 테마 선택 기능 + 런타임 테마 전환 완료 보고서

## 요약

트레이 메뉴에 Dark/Light 테마 선택 항목을 추가하고,
선택 시 3개 UI(OSD, Settings, Tray Menu)의 CSS가 즉시 전환되도록 구현.
electron-store에 테마 설정 저장되어 앱 재시작 시 유지.

## 결과

| 항목 | 값 |
|------|-----|
| Match Rate | 96% |
| 반복 횟수 | 0 |
| 변경 파일 수 | 8 (수정 8) |

## 변경 파일

| 파일 | 변경 |
|------|------|
| `renderer/theme.css` | @import 제거, 공통 리셋만 유지 |
| `renderer/osd.html` | theme-variant link 추가, 테마 전환 스크립트 |
| `renderer/settings.html` | theme-variant link 추가, 테마 전환 스크립트 |
| `renderer/tray-menu.html` | theme-variant link, Dark/Light 선택 UI, 체크마크 |
| `electron/settings.js` | theme schema + getTheme/setTheme |
| `electron/main.js` | get-theme/set-theme IPC + broadcast |
| `electron/preload.js` | getTheme/setTheme/onThemeChanged API |
| `electron/tray.js` | 메뉴 높이 290, Settings backgroundColor 동적 |

## 동작 흐름

1. 트레이 메뉴에서 Dark/Light 클릭
2. IPC `set-theme` → electron-store 저장
3. `BrowserWindow.getAllWindows()`로 `theme-changed` broadcast
4. 각 HTML에서 `#theme-variant` link href 교체
5. CSS 변수가 즉시 바뀌어 UI 전환
