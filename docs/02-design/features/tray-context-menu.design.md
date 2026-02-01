# Design: tray-context-menu

> 트레이 컨텍스트 메뉴를 앱 디자인 시스템에 맞는 커스텀 팝업으로 교체

## 1. 아키텍처

```
[Tray right-click] → tray.js (show/hide popup BrowserWindow)
                         ↕ IPC
                    tray-menu.html (커스텀 UI)
                         ↕ IPC
                    main.js (볼륨 상태, 뮤트 토글, 설정 열기, 종료)
```

## 2. 컴포넌트 설계

### 2.1 tray.js 변경

- `Menu.buildFromTemplate` + `tray.setContextMenu` 제거
- `tray.on('right-click')` 이벤트로 커스텀 팝업 표시
- macOS: `tray.on('click')` 이벤트도 처리 (macOS는 right-click이 다르게 동작)
- 팝업 BrowserWindow 사전 생성 (show/hide 패턴으로 즉시 표시)

```javascript
// 팝업 윈도우 스펙
{
  width: 280,
  height: 220,
  frame: false,
  transparent: true,
  resizable: false,
  skipTaskbar: true,
  alwaysOnTop: true,
  show: false,
  webPreferences: {
    preload: 'preload.js',
    contextIsolation: true,
  }
}
```

### 2.2 팝업 위치 계산

```javascript
function getMenuPosition(trayBounds) {
  const { screen } = require('electron');
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });
  const { width: sw, height: sh } = display.workArea;

  // 트레이 아이콘 위에 표시 (Windows: 하단 작업표시줄, macOS: 상단 메뉴바)
  let x = Math.round(trayBounds.x - 140 + trayBounds.width / 2);
  let y;

  if (process.platform === 'darwin') {
    y = trayBounds.y + trayBounds.height + 4;
  } else {
    y = trayBounds.y - 220 - 4;
  }

  // 화면 경계 보정
  x = Math.max(display.workArea.x, Math.min(x, display.workArea.x + sw - 280));
  y = Math.max(display.workArea.y, Math.min(y, display.workArea.y + sh - 220));

  return { x, y };
}
```

### 2.3 tray-menu.html UI 구조

```
┌─────────────────────────┐
│  🔊 Volume         72%  │  ← 현재 볼륨 표시
│  ╠══════════░░░░░░░░░╣  │  ← 볼륨 슬라이더 (드래그 가능)
│─────────────────────────│
│  🔇 Mute                │  ← 뮤트 토글
│─────────────────────────│
│  ⚙ Settings             │  ← 설정 열기
│  ✕ Quit                 │  ← 종료
└─────────────────────────┘
```

- 디자인: OSD와 동일한 glass morphism (backdrop-filter: blur(20px), 반투명 배경)
- 앱 CSS 변수 공유 (--voly-500, --surface-0 등)
- hover 시 neon glow 효과

### 2.4 IPC 통신

| Channel | Direction | Data |
|---------|-----------|------|
| `get-volume-state` | renderer → main | - |
| (return) | main → renderer | `{ volume: number, muted: boolean }` |
| `set-volume` | renderer → main | `{ volume: number }` |
| `toggle-mute` | renderer → main | - |
| `open-settings` | renderer → main | - |
| `quit-app` | renderer → main | - |
| `tray-menu-action` | main → renderer | `{ action: 'show' \| 'hide', volume, muted }` |

### 2.5 preload.js 추가 API

```javascript
// 트레이 메뉴용 추가
getTrayMenuState: () => ipcRenderer.invoke('get-volume-state'),
setVolume: (vol) => ipcRenderer.invoke('set-volume', vol),
trayToggleMute: () => ipcRenderer.invoke('toggle-mute-from-tray'),
openSettings: () => ipcRenderer.invoke('open-settings'),
quitApp: () => ipcRenderer.invoke('quit-app'),
onTrayMenuUpdate: (cb) => ipcRenderer.on('tray-menu-action', (_e, d) => cb(d)),
```

## 3. 구현 순서

1. `renderer/tray-menu.html` 생성 (UI + 스타일 + 스크립트)
2. `electron/preload.js` 트레이 메뉴 API 추가
3. `electron/main.js` IPC 핸들러 추가
4. `electron/tray.js` 네이티브 메뉴 → 커스텀 팝업 전환

## 4. 디자인 토큰 (settings.html과 공유)

```css
--voly-400: #A78BFA;
--voly-500: #8B5CF6;
--voly-600: #7C3AED;
--voly-glow: rgba(139, 92, 246, 0.4);
--surface-0: #09090B;
--surface-1: #18181B;
--surface-2: #27272A;
--border: #3F3F46;
--border-accent: rgba(139, 92, 246, 0.2);
--text-primary: #FAFAFA;
--text-secondary: #A1A1AA;
--text-tertiary: #71717A;
--mute-red: #EF4444;
```
