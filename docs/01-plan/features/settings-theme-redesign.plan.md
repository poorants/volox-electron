# Plan: Settings Theme Redesign

## 개요
Settings 창의 Windows 기본 프레임(타이틀바, 닫기 버튼)과 스크롤바를 제거하고, 프로젝트 테마(Electric Violet / Dark / Glass morphism / Neon glow)에 맞는 커스텀 UI로 전면 교체한다.

## 현재 상태
- `frame: true` → Windows 기본 흰색 타이틀바가 노출됨
- 스크롤바: 브라우저 기본 스크롤바 (회색, 테마와 불일치)
- 설정 화면 내부 CSS는 이미 다크 테마 적용 완료

## 변경 사항

### 1. Frameless 윈도우 전환 (`electron/tray.js`)
- `frame: true` → `frame: false`
- 창 드래그 영역을 커스텀 타이틀바에 지정

### 2. 커스텀 타이틀바 추가 (`renderer/settings.html`)
- 상단에 커스텀 타이틀바 영역 추가
  - 왼쪽: "Volox" 텍스트 (또는 로고)
  - 오른쪽: 닫기(✕) 버튼 (hover 시 neon glow)
- `-webkit-app-region: drag` 로 드래그 가능
- 버튼은 `-webkit-app-region: no-drag`

### 3. 커스텀 스크롤바 (`renderer/settings.html` CSS)
- `::-webkit-scrollbar` 계열 pseudo-element 스타일링
  - 너비: 6px
  - Track: `var(--surface-2)` (투명 느낌)
  - Thumb: `var(--volox-500)` + border-radius
  - Hover 시 neon glow 효과

### 4. 윈도우 사이즈 조정
- frameless 전환 시 타이틀바 높이만큼 height 조정 (520 → 필요시 조정)

## 영향 범위
| 파일 | 변경 내용 |
|------|-----------|
| `electron/tray.js` | `frame: false` 전환 |
| `renderer/settings.html` | 커스텀 타이틀바 HTML + 스크롤바 CSS + 닫기 버튼 JS |

## 리스크
- Frameless 윈도우에서 Alt+F4는 여전히 동작 (Electron 기본)
- 드래그 영역과 버튼 클릭 영역 충돌 가능 → `no-drag` 명시로 해결
