# Report: tray-context-menu

> 트레이 컨텍스트 메뉴 커스텀 UI 교체 완료 보고서

## 요약

OS 네이티브 트레이 컨텍스트 메뉴를 앱 디자인 시스템(Electric Violet + Dark + Glass morphism)에 맞는 커스텀 BrowserWindow 팝업으로 교체.

## 결과

| 항목 | 값 |
|------|-----|
| Match Rate | 95% |
| 반복 횟수 | 0 (1회 구현으로 통과) |
| 변경 파일 수 | 4 (신규 1, 수정 3) |

## 변경 파일

| 파일 | 변경 |
|------|------|
| `renderer/tray-menu.html` | **신규** - 커스텀 팝업 메뉴 UI |
| `electron/tray.js` | 네이티브 메뉴 → 커스텀 BrowserWindow 팝업 |
| `electron/preload.js` | 트레이 메뉴 IPC API 6개 추가 |
| `electron/main.js` | IPC 핸들러 5개 추가 |

## 구현 기능

- 볼륨 슬라이더 (드래그로 실시간 조절)
- 뮤트 토글 (아이콘 + 라벨 동적 변경)
- Settings 열기
- Quit 버튼
- 외부 클릭 시 자동 닫힘
- 트레이 위치 기반 팝업 자동 배치 (화면 경계 보정)
- Windows / macOS 크로스 플랫폼 지원

## 디자인

- Glass morphism: `backdrop-filter: blur(24px)`, 반투명 배경 `rgba(9,9,11,0.82)`
- Electric Violet 그라데이션 슬라이더 + Neon glow
- 뮤트 시 Red 테마 전환
- hover 시 violet 하이라이트, Quit은 red 하이라이트
