# Analysis: theme-switcher

> 설계 대비 구현 갭 분석

## Match Rate: 96%

## 설계 항목별 검증

| # | 설계 항목 | 구현 여부 | 비고 |
|---|----------|----------|------|
| 1 | theme.css @import 제거 → 공통 리셋만 | ✅ | |
| 2 | 각 HTML에 theme-dark.css link + id="theme-variant" | ✅ | 3개 모두 |
| 3 | settings.js schema에 theme 추가 | ✅ | enum: dark/light, default: dark |
| 4 | getTheme/setTheme 함수 추가 | ✅ | module.exports에 포함 |
| 5 | preload.js 테마 API 3개 | ✅ | getTheme, setTheme, onThemeChanged |
| 6 | main.js IPC: get-theme, set-theme | ✅ | broadcast to all windows |
| 7 | 트레이 메뉴 Theme 선택 UI (Dark/Light) | ✅ | 체크마크 표시 |
| 8 | 메뉴 높이 220→290 | ✅ | BrowserWindow + getMenuPosition |
| 9 | 테마 선택 시 CSS href 동적 교체 | ✅ | 3개 HTML 모두 |
| 10 | electron-store 저장/로드 | ✅ | |
| 11 | Settings backgroundColor 동적 | ✅ | getTheme() 기반 분기 |
| 12 | 초기 로드 시 저장된 테마 적용 | ✅ | getTheme → href 교체 |

## Gap 목록

| # | Gap | 심각도 | 비고 |
|---|-----|--------|------|
| 1 | Settings 윈도우 이미 열린 상태에서 테마 변경 시 backgroundColor는 변경 안됨 (다음 열기부터 적용) | Low | CSS가 body background 덮으므로 시각적 영향 없음 |

## 결론

설계 대비 핵심 기능 100% 구현. Gap 1건은 실사용에 영향 없음.
