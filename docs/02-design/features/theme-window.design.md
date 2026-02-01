# Design: theme-window

> 테마 선택 별도 윈도우 설계

## 1. theme-picker.html 구조

### HTML
- Titlebar (드래그, 닫기 버튼) — settings.html과 동일 패턴
- 테마 카드 그리드 (2열, CSS Grid)
- 각 카드: 프리뷰 영역 + 테마명 + 체크마크

### 카드 데이터
```javascript
const THEMES = [
  {
    id: 'dark',
    name: 'Dark',
    preview: { bg: '#09090B', accent: '#8B5CF6', text: '#FAFAFA' },
  },
  {
    id: 'light',
    name: 'Light',
    preview: { bg: '#FFFFFF', accent: '#8B5CF6', text: '#09090B' },
  },
];
```

JavaScript로 카드를 동적 생성하여 향후 테마 추가 시 배열에만 추가.

### 카드 스타일
- 120x140 크기
- 프리뷰: 해당 테마의 bg + accent bar + text 미리보기
- 선택 시: border-color voly-500 + 체크마크
- hover: 살짝 scale up + glow

## 2. IPC

| Channel | Direction | 설명 |
|---------|-----------|------|
| `open-theme-picker` | renderer → main | 테마 윈도우 열기 |
| `set-theme` | 기존 유지 | 테마 변경 |
| `get-theme` | 기존 유지 | 현재 테마 조회 |
| `theme-changed` | main → renderer | broadcast (기존) |

## 3. tray.js 변경

- `let themeWindow = null;` 추가
- `openThemePicker()` 함수: Settings와 동일한 싱글 인스턴스 패턴
- destroyTray에 themeWindow 정리 추가
- menuH: 290 → 220 복원

## 4. tray-menu.html 변경

### Before
```html
<div class="menu-item" id="btn-theme-dark" data-theme="dark">...</div>
<div class="menu-item" id="btn-theme-light" data-theme="light">...</div>
<div class="sep"></div>
```

### After
```html
<div class="menu-item" id="btn-theme">
  <span class="icon">🎨</span>
  <span class="label">Theme</span>
</div>
<div class="sep"></div>
```

테마 관련 JS (setThemeUI, btnThemeDark, btnThemeLight) 제거.
대신 `btn-theme` 클릭 → `openThemePicker()` IPC.

## 5. 구현 순서

1. preload.js — openThemePicker API 추가
2. main.js — open-theme-picker IPC 핸들러
3. tray.js — themeWindow 관리, openThemePicker 함수, 높이 복원
4. renderer/theme-picker.html — 신규 생성
5. tray-menu.html — Dark/Light 항목 제거 → Theme 한 줄
