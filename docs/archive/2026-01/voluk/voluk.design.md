# Voly Design Document

> **Summary**: Windows 시스템 볼륨을 modifier+wheel로 조절하는 시스템 트레이 Electron 앱
>
> **Project**: Voly — "Volume, the way it should be."
> **Version**: 2.0.0
> **Author**: donghun.kim
> **Date**: 2026-01-31
> **Status**: Updated (rebrand + design system + new features)
> **Planning Doc**: [voluk.plan.md](../../01-plan/features/voluk.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- 시스템 트레이 상주, 메인 윈도우 없음
- 글로벌 마우스 휠 + modifier 키 조합으로 볼륨 제어
- 볼륨 뮤트 토글 지원
- 단축키 캡처 모드 (사용자 입력 대기 → 감지 → 적용)
- Electric Violet 네온 디자인 시스템
- OSD Glow Bar 오버레이

### 1.2 Design Principles

- 최소 리소스 사용 (트레이 전용 모드)
- Main Process에서 모든 시스템 제어 처리 (보안 유지)
- IPC 통신으로 Main ↔ Renderer 분리
- node-gyp 불필요한 패키지만 사용
- 다크 배경 + 바이올렛 글로우로 방해 없는 존재감

---

## 2. Design System

### 2.1 Color Tokens

```css
:root {
  /* Prime: Electric Violet */
  --voly-50: #F5F3FF;
  --voly-100: #EDE9FE;
  --voly-300: #C4B5FD;
  --voly-400: #A78BFA;
  --voly-500: #8B5CF6;   /* ★ Prime */
  --voly-600: #7C3AED;
  --voly-700: #6D28D9;
  --voly-glow: rgba(139, 92, 246, 0.4);
  --voly-glow-strong: rgba(139, 92, 246, 0.6);

  /* Surface: Zinc Dark */
  --surface-0: #09090B;  /* 최하위 배경 */
  --surface-1: #18181B;  /* 카드/패널 */
  --surface-2: #27272A;  /* 입력 필드 */
  --border: #3F3F46;     /* 테두리 */
  --border-accent: rgba(139, 92, 246, 0.2); /* 액센트 테두리 */

  /* Text */
  --text-primary: #FAFAFA;
  --text-secondary: #A1A1AA;
  --text-tertiary: #71717A;

  /* Semantic */
  --mute-red: #EF4444;
  --mute-red-glow: rgba(239, 68, 68, 0.4);
  --success: #22C55E;
}
```

### 2.2 Typography

```css
font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;

/* Scale */
--text-xs: 11px;    /* 라벨, 힌트 */
--text-sm: 13px;    /* 보조 텍스트 */
--text-base: 14px;  /* 기본 */
--text-lg: 16px;    /* 섹션 타이틀 */
--text-xl: 20px;    /* 페이지 타이틀 */
--text-2xl: 28px;   /* OSD 퍼센트 값 */
```

### 2.3 Shared Effects

```css
/* Glass Card */
.glass {
  background: rgba(9, 9, 11, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-accent);
  border-radius: 16px;
}

/* Glow Shadow */
.glow {
  box-shadow: 0 0 20px var(--voly-glow),
              0 0 40px rgba(139, 92, 246, 0.15);
}

/* Pulse Animation (캡처 모드) */
@keyframes capture-pulse {
  0%, 100% { border-color: var(--voly-500); box-shadow: 0 0 8px var(--voly-glow); }
  50% { border-color: var(--voly-400); box-shadow: 0 0 16px var(--voly-glow-strong); }
}
```

---

## 3. Architecture

### 3.1 Component Diagram

```
┌──────────────────────────────────────────────────────────┐
│ Main Process                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ TrayManager  │  │ InputHook    │  │ SettingsStore │  │
│  │ (Vy 아이콘)   │  │ (koffi +     │  │ (electron-    │  │
│  │              │  │  WH_MOUSE_LL │  │  store)       │  │
│  │              │  │  WH_KEYBOARD │  │               │  │
│  └──────────────┘  └──────┬───────┘  └───────────────┘  │
│                           │                              │
│         ┌─────────────────┼─────────────────┐            │
│         │                 │                 │            │
│  ┌──────▼───────┐  ┌─────▼──────┐  ┌───────▼────────┐   │
│  │ VolumeCtrl   │  │ MuteCtrl   │  │ ShortcutCapture│   │
│  │ (loudness)   │  │ (loudness) │  │ Manager        │   │
│  └──────────────┘  └────────────┘  └────────────────┘   │
│                                     │ IPC                │
├─────────────────────────────────────┼────────────────────┤
│ Renderer Process                    │                    │
│  ┌────────────────────┐  ┌──────────▼───────────┐        │
│  │ Settings Window    │  │ OSD Overlay Window   │        │
│  │ - Shortcut Capture │  │ - Glow Bar           │        │
│  │ - Violet theme     │  │ - Glass card         │        │
│  └────────────────────┘  └──────────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
[볼륨 조절]
  User: Alt + Wheel → WH_MOUSE_LL 감지
  → SpeedMultiplier 계산
  → loudness.setVolume(newLevel)
  → IPC → OSD: Glow Bar 표시 (fade in)
  → 1.5초 후 fade out

[뮤트 토글]
  User: Alt + Middle Click → WH_MOUSE_LL 감지
  → loudness.getMuted() → toggle
  → loudness.setMuted(!current)
  → IPC → OSD: 뮤트 상태 표시 (빨간 글로우)

[단축키 캡처]
  Settings UI: 단축키 필드 클릭
  → IPC → Main: startCapture(actionId)
  → InputHook: 캡처 모드 진입 (다음 입력 감지)
  → User: modifier + wheel/click 입력
  → Main → IPC → Settings UI: 감지된 조합 표시
  → Save 클릭 → SettingsStore 저장
```

### 3.3 Dependencies

| Package | Version | Purpose | node-gyp |
|---------|---------|---------|----------|
| `electron` | ^40.x | 데스크톱 앱 프레임워크 | No |
| `koffi` | ^2.15 | Win32 API FFI (마우스/키보드 훅) | No |
| `loudness` | ^0.4 | Windows Core Audio 볼륨/뮤트 제어 | No |
| `electron-store` | ^11.x | 설정 로컬 저장 (JSON schema) | No |
| `electron-builder` | ^26.x | 빌드/패키징 | No |

---

## 4. Data Model

### 4.1 Settings Schema

```javascript
const schema = {
  shortcuts: {
    type: 'object',
    properties: {
      volumeUp: {
        type: 'object',
        properties: {
          modifier: { type: 'string', enum: ['alt', 'ctrl', 'shift', 'meta'], default: 'alt' },
          trigger: { type: 'string', default: 'wheelUp' },
          // trigger 가능값: 'wheelUp', 'wheelDown', 'middleClick'
        },
        default: { modifier: 'alt', trigger: 'wheelUp' },
      },
      volumeDown: {
        type: 'object',
        properties: {
          modifier: { type: 'string', enum: ['alt', 'ctrl', 'shift', 'meta'], default: 'alt' },
          trigger: { type: 'string', default: 'wheelDown' },
        },
        default: { modifier: 'alt', trigger: 'wheelDown' },
      },
      mute: {
        type: 'object',
        properties: {
          modifier: { type: 'string', enum: ['alt', 'ctrl', 'shift', 'meta'], default: 'alt' },
          trigger: { type: 'string', default: 'middleClick' },
        },
        default: { modifier: 'alt', trigger: 'middleClick' },
      },
    },
    default: {
      volumeUp: { modifier: 'alt', trigger: 'wheelUp' },
      volumeDown: { modifier: 'alt', trigger: 'wheelDown' },
      mute: { modifier: 'alt', trigger: 'middleClick' },
    },
  },
  volume: {
    type: 'object',
    properties: {
      step: { type: 'number', minimum: 1, maximum: 10, default: 2 },
    },
    default: { step: 2 },
  },
  osd: {
    type: 'object',
    properties: {
      duration: { type: 'number', default: 1500 },
    },
    default: { duration: 1500 },
  },
};
```

### 4.2 IPC Channels

```javascript
// Main → OSD Renderer
'osd-update': {
  type: 'volume' | 'mute',
  value: number,       // 0-100 (volume) or 0/1 (mute)
  isMuted: boolean,
  action: 'show' | 'hide'
}

// Settings Window ↔ Main
'get-settings'         // invoke → Settings object
'save-settings'        // invoke(settings) → boolean

// Shortcut Capture
'start-capture'        // invoke(actionId) → void (캡처 모드 시작)
'cancel-capture'       // invoke → void (캡처 취소)
'capture-result'       // Main → Settings: { actionId, modifier, trigger }
```

### 4.3 Preload API (contextBridge)

```javascript
window.electronAPI = {
  platform: string,
  // OSD
  onOsdUpdate: (callback) => void,
  // Settings
  getSettings: () => Promise<Settings>,
  saveSettings: (settings) => Promise<boolean>,
  // Shortcut Capture
  startCapture: (actionId) => Promise<void>,
  cancelCapture: () => Promise<void>,
  onCaptureResult: (callback) => void,
};
```

---

## 5. UI/UX Design

### 5.1 Tray Icon — "Vy" Lettermark

```
States:
┌─────────┬──────────────────────────────────┐
│ Normal  │ Vy (--voly-500 violet on trans.) │
│ Muted   │ Vy (--text-tertiary gray) + red dot │
│ Active  │ Vy (--voly-400 bright) + glow    │
└─────────┴──────────────────────────────────┘

Icon files:
- assets/tray-icon.ico      (16x16, 32x32 multi-res)
- assets/tray-icon-mute.ico
```

### 5.2 OSD Overlay — Glow Bar

```
┌─────────────────────────────────────────────┐
│           (transparent full screen)         │
│                                             │
│                                             │
│    ┌───────────────────────────────────┐    │
│    │                                   │    │
│    │  🔊  Volume               72%     │    │
│    │  ┌───────────────────────────┐    │    │
│    │  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░│    │    │
│    │  └───────────────────────────┘    │    │
│    │   ↑ Glow: box-shadow violet      │    │
│    │                                   │    │
│    └───────────────────────────────────┘    │
│     ↑ Glass card + border-accent           │
└─────────────────────────────────────────────┘

[Mute 상태]
┌───────────────────────────────────┐
│                                   │
│  🔇  Muted                       │
│  ┌───────────────────────────┐    │
│  │░░░░░░░░░░░░░░░░░░░░░░░░░│    │  ← 빨간 글로우
│  └───────────────────────────┘    │
│                                   │
└───────────────────────────────────┘
```

**OSD 스펙:**
- 위젯 크기: 320px × 72px
- Glass card: `rgba(9,9,11,0.75)` + `backdrop-blur(20px)` + `border: 1px solid var(--border-accent)`
- 바 높이: 6px, `border-radius: 3px`
- 바 색상: `linear-gradient(90deg, var(--voly-600), var(--voly-400))`
- 바 글로우: `box-shadow: 0 0 12px var(--voly-glow), 0 0 4px var(--voly-glow-strong)`
- Mute 바: `var(--mute-red)` + `box-shadow: 0 0 12px var(--mute-red-glow)`
- 퍼센트 텍스트: `--text-2xl`, `font-weight: 600`, `--text-primary`
- 라벨: `--text-xs`, `letter-spacing: 0.05em`, `--text-secondary`
- 아이콘: 24px, volume 레벨에 따라 변경

**애니메이션:**
- Fade in: `opacity 0→1`, `translateY(8px→0)`, `180ms cubic-bezier(0.16, 1, 0.3, 1)`
- Fade out: `opacity 1→0`, `translateY(0→8px)`, `250ms ease-in`
- 바 width: `transition: width 120ms ease-out`
- 바 글로우: `transition: box-shadow 120ms ease-out`

### 5.3 Settings Window

```
┌──────────────────────────────────────────┐
│                                     — × │
│  ┌──┐                                   │
│  │Vy│  Voly                              │
│  └──┘  Volume, the way it should be.     │
│                                          │
│  ┌─ SHORTCUTS ─────────────────────────┐ │
│  │                                     │ │
│  │  Volume Up                          │ │
│  │  ┌──────────────────────────  ┌─┐ │ │
│  │  │  Alt + Wheel Up            │⟳│ │ │
│  │  └──────────────────────────  └─┘ │ │
│  │                                     │ │
│  │  Volume Down                        │ │
│  │  ┌──────────────────────────  ┌─┐ │ │
│  │  │  Alt + Wheel Down          │⟳│ │ │
│  │  └──────────────────────────  └─┘ │ │
│  │                                     │ │
│  │  Mute Toggle                        │ │
│  │  ┌──────────────────────────  ┌─┐ │ │
│  │  │  Alt + Middle Click        │⟳│ │ │
│  │  └──────────────────────────  └─┘ │ │
│  │                                     │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─ VOLUME ────────────────────────────┐ │
│  │                                     │ │
│  │  Step Size                          │ │
│  │  ●━━━━━━━━━○──────────────── 2%     │ │
│  │                                     │ │
│  └─────────────────────────────────────┘ │
│                                          │
│         ┌────────┐   ┌────────┐          │
│         │  Save  │   │ Reset  │          │
│         └────────┘   └────────┘          │
│          ↑ violet      ↑ ghost           │
│            glow btn      btn             │
│                                          │
│  v1.0.0                                  │
└──────────────────────────────────────────┘
```

**Settings 스펙:**
- 윈도우 크기: 420px × 520px
- 배경: `--surface-0`
- 카드 섹션: `--surface-1` + `border: 1px solid var(--border)` + `border-radius: 12px`
- 섹션 타이틀: `--text-xs`, `letter-spacing: 0.1em`, `text-transform: uppercase`, `--text-tertiary`
- 단축키 필드: `--surface-2` + `border-radius: 8px` + `padding: 10px 14px`
- 단축키 필드 호버: `border: 1px solid var(--border)`
- 단축키 캡처 모드: `animation: capture-pulse 1.5s infinite`, 텍스트 "Press shortcut..."
- [⟳] 리셋 버튼: `--text-tertiary`, 호버 시 `--voly-400`
- Save 버튼: `background: var(--voly-600)`, `box-shadow: 0 0 16px var(--voly-glow)`, 호버 `--voly-500`
- Reset 버튼: `background: transparent`, `border: 1px solid var(--border)`, `--text-secondary`
- 슬라이더 트랙: `--surface-2`, thumb: `--voly-500`

### 5.4 Shortcut Capture Flow (UI States)

```
[기본 상태]
┌────────────────────────────────┐
│  Alt + Wheel Up           [⟳] │  ← --surface-2, --text-primary
└────────────────────────────────┘

[캡처 대기 - 클릭 후]
┌────────────────────────────────┐
│  Press shortcut...        [✕] │  ← 보라 펄스 테두리, --text-tertiary
└────────────────────────────────┘
  animation: capture-pulse 1.5s infinite

[캡처 완료 - 입력 감지]
┌────────────────────────────────┐
│  Ctrl + Wheel Up          [⟳] │  ← --voly-500 테두리 잠시 유지, --text-primary
└────────────────────────────────┘
  border-color: --voly-500 → 1초 후 기본으로 복귀
```

---

## 6. Module Design

### 6.1 Main Process Modules

| Module | File | Responsibility |
|--------|------|----------------|
| `main` | `electron/main.js` | 앱 진입점, 모듈 조합, 휠 속도 가속 |
| `TrayManager` | `electron/tray.js` | Vy 트레이 아이콘, 컨텍스트 메뉴, 뮤트 상태 아이콘 전환 |
| `InputHook` | `electron/input-hook.js` | WH_MOUSE_LL 훅, modifier 감지, 캡처 모드 |
| `VolumeController` | `electron/volume.js` | loudness 볼륨/뮤트 제어 |
| `SettingsStore` | `electron/settings.js` | electron-store 설정 저장/로드 |
| `OsdManager` | `electron/osd.js` | OSD 윈도우 생성/표시/숨김 |
| `Preload` | `electron/preload.js` | contextBridge IPC API |

### 6.2 Renderer Files

| File | Responsibility |
|------|----------------|
| `renderer/osd.html` | OSD Glow Bar UI, 볼륨/뮤트 표시, 애니메이션 |
| `renderer/settings.html` | Settings UI, 단축키 캡처, 슬라이더, 버튼 |

---

## 7. InputHook 상세

### 7.1 WH_MOUSE_LL (기존 유지)

```javascript
// koffi로 user32.dll WH_MOUSE_LL 훅
// modifier 감지: GetAsyncKeyState(VK_MENU/VK_CONTROL/VK_SHIFT/VK_LWIN)
// wheel delta: MSLLHOOKSTRUCT.mouseData 상위 16비트
// middle click: WM_MBUTTONDOWN (0x0207) 감지 추가 필요
```

### 7.2 Middle Click 감지 (신규)

```javascript
const WM_MBUTTONDOWN = 0x0207;

// 콜백에 추가:
if (nCode >= 0 && wParam === WM_MBUTTONDOWN) {
  // modifier 체크 → mute 설정과 매칭 시 뮤트 토글
}
```

### 7.3 캡처 모드

```javascript
let captureMode = false;
let captureActionId = null;

function startCapture(actionId) {
  captureMode = true;
  captureActionId = actionId;
  // 다음 modifier + trigger 입력을 감지하여 반환
}

// 콜백 내부:
if (captureMode) {
  // 어떤 modifier가 눌렸는지 + 어떤 trigger인지 감지
  // { modifier: 'ctrl', trigger: 'wheelUp' } 형태로 IPC 전송
  // captureMode = false
  return; // 이벤트는 소비하지 않고 통과
}
```

### 7.4 Wheel Speed Multiplier (기존 유지)

```javascript
let lastWheelTime = 0;
function getSpeedMultiplier() {
  const now = Date.now();
  const interval = now - lastWheelTime;
  lastWheelTime = now;
  if (interval < 50) return 4;
  if (interval < 100) return 3;
  if (interval < 150) return 2;
  return 1;
}
```

---

## 8. Volume/Mute Controller 상세

### 8.1 loudness API 사용

```javascript
const loudness = require('loudness');

// 볼륨
async function adjustVolume(direction, step) {
  const current = await loudness.getVolume();
  const change = Math.max(1, Math.round(step));
  const newLevel = direction === 'up'
    ? Math.min(100, current + change)
    : Math.max(0, current - change);
  await loudness.setVolume(newLevel);
  return newLevel;
}

// 뮤트 토글
async function toggleMute() {
  const muted = await loudness.getMuted();
  await loudness.setMuted(!muted);
  const volume = await loudness.getVolume();
  return { muted: !muted, volume };
}
```

---

## 9. OSD Window 구현 상세

### 9.1 BrowserWindow 옵션

```javascript
const osdWindow = new BrowserWindow({
  width: 340,
  height: 90,
  transparent: true,
  frame: false,
  alwaysOnTop: true,
  skipTaskbar: true,
  resizable: false,
  focusable: false,
  show: false,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
  },
});
osdWindow.setIgnoreMouseEvents(true);

// 화면 하단 중앙
const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
osdWindow.setPosition(
  Math.round((screenW - 340) / 2),
  screenH - 90 - 80
);
```

### 9.2 OSD 표시 로직

```
이벤트 → Main Process:
  1. 볼륨/뮤트 변경
  2. IPC: { type, value, isMuted, action: 'show' }
  3. osdWindow.showInactive()
  4. debounce 타이머 리셋 (duration ms)
  5. 타이머 만료 → IPC: { action: 'hide' }
  6. fade out (250ms) 후 osdWindow.hide()
```

---

## 10. Assets

### 10.1 Tray Icon

| File | Size | State |
|------|------|-------|
| `assets/tray-icon.ico` | 16x16, 32x32 | Normal (violet Vy) |
| `assets/tray-icon-mute.ico` | 16x16, 32x32 | Muted (gray Vy + red dot) |

### 10.2 Icon Design Spec

```
"Vy" Lettermark:
- Font: Bold geometric sans (Segoe UI Bold or custom)
- V: 왼쪽 정렬
- y: V에 이어서, y의 descender가 사운드 웨이브 곡선
- 색상: #8B5CF6 (normal), #71717A (muted)
- Muted: 우측 하단에 4px 빨간 원 (#EF4444)
```

---

## 11. Implementation Order

1. [x] koffi, loudness, electron-store 설치
2. [x] electron/main.js - 트레이 전용 모드
3. [x] electron/settings.js - SettingsStore
4. [x] electron/tray.js - TrayManager
5. [x] electron/volume.js - VolumeController
6. [x] electron/input-hook.js - WH_MOUSE_LL Hook
7. [x] electron/osd.js - OsdManager
8. [x] electron/preload.js - contextBridge
9. [x] renderer/osd.html - OSD UI
10. [x] renderer/settings.html - Settings UI
11. [x] Wheel speed multiplier
12. [ ] **프로젝트 리네임 (voluk → voly)**: package.json, CLAUDE.md 등
13. [ ] **Vy 트레이 아이콘 제작** (.ico)
14. [ ] **renderer/osd.html 리디자인**: Glow Bar + Glass card + Electric Violet
15. [ ] **renderer/settings.html 리디자인**: Violet 테마 + 단축키 캡처 UI
16. [ ] **electron/volume.js**: toggleMute 추가
17. [ ] **electron/input-hook.js**: WM_MBUTTONDOWN 감지 + 캡처 모드
18. [ ] **electron/settings.js**: 새 스키마 (shortcuts 구조)
19. [ ] **electron/main.js**: 뮤트 핸들링 + 캡처 IPC
20. [ ] **electron/preload.js**: 캡처 API 추가
21. [ ] **electron/tray.js**: 뮤트 상태 아이콘 전환
22. [ ] 빌드 및 배포 테스트

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-31 | Initial draft | donghun.kim |
| 1.1 | 2026-01-31 | 밝기 제거, 실제 기술스택 반영 | donghun.kim |
| 2.0 | 2026-01-31 | Voly 리브랜드, Electric Violet 디자인 시스템, 뮤트/캡처 추가 | donghun.kim |
