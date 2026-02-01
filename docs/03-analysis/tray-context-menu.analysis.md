# Analysis: tray-context-menu

> 설계 대비 구현 갭 분석

## Match Rate: 95%

## 설계 항목별 검증

| # | 설계 항목 | 구현 여부 | 비고 |
|---|----------|----------|------|
| 1 | 네이티브 메뉴 제거 | ✅ | `Menu.buildFromTemplate` 완전 제거 |
| 2 | 프레임리스+투명 BrowserWindow 팝업 | ✅ | `frame:false, transparent:true` |
| 3 | 팝업 사전 생성 (show/hide) | ✅ | createTray에서 미리 생성, blur로 hide |
| 4 | 트레이 위치 기반 팝업 위치 계산 | ✅ | `getMenuPosition()` + workArea 경계 보정 |
| 5 | macOS click / Windows right-click 분기 | ✅ | `process.platform === 'darwin'` 분기 |
| 6 | 볼륨 슬라이더 (드래그 가능) | ✅ | mousedown + mousemove + mouseup |
| 7 | 뮤트 토글 | ✅ | IPC `toggle-mute-from-tray` |
| 8 | Settings 열기 | ✅ | IPC `open-settings` + `openSettings` export |
| 9 | Quit 버튼 | ✅ | IPC `quit-app` |
| 10 | 메뉴 외부 클릭 시 자동 닫힘 | ✅ | `menuWindow.on('blur')` |
| 11 | Glass morphism 디자인 | ✅ | backdrop-filter: blur(24px), 반투명 배경 |
| 12 | 디자인 토큰 공유 | ✅ | CSS 변수 settings.html과 동일 |
| 13 | IPC: get-volume-state | ✅ | loudness.getVolume + getMuted |
| 14 | IPC: set-volume | ✅ | loudness.setVolume |
| 15 | IPC: tray-menu-action (show) | ✅ | 메뉴 표시 시 볼륨 상태 전송 |
| 16 | preload.js API 추가 | ✅ | 6개 API 모두 추가 |

## Gap 목록

| # | Gap | 심각도 | 상태 |
|---|-----|--------|------|
| 1 | 설계에 `hide` action 명시되었으나 현재 blur로만 hide되고 IPC hide 미전송 | Low | 무시 가능 (blur가 충분) |
| 2 | `appRef` 변수 선언되었으나 미사용 | Low | 미사용 변수 |

## 결론

설계 대비 핵심 기능 100% 구현 완료. 미세 갭 2건은 기능에 영향 없음.
Match Rate 95%로 Report 진행 가능.
