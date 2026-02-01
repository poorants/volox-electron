# Plan: theme-light

> 라이트 테마 CSS 파일 생성 및 테마 파일 구조 정리

## 1. 배경 (Background)

theme-system에서 52개 디자인 토큰을 CSS 변수로 통합했으므로,
`:root` 값만 교체하면 새 테마를 적용할 수 있는 구조가 갖춰져 있음.
라이트 테마 파일을 별도로 생성하여 테마 전환의 기반을 마련한다.

## 2. 목표 (Goals)

- 라이트 테마 CSS 파일 생성 (theme-light.css)
- 기존 theme.css를 theme-dark.css로 리네임하여 구조 명확화
- theme.css는 공통 리셋 + 기본(다크) 테마 import 역할로 변경
- 포인트 컬러는 동일한 Violet 유지, 배경/텍스트/서피스만 라이트로 전환

## 3. 요구사항 (Requirements)

### 기능 요구사항
- [ ] theme-dark.css: 현재 theme.css의 :root 토큰을 분리
- [ ] theme-light.css: 라이트 배경 + Violet 포인트 컬러 토큰 정의
- [ ] theme.css: 공통 리셋만 유지, 기본 테마(dark) import
- [ ] 라이트 테마에서 glass-bg, shadow, glow 값 라이트에 맞게 조정
- [ ] 3개 HTML 파일 수정 불필요 (theme.css import 유지)

### 비기능 요구사항
- [ ] 기존 다크 테마 외관 변경 없음
- [ ] 테마 선택 UI는 이번 스코프에 포함하지 않음 (다음 Plan)

## 4. 범위 (Scope)

### In Scope
- 파일 구조 변경: theme.css → theme.css(공통) + theme-dark.css + theme-light.css
- 라이트 테마 색상 토큰 정의

### Out of Scope
- 테마 선택 UI (트레이 메뉴, Settings)
- electron-store 테마 저장
- 런타임 테마 전환 로직

## 5. 기술 접근 (Technical Approach)

### 파일 구조 변경
```
renderer/
├── theme.css           ← 공통 리셋 + 기본 테마 import
├── theme-dark.css      ← 다크 테마 토큰 (:root)
└── theme-light.css     ← 라이트 테마 토큰 (:root)
```

### 라이트 테마 색상 방향
- Surface: 흰색 계열 (#FFFFFF, #F4F4F5, #E4E4E7)
- Text: 어두운 계열 (#09090B, #3F3F46, #71717A)
- Primary Violet: 동일 유지 (#8B5CF6 계열)
- Glass: rgba(255, 255, 255, 0.85) + blur
- Border: 밝은 zinc 계열 (#E4E4E7, #D4D4D8)
- Glow: Violet glow 유지하되 opacity 낮춤 (밝은 배경에서 과하지 않게)
- Shadow: 밝은 배경용 그림자 (rgba(0,0,0,0.1) 계열)
- bar-track: rgba(0, 0, 0, 0.08) (어두운 트랙)

### Settings window backgroundColor 처리
- settings.html의 BrowserWindow backgroundColor는 tray.js에서 `#09090B`로 하드코딩됨
- 테마 전환 시 이 값도 변경 필요 → 다음 Plan(theme-switcher)에서 처리
- 이번엔 파일 준비만

## 6. 영향 분석 (Impact)

| 파일 | 변경 내용 |
|------|----------|
| `renderer/theme.css` | 토큰 분리 → 공통 리셋 + dark import만 유지 |
| `renderer/theme-dark.css` | 신규 - 다크 테마 토큰 |
| `renderer/theme-light.css` | 신규 - 라이트 테마 토큰 |

## 7. 리스크 (Risks)

| 리스크 | 대응 |
|--------|------|
| 라이트에서 Violet glow가 과해 보일 수 있음 | opacity 줄여 조절 |
| glass-bg가 라이트에서 부자연스러울 수 있음 | 흰색 반투명으로 전환 |
