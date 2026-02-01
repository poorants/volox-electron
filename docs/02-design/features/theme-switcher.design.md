# Design: theme-switcher

> 트레이 메뉴 테마 선택 + 런타임 테마 전환

## 1. 각 HTML의 link 구조

```html
<link rel="stylesheet" href="theme.css">
<link rel="stylesheet" href="theme-dark.css" id="theme-variant">
```

테마 전환 시 `#theme-variant`의 href를 `theme-light.css`로 교체.

## 2. 공통 테마 전환 스크립트 (각 HTML에 포함)

```javascript
window.electronAPI.onThemeChanged((theme) => {
  document.getElementById('theme-variant').href = 'theme-' + theme + '.css';
});
```

## 3. settings.js schema 추가

```javascript
theme: {
  type: 'string',
  enum: ['dark', 'light'],
  default: 'dark',
}
```

getSettings/saveSettings에 theme 포함.

## 4. IPC 핸들러 (main.js)

```javascript
ipcMain.handle('get-theme', () => store.get('theme'));
ipcMain.handle('set-theme', (_event, theme) => {
  store.set('theme', theme);
  // Broadcast to all windows
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('theme-changed', theme);
  });
});
```

## 5. preload.js 추가 API

```javascript
getTheme: () => ipcRenderer.invoke('get-theme'),
setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
onThemeChanged: (cb) => ipcRenderer.on('theme-changed', (_e, theme) => cb(theme)),
```

## 6. 트레이 메뉴 UI 변경

Mute와 Settings 사이에 Theme 섹션 추가:

```
│  🔇 Mute                │
│─────────────────────────│
│  🌙 Dark            ✓   │  ← 현재 선택 표시
│  ☀️ Light                │
│─────────────────────────│
│  ⚙ Settings             │
```

## 7. tray.js 변경

- menuH: 220 → 280
- openSettings에서 backgroundColor를 테마에 따라 분기:
  - dark: '#09090B'
  - light: '#FFFFFF'

## 8. 초기 로드

각 HTML의 `<script>` init에서:
```javascript
const theme = await window.electronAPI.getTheme();
document.getElementById('theme-variant').href = 'theme-' + theme + '.css';
```

## 9. 구현 순서

1. settings.js — schema에 theme 추가
2. preload.js — 테마 API 추가
3. main.js — set-theme / get-theme IPC
4. theme.css — @import 제거
5. osd.html — link 추가 + 테마 스크립트
6. settings.html — link 추가 + 테마 스크립트
7. tray-menu.html — link 추가 + Theme 선택 UI + 테마 스크립트
8. tray.js — 메뉴 높이 조정 + backgroundColor 동적
