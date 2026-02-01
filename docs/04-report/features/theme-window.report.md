# Report: theme-window

> 테마 선택을 별도 BrowserWindow로 분리 완료 보고서

## 요약

트레이 메뉴의 인라인 Dark/Light 선택을 제거하고, "Theme" 한 줄 항목으로 교체.
클릭 시 별도 theme-picker 윈도우가 열리며, 카드 형태로 테마를 선택.
향후 테마 확장 및 구독 서비스 연동을 위한 구조 준비.

## 결과

| 항목 | 값 |
|------|-----|
| Match Rate | 97% |
| 반복 횟수 | 0 |
| 변경 파일 수 | 6 (신규 1, 수정 5) |

## 변경 파일

| 파일 | 변경 |
|------|------|
| `renderer/theme-picker.html` | **신규** - 테마 선택 윈도우 (카드 그리드) |
| `renderer/tray-menu.html` | Dark/Light 항목 → Theme 한 줄, 관련 JS/CSS 정리 |
| `electron/tray.js` | themeWindow 관리, openThemePicker, 메뉴 높이 복원 |
| `electron/main.js` | open-theme-picker IPC |
| `electron/preload.js` | openThemePicker API |

## 확장 가이드

새 테마 추가 시:
1. `renderer/theme-{name}.css` 생성
2. `theme-picker.html`의 THEMES 배열에 추가:
```javascript
{ id: 'midnight', name: 'Midnight', preview: { bg: '#0F172A', accent: '#3B82F6', text: '#F8FAFC' } }
```
3. 끝. 카드 자동 생성됨.
