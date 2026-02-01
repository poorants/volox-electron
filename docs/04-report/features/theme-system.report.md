# Report: theme-system

> 3개 UI의 통합 테마 시스템 기반 구축 완료 보고서

## 요약

osd.html, settings.html, tray-menu.html에 각각 인라인으로 중복 정의되어 있던 CSS를
공유 theme.css 파일로 추출하고, 모든 하드코딩된 디자인 값을 CSS 변수로 통합.

## 결과

| 항목 | 값 |
|------|-----|
| Match Rate | 97% |
| 반복 횟수 | 0 |
| 변경 파일 수 | 4 (신규 1, 수정 3) |

## 변경 파일

| 파일 | 변경 |
|------|------|
| `renderer/theme.css` | **신규** - 50+ 디자인 토큰 + 공통 리셋 |
| `renderer/osd.html` | :root 제거, theme.css import, 12개 하드코딩 → var() |
| `renderer/settings.html` | :root 제거, theme.css import, 16개 하드코딩 → var() |
| `renderer/tray-menu.html` | :root 제거, theme.css import, 14개 하드코딩 → var() |

## 토큰 카테고리

| 카테고리 | 토큰 수 | 예시 |
|----------|---------|------|
| Colors - Primary | 8 | --voly-400 ~ --voly-active |
| Colors - Surface | 4 | --surface-0 ~ --glass-bg |
| Colors - Border | 3 | --border, --border-accent, --border-subtle |
| Colors - Text | 3 | --text-primary/secondary/tertiary |
| Colors - Semantic | 8 | --mute-red 5종, --success 2종, --bar-track |
| Typography | 12 | --font-size 7단계, --font-weight 5단계 |
| Border Radius | 8 | --radius-sm ~ --radius-full |
| Effects | 6 | --blur, --shadow, --transition |
| **합계** | **52** | |

## 향후 확장

theme.css의 `:root` 값만 교체하면 새 테마 적용 가능:
- Settings UI에 테마 선택 드롭다운 추가
- electron-store에 선택 테마 저장
- 런타임 CSS 변수 오버라이드로 전환
