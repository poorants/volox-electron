# Design: Cross-Platform macOS Support

> Plan 문서 기반 상세 설계

## 1. 아키텍처

### 변경 전
```
electron/
  input-hook.js    ← Windows 전용 단일 파일
  main.js          ← input-hook 직접 require
```

### 변경 후
```
electron/
  input-hook/
    index.js       ← platform 분기 라우터
    win32.js        ← 기존 코드 이동 (변경 없음)
    darwin.js       ← 신규: Electron globalShortcut 기반
  main.js          ← require 경로만 변경, 이벤트 매칭 확장
  settings.js      ← 플랫폼별 기본값 분기
  tray-icon.js     ← macOS Template 이미지 대응
```

## 2. 모듈 상세 설계

### 2-1. `electron/input-hook/index.js`

```js
if (process.platform === 'win32') {
  module.exports = require('./win32');
} else if (process.platform === 'darwin') {
  module.exports = require('./darwin');
} else {
  // 미지원 플랫폼: no-op
  module.exports = {
    startHook() {},
    stopHook() {},
    startCapture() {},
    cancelCapture() {},
  };
}
```

### 2-2. `electron/input-hook/win32.js`

- 기존 `input-hook.js`를 **그대로 이동** (코드 변경 없음)
- `koffi` require는 이 파일에서만 발생 → macOS에서 로드 안 됨

### 2-3. `electron/input-hook/darwin.js`

Electron `globalShortcut` 기반 구현.

**설계 핵심**:
- `startHook(onEvent)` 호출 시 현재 settings를 읽어서 globalShortcut 등록
- 이벤트 콜백 형태는 win32와 동일하게 맞춤

```js
const { globalShortcut } = require('electron');

// Electron accelerator 매핑
const MODIFIER_MAP = { alt: 'Alt', ctrl: 'Ctrl', shift: 'Shift', meta: 'Super' };
const TRIGGER_MAP = {
  arrowUp: 'Up',
  arrowDown: 'Down',
  keyM: 'M',
};

let eventHandler = null;
let registeredAccelerators = [];
let captureMode = false;
let captureCallback = null;

function startHook(onEvent) {
  eventHandler = onEvent;
  // 단축키 등록은 settings 변경 시 rebind 필요
  // main.js에서 settings 로드 후 bindShortcuts() 호출
}

function bindShortcuts(shortcuts) {
  unbindAll();
  for (const [action, sc] of Object.entries(shortcuts)) {
    const mod = MODIFIER_MAP[sc.modifier];
    const key = TRIGGER_MAP[sc.trigger];
    if (!mod || !key) continue;
    const accelerator = `${mod}+${key}`;
    globalShortcut.register(accelerator, () => {
      if (captureMode && captureCallback) {
        captureCallback({ modifier: sc.modifier, trigger: sc.trigger });
        captureMode = false;
        captureCallback = null;
        return;
      }
      if (eventHandler) {
        eventHandler({
          type: 'keyboard',
          action,           // 'volumeUp', 'volumeDown', 'mute'
          modifiers: { [sc.modifier]: true },
        });
      }
    });
    registeredAccelerators.push(accelerator);
  }
}

function unbindAll() {
  registeredAccelerators.forEach(a => globalShortcut.unregister(a));
  registeredAccelerators = [];
}

function stopHook() {
  unbindAll();
  eventHandler = null;
}

function startCapture(callback) {
  captureMode = true;
  captureCallback = callback;
}

function cancelCapture() {
  captureMode = false;
  captureCallback = null;
}

module.exports = { startHook, stopHook, startCapture, cancelCapture, bindShortcuts };
```

**핵심 차이점**: darwin.js는 `bindShortcuts(shortcuts)` 추가 export.
- globalShortcut은 등록 시 accelerator 문자열 필요 → settings 알아야 함
- win32는 훅에서 raw 이벤트를 받고 main.js에서 매칭
- darwin은 globalShortcut이 이미 매칭된 상태로 콜백 호출

### 2-4. `electron/main.js` 수정사항

**import 변경**:
```js
// Before:
const { startHook, stopHook, startCapture, cancelCapture } = require('./input-hook');
// After:
const inputHook = require('./input-hook');
```

**이벤트 핸들러 확장**:
```js
inputHook.startHook((event) => {
  const currentSettings = getSettings();
  const shortcuts = currentSettings.shortcuts;
  const osdDuration = currentSettings.osd.duration;

  // macOS: keyboard 이벤트는 action이 이미 결정됨
  if (event.type === 'keyboard') {
    if (event.action === 'volumeUp') {
      adjustVolume('up', currentSettings.volume.step).then(result => {
        showOsd('volume', result.volume, osdDuration, result.muted);
      });
    } else if (event.action === 'volumeDown') {
      adjustVolume('down', currentSettings.volume.step).then(result => {
        showOsd('volume', result.volume, osdDuration, result.muted);
      });
    } else if (event.action === 'mute') {
      toggleMute().then(result => {
        showOsd('mute', result.volume, osdDuration, result.muted);
        setTrayState(result.muted ? 'muted' : 'normal');
      });
    }
    return;
  }

  // Windows: 기존 wheel/middleClick 로직 그대로
  // ...
});

// darwin: settings 로드 후 바인딩
if (inputHook.bindShortcuts) {
  inputHook.bindShortcuts(getSettings().shortcuts);
}
```

**Settings 저장 시 rebind**:
```js
ipcMain.handle('save-settings', (_event, settings) => {
  saveSettings(settings);
  if (inputHook.bindShortcuts) {
    inputHook.bindShortcuts(getSettings().shortcuts);
  }
  return true;
});
```

### 2-5. `electron/settings.js` 수정사항

**플랫폼별 기본값**:
```js
const DEFAULTS_WIN32 = {
  volumeUp: { modifier: 'alt', trigger: 'wheelUp' },
  volumeDown: { modifier: 'alt', trigger: 'wheelDown' },
  mute: { modifier: 'alt', trigger: 'middleClick' },
};

const DEFAULTS_DARWIN = {
  volumeUp: { modifier: 'alt', trigger: 'arrowUp' },
  volumeDown: { modifier: 'alt', trigger: 'arrowDown' },
  mute: { modifier: 'alt', trigger: 'keyM' },
};

const shortcutDefaults = process.platform === 'darwin' ? DEFAULTS_DARWIN : DEFAULTS_WIN32;
```

- schema의 trigger enum에 `arrowUp`, `arrowDown`, `keyM` 추가
- schema default 값을 플랫폼별로 분기

### 2-6. `electron/tray-icon.js` 수정사항

macOS에서는 Template 이미지 사용:
```js
function createTrayIcon(state = 'normal') {
  // ... 기존 코드 ...
  const img = nativeImage.createFromBuffer(png);
  if (process.platform === 'darwin') {
    img.setTemplateImage(true);
  }
  return img;
}
```

기존 픽셀 기반 렌더링은 macOS에서도 동작. 다만 Template 이미지 설정 시 macOS가 자동으로 다크/라이트 모드 대응.

### 2-7. `renderer/settings.html` 수정사항

**TRIGGER_LABELS 확장**:
```js
const TRIGGER_LABELS = {
  wheelUp: 'Wheel Up',
  wheelDown: 'Wheel Down',
  middleClick: 'Middle Click',
  arrowUp: 'Up Arrow',
  arrowDown: 'Down Arrow',
  keyM: 'M Key',
};
```

**DEFAULTS 플랫폼 분기**:
```js
const platform = window.electronAPI.platform;
const DEFAULTS = platform === 'darwin'
  ? {
      volumeUp: { modifier: 'alt', trigger: 'arrowUp' },
      volumeDown: { modifier: 'alt', trigger: 'arrowDown' },
      mute: { modifier: 'alt', trigger: 'keyM' },
    }
  : {
      volumeUp: { modifier: 'alt', trigger: 'wheelUp' },
      volumeDown: { modifier: 'alt', trigger: 'wheelDown' },
      mute: { modifier: 'alt', trigger: 'middleClick' },
    };
```

**macOS 캡처 모드**: macOS에서 단축키 캡처 시 globalShortcut이 이미 등록된 상태이므로, 캡처 결과가 기존과 동일한 IPC로 전달됨. UI 변경 불필요.

### 2-8. `package.json` 수정사항

```json
{
  "dependencies": {
    "electron-store": "^11.0.2",
    "loudness": "^0.4.2"
  },
  "optionalDependencies": {
    "koffi": "^2.15.1"
  },
  "scripts": {
    "dev": "electron .",
    "build": "electron-builder",
    "build:mac": "electron-builder --mac",
    "build:win": "electron-builder --win"
  },
  "build": {
    "appId": "com.volox.app",
    "productName": "Volox",
    "directories": { "output": "dist" },
    "files": [
      "electron/**/*",
      "renderer/**/*",
      "assets/**/*",
      "package.json"
    ],
    "mac": {
      "target": "dmg",
      "category": "public.app-category.utilities"
    },
    "win": {
      "target": "nsis"
    }
  }
}
```

## 3. 구현 순서

| # | 파일 | 작업 | 의존 |
|---|------|------|------|
| 1 | `electron/input-hook/index.js` | 라우터 생성 | - |
| 2 | `electron/input-hook/win32.js` | 기존 코드 이동 | 1 |
| 3 | `electron/input-hook/darwin.js` | globalShortcut 구현 | 1 |
| 4 | `electron/input-hook.js` | 삭제 | 2 |
| 5 | `electron/settings.js` | 플랫폼별 기본값 | - |
| 6 | `electron/main.js` | import + 이벤트 핸들러 확장 | 1,3,5 |
| 7 | `electron/tray-icon.js` | Template 이미지 | - |
| 8 | `renderer/settings.html` | 라벨 + 기본값 분기 | 5 |
| 9 | `package.json` | koffi optional + 빌드 설정 | - |
