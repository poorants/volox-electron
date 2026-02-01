# Plan: tray-context-menu

> 트레이 아이콘 우클릭 컨텍스트 메뉴를 앱 디자인 시스템에 맞게 커스텀 UI로 교체

## 1. 배경 (Background)

현재 트레이 아이콘 우클릭 시 OS 네이티브 메뉴(`Menu.buildFromTemplate`)가 표시된다.
- 메뉴 항목: Settings, Quit (2개)
- OS 기본 스타일이라 앱의 Dark + Glass morphism + Neon glow 테마와 불일치
- 앱 브랜드 아이덴티티가 트레이 메뉴에서 전혀 드러나지 않음

## 2. 목표 (Goals)

- OS 네이티브 메뉴 대신 커스텀 BrowserWindow 팝업 메뉴 구현
- 앱 디자인 시스템(Electric Violet, Dark theme, Glass morphism) 적용
- 현재 볼륨 상태 표시 (볼륨 레벨, 뮤트 상태)
- 메뉴 항목 확장: 볼륨 슬라이더, 뮤트 토글, Settings, Quit

## 3. 요구사항 (Requirements)

### 기능 요구사항
- [ ] 트레이 아이콘 우클릭 시 커스텀 팝업 메뉴 표시
- [ ] 현재 볼륨 레벨 표시 (숫자 + 슬라이더)
- [ ] 뮤트 토글 버튼
- [ ] Settings 열기
- [ ] Quit 버튼
- [ ] 메뉴 외부 클릭 시 자동 닫힘

### 비기능 요구사항
- [ ] 앱 디자인 시스템 준수 (--voly-500, --surface-0, glass morphism)
- [ ] 트레이 아이콘 위치 기반으로 팝업 위치 자동 계산
- [ ] Windows / macOS 모두 지원
- [ ] 메뉴 표시 지연 없음 (사전 생성 + show/hide 패턴)

## 4. 범위 (Scope)

### In Scope
- 커스텀 BrowserWindow 기반 팝업 메뉴
- 메뉴 HTML/CSS (renderer/tray-menu.html)
- 트레이 우클릭 이벤트 핸들링 변경
- IPC 통신 (볼륨 상태 조회, 뮤트 토글, 설정 열기, 종료)

### Out of Scope
- 트레이 아이콘 자체 디자인 변경
- OSD 디자인 변경
- 새로운 설정 항목 추가

## 5. 기술 접근 (Technical Approach)

- `Menu.buildFromTemplate` 제거, `tray.on('right-click')` 이벤트로 전환
- 프레임리스 + 투명 BrowserWindow를 팝업 메뉴로 사용
- 트레이 아이콘 bounds 기반 위치 계산 (`tray.getBounds()`)
- 포커스 잃으면 자동 hide (`blur` 이벤트)
- IPC 핸들러로 메인 프로세스와 통신

## 6. 영향 분석 (Impact)

| 파일 | 변경 내용 |
|------|----------|
| `electron/tray.js` | 네이티브 메뉴 제거, 커스텀 팝업 윈도우 생성/관리 |
| `renderer/tray-menu.html` | 신규 - 커스텀 메뉴 UI |
| `electron/main.js` | IPC 핸들러 추가 (볼륨 상태, 뮤트 토글) |

## 7. 리스크 (Risks)

| 리스크 | 대응 |
|--------|------|
| 트레이 위치 계산이 OS별로 다름 | `tray.getBounds()` + `screen.getDisplayNearestPoint()` 조합 |
| 팝업이 화면 밖으로 나갈 수 있음 | 화면 경계 체크 후 위치 보정 |
| macOS에서 right-click 이벤트 동작 차이 | macOS는 click 이벤트 + popUpContextMenu 대체 방안 검토 |
