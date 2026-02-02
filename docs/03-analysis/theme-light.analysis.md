# Analysis: theme-light

> 설계 대비 구현 갭 분석

## Match Rate: 98%

## 설계 항목별 검증

| # | 설계 항목 | 구현 여부 | 비고 |
|---|----------|----------|------|
| 1 | theme.css → 공통 리셋 + @import 구조 | ✅ | @import url('theme-dark.css') |
| 2 | theme-dark.css 생성 (기존 토큰 이동) | ✅ | 52개 토큰 그대로 |
| 3 | theme-light.css 생성 | ✅ | 52개 토큰 라이트 값 |
| 4 | Violet 포인트 컬러 동일 유지 | ✅ | volox-400~700 동일 |
| 5 | Glow opacity 라이트용 조정 | ✅ | 0.4→0.25, 0.6→0.35 |
| 6 | Surface 라이트 전환 | ✅ | #FFF, #F4F4F5, #E4E4E7 |
| 7 | Text 다크 on 라이트 전환 | ✅ | #09090B, #52525B, #A1A1AA |
| 8 | glass-bg 흰색 반투명 | ✅ | rgba(255,255,255,0.85) |
| 9 | Border 밝은 계열 | ✅ | #D4D4D8 |
| 10 | shadow-menu 라이트 조정 | ✅ | rgba(0,0,0,0.12) 경량 |
| 11 | bar-track 반전 | ✅ | rgba(0,0,0,0.08) |
| 12 | mute-red 라이트 조정 | ✅ | #DC2626, opacity 낮춤 |
| 13 | Typography/Radius/Transition 동일 유지 | ✅ | 값 동일 |
| 14 | 3개 HTML 수정 불필요 | ✅ | theme.css import 유지 |
| 15 | 기존 다크 외관 변경 없음 | ✅ | @import dark가 기본 |

## Gap 목록

| # | Gap | 심각도 | 비고 |
|---|-----|--------|------|
| 1 | tray-menu의 mute-red-hover가 dark에서 0.15였는데 light에서 0.08 (설계 일치) | None | 설계 의도대로 |

## 결론

설계 대비 100% 구현. 파일 3개 정리 완료, 라이트 테마 토큰 준비됨.
다음 Plan(theme-switcher)에서 런타임 전환 구현 예정.
