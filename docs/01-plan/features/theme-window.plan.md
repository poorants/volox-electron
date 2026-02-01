# Plan: theme-window

> 테마 선택을 트레이 메뉴 인라인에서 별도 BrowserWindow로 분리

## 1. 배경 (Background)

현재 트레이 메뉴에 Dark/Light 2개 항목이 직접 나열되어 있음.
향후 테마를 수십 가지로 확장하고 구독 서비스에 포함시킬 계획이므로,
테마 선택을 Settings와 같은 수준의 별도 윈도우로 분리해야 함.

## 2. 목표 (Goals)

- 트레이 메뉴의 Dark/Light 항목을 "Theme" 한 줄로 교체
- "Theme" 클릭 시 별도 BrowserWindow(theme-picker)가 열림
- theme-picker에서 테마 카드 형태로 선택 가능
- 현재 적용 중인 테마에 체크 표시
- 트레이 메뉴 높이를 원래 크기로 복원 (Theme 섹션 제거)

## 3. 요구사항 (Requirements)

### 기능 요구사항
- [ ] 트레이 메뉴: Dark/Light 항목 제거 → "Theme" 한 줄로 교체
- [ ] Theme 클릭 시 theme-picker BrowserWindow 열기
- [ ] theme-picker.html: 테마 카드 목록 (Dark, Light)
- [ ] 카드에 테마 프리뷰 색상 표시
- [ ] 현재 선택 테마에 체크마크
- [ ] 카드 클릭 시 즉시 테마 전환 (기존 IPC 활용)
- [ ] 싱글 인스턴스 (이미 열려있으면 focus)

### 비기능 요구사항
- [ ] 앱 디자인 시스템 준수 (theme.css 적용)
- [ ] 향후 테마 추가 시 카드만 추가하면 되는 구조

## 4. 범위 (Scope)

### In Scope
- renderer/theme-picker.html 신규 생성
- tray-menu.html에서 테마 항목 교체
- tray.js에 theme-picker 윈도우 관리 추가
- main.js에 open-theme-picker IPC 추가
- preload.js에 openThemePicker API 추가

### Out of Scope
- 새 테마 프리셋 추가
- 구독/결제 시스템
- 테마 커스텀 에디터

## 5. 기술 접근 (Technical Approach)

### theme-picker 윈도우 스펙
```javascript
{
  width: 360,
  height: 400,
  frame: false,
  resizable: false,
  backgroundColor: 테마 연동,
  webPreferences: { preload, contextIsolation: true }
}
```

### 테마 카드 UI 구조
```
┌─────────────────────────────────┐
│  Titlebar: "Themes"         ✕   │
│─────────────────────────────────│
│                                 │
│  ┌─────────┐  ┌─────────┐      │
│  │ ██████  │  │ ░░░░░░  │      │
│  │ ██████  │  │ ░░░░░░  │      │
│  │  Dark   │  │  Light  │      │
│  │    ✓    │  │         │      │
│  └─────────┘  └─────────┘      │
│                                 │
└─────────────────────────────────┘
```

- 카드에 해당 테마의 surface-0 / voly-500 / text-primary 색상을 미리보기로 표시
- 그리드 레이아웃 (2열)
- 향후 테마 추가 시 카드 배열에 추가만 하면 됨

### 트레이 메뉴 변경
- Dark/Light 2줄 + separator → "Theme" 1줄로 교체
- 트레이 메뉴 높이: 290px → 220px (원래 크기로 복원)

## 6. 영향 분석 (Impact)

| 파일 | 변경 내용 |
|------|----------|
| `renderer/theme-picker.html` | 신규 - 테마 선택 윈도우 UI |
| `renderer/tray-menu.html` | Dark/Light 항목 → Theme 한 줄로 교체 |
| `electron/tray.js` | theme-picker 윈도우 생성/관리, 메뉴 높이 복원 |
| `electron/main.js` | open-theme-picker IPC 핸들러 |
| `electron/preload.js` | openThemePicker API |

## 7. 리스크 (Risks)

| 리스크 | 대응 |
|--------|------|
| 윈도우가 너무 많아짐 (Settings + Theme) | 싱글 인스턴스 패턴 적용 |
