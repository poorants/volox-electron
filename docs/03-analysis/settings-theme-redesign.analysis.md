# Gap Analysis: settings-theme-redesign

## Match Rate: 100%

| # | 검증 항목 | 결과 |
|---|-----------|------|
| 1 | Windows 기본 타이틀바 제거 (`frame: false`) | PASS |
| 2 | 커스텀 타이틀바 드래그 가능 | PASS |
| 3 | ✕ 버튼 닫기 동작 | PASS |
| 4 | 보라색 테마 스크롤바 | PASS |
| 5 | 기존 기능 정상 유지 | PASS |

## 개선 사항 (설계 대비)
- 스크롤바를 `.content` 컨테이너에 스코핑 (전역보다 정확)
- `.content` wrapper로 타이틀바/콘텐츠 분리 (flex layout)
- `min-height: 40px` 방어적 스타일 추가
