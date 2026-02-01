# Plan: theme-system

> 3개 UI(OSD, Settings, Tray Menu)의 스타일을 통합 테마 시스템으로 전환

## 1. 배경 (Background)

현재 osd.html, settings.html, tray-menu.html에 CSS가 각각 인라인으로 중복 정의되어 있음.
- CSS 변수가 파일마다 불일치 (osd: 10개, settings: 16개, tray-menu: 15개)
- 하드코딩된 디자인 값 40개 이상 (폰트, 사이즈, 색상, blur, shadow, border-radius 등)
- 공유 CSS 파일 없음
- 테마 변경 시 3개 파일을 모두 수동 수정해야 함

## 2. 목표 (Goals)

- 모든 디자인 토큰(색상, 폰트, 사이즈, 보더, 그림자, blur 등)을 CSS 변수로 통합
- 공유 CSS 파일 1개로 3개 HTML의 공통 스타일 관리
- 디폴트 테마(현재 Electric Violet Dark) 1개 적용
- 나중에 테마 JSON만 추가하면 새 테마 적용 가능한 구조

## 3. 요구사항 (Requirements)

### 기능 요구사항
- [ ] 모든 하드코딩된 디자인 값을 CSS 변수로 추출
- [ ] 공유 CSS 파일(theme.css) 생성
- [ ] 3개 HTML 파일에서 중복 CSS 제거, 공유 파일 import
- [ ] 디폴트 테마 토큰 정의 (현재 디자인 그대로)
- [ ] 각 HTML의 고유 스타일은 로컬에 유지 (레이아웃 등)

### 비기능 요구사항
- [ ] 기존 UI 외관 100% 동일하게 유지 (visual regression 없음)
- [ ] 테마 전환 UI는 이번 스코프에 포함하지 않음

## 4. 범위 (Scope)

### In Scope
- Design token 정의 및 CSS 변수화
- 공유 CSS 파일 생성 (theme.css)
- osd.html, settings.html, tray-menu.html CSS 리팩터링
- 디폴트 테마 1개 (현재 Electric Violet Dark)

### Out of Scope
- 테마 선택 UI (Settings 드롭다운 등)
- 추가 테마 프리셋 제작
- electron-store 테마 저장
- 런타임 테마 전환

## 5. 기술 접근 (Technical Approach)

### Design Token 카테고리

```
Colors (색상)
├── Primary: --voly-400 ~ --voly-700
├── Surface: --surface-0 ~ --surface-2
├── Border: --border, --border-accent
├── Text: --text-primary, --text-secondary, --text-tertiary
├── Semantic: --mute-red, --mute-red-glow, --success, --success-glow
└── Glow: --voly-glow, --voly-glow-strong

Typography (서체)
├── --font-family
├── --font-size-xs (11px)
├── --font-size-sm (12px)
├── --font-size-md (13px)
├── --font-size-lg (14px)
├── --font-size-xl (20px)
├── --font-size-2xl (28px)
└── --font-weight-normal, --font-weight-medium, --font-weight-semibold, --font-weight-bold

Spacing (간격)
├── --space-1 ~ --space-8

Border & Radius (테두리)
├── --radius-sm (6px)
├── --radius-md (8px)
├── --radius-lg (12px)
├── --radius-xl (14px)
├── --radius-full (50%)
└── --border-width (1px)

Effects (효과)
├── --blur-md (20px)
├── --blur-lg (24px)
├── --shadow-menu
├── --shadow-glow
└── --glass-bg (rgba surface with opacity)

Transitions (전환)
├── --transition-fast (120ms)
├── --transition-normal (180ms)
└── --transition-slow (250ms)
```

### 파일 구조

```
renderer/
├── theme.css           ← 신규: CSS 변수 정의 + 공통 리셋
├── osd.html            ← 수정: theme.css import, 하드코딩 제거
├── settings.html       ← 수정: theme.css import, 하드코딩 제거
└── tray-menu.html      ← 수정: theme.css import, 하드코딩 제거
```

### 접근 방식

1. `renderer/theme.css` 생성: `:root`에 전체 토큰 정의 + `*, body` 리셋
2. 각 HTML에서 `<link rel="stylesheet" href="theme.css">` 추가
3. 각 HTML의 `:root` 블록 제거, 하드코딩 값을 `var()` 참조로 교체
4. 레이아웃/컴포넌트 고유 스타일은 각 HTML 인라인에 유지

## 6. 영향 분석 (Impact)

| 파일 | 변경 내용 |
|------|----------|
| `renderer/theme.css` | 신규 - 통합 디자인 토큰 + 공통 스타일 |
| `renderer/osd.html` | CSS 변수 참조로 전환, `:root` 제거 |
| `renderer/settings.html` | CSS 변수 참조로 전환, `:root` 제거 |
| `renderer/tray-menu.html` | CSS 변수 참조로 전환, `:root` 제거 |

## 7. 리스크 (Risks)

| 리스크 | 대응 |
|--------|------|
| CSS 변수 교체 시 visual regression | 변경 전후 스크린샷 비교 |
| OSD 투명 배경이 theme.css의 body 스타일에 영향받음 | OSD는 body 배경 transparent 로컬 오버라이드 |
| 너무 세밀한 토큰화로 유지보수 복잡도 증가 | 실제 사용되는 값만 토큰화, 과도한 추상화 지양 |
