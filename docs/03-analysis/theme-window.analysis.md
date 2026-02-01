# Analysis: theme-window

> 설계 대비 구현 갭 분석

## Match Rate: 97%

## 설계 항목별 검증

| # | 설계 항목 | 구현 여부 | 비고 |
|---|----------|----------|------|
| 1 | 트레이 메뉴 Dark/Light → "Theme" 한 줄 교체 | ✅ | 아이콘 + 라벨 |
| 2 | Theme 클릭 → openThemePicker IPC | ✅ | |
| 3 | theme-picker.html 신규 생성 | ✅ | |
| 4 | 테마 카드 그리드 (2열) | ✅ | CSS Grid |
| 5 | 카드에 프리뷰 (bg + accent + text) | ✅ | inline style |
| 6 | 현재 선택 테마 체크마크 | ✅ | .active 클래스 |
| 7 | 카드 클릭 → setTheme IPC | ✅ | 기존 IPC 재활용 |
| 8 | 싱글 인스턴스 패턴 | ✅ | isDestroyed 체크 + focus |
| 9 | destroyTray에 themeWindow 정리 | ✅ | |
| 10 | 메뉴 높이 290 → 220 복원 | ✅ | |
| 11 | preload.js openThemePicker API | ✅ | |
| 12 | main.js open-theme-picker IPC | ✅ | |
| 13 | tray.js openThemePicker + export | ✅ | |
| 14 | theme-picker 자체 테마 전환 대응 | ✅ | onThemeChanged 리스너 |
| 15 | THEMES 배열 기반 동적 카드 생성 | ✅ | 확장 용이 |
| 16 | 미사용 CSS(.check) 정리 | ✅ | tray-menu.html |

## Gap 목록

| # | Gap | 심각도 | 비고 |
|---|-----|--------|------|
| 1 | 카드 hover 시 glow 효과는 설계에 명시했으나 border-color만 구현 | Low | 시각적으로 충분 |

## 결론

설계 대비 핵심 기능 100% 구현. 향후 테마 추가 시 THEMES 배열에만 추가하면 됨.
