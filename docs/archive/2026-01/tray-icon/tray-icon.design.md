# Tray Icon Design Document

> **Project**: Voly
> **Feature**: tray-icon
> **Version**: 1.0.0
> **Author**: donghun.kim
> **Date**: 2026-01-31
> **Status**: Draft
> **Planning Doc**: [tray-icon.plan.md](../../01-plan/features/tray-icon.plan.md)

---

## 1. Overview

Canvas API로 런타임 생성하는 사운드 웨이브 트레이 아이콘. 퍼플 LED 시그널 점으로 활성/뮤트 상태를 표시한다.

---

## 2. Icon Rendering Spec

### 2.1 Canvas 설정

```javascript
// 16x16 (1x) 또는 32x32 (2x)
const size = 16; // or 32
const scale = size / 16; // 1 or 2
```

### 2.2 사운드 웨이브 그리기

3개의 호(arc) 형태로 사운드 웨이브를 표현. 스피커 본체 없이 파동만.

```
16x16 좌표계:

  좌측에서 우측으로 3개의 호:
  Arc 1 (작음): center(3, 8), radius 3.5, angleSpread ±51°
  Arc 2 (중간): center(3, 8), radius 6, angleSpread ±51°
  Arc 3 (큼):   center(3, 8), radius 8.5, angleSpread ±51°

  선 스타일:
  - strokeStyle: '#FAFAFA'
  - lineWidth: 1.5 * scale
  - lineCap: 'round'
```

### 2.3 시그널 점 (LED)

```
위치: (13 * scale, 13 * scale)  — 우하단
반경: 1.5 * scale

상태별 렌더링:
┌──────────┬─────────────────────────────────────────┐
│ normal   │ fillStyle: '#8B5CF6'                    │
│          │ shadowColor: '#8B5CF6'                  │
│          │ shadowBlur: 2 * scale                   │
│          │ → 은은한 퍼플 LED                       │
├──────────┼─────────────────────────────────────────┤
│ active   │ fillStyle: '#A78BFA'                    │
│          │ shadowColor: '#A78BFA'                  │
│          │ shadowBlur: 4 * scale                   │
│          │ → 밝은 퍼플 형광                        │
├──────────┼─────────────────────────────────────────┤
│ muted    │ 점 그리지 않음                          │
│          │ → 웨이브만 표시                         │
└──────────┴─────────────────────────────────────────┘
```

---

## 3. Module Design

### 3.1 신규: electron/tray-icon.js

```javascript
/**
 * createTrayIcon(state, scaleFactor)
 * @param {'normal'|'muted'|'active'} state
 * @param {number} scaleFactor - 1 or 2
 * @returns {nativeImage}
 *
 * Canvas(offscreen)에 사운드 웨이브 + 시그널 점을 그린 뒤
 * nativeImage.createFromBuffer(canvas.toBuffer())로 변환
 */

// Electron의 OffscreenCanvas가 지원되지 않을 수 있으므로
// 직접 RGBA 버퍼를 조작하거나, BrowserWindow의 hidden canvas 사용
// → 가장 안정적: 숨겨진 BrowserWindow 없이 직접 픽셀 조작

// 대안: nativeImage.createFromDataURL + data URI
// → 매우 작은 아이콘이므로 직접 PNG 바이트 생성은 과도
// → 추천: Electron의 offscreen BrowserWindow 사용하여 canvas 렌더링
```

**실제 구현 방식 (추천):**

Electron main process에서 offscreen 렌더링이 어려우므로, 미리 계산된 픽셀로 아이콘 생성:

```javascript
const { nativeImage } = require('electron');

function createTrayIcon(state = 'normal', size = 16) {
  // PNG 바이트를 직접 생성하기보다
  // nativeImage.createEmpty() + 직접 RGBA 버퍼 사용
  // size x size RGBA buffer (4 bytes per pixel)
  const buffer = Buffer.alloc(size * size * 4, 0); // transparent

  // 웨이브 호와 시그널 점을 픽셀 단위로 그리기
  drawWavePixels(buffer, size);
  if (state !== 'muted') {
    drawSignalPixels(buffer, size, state);
  }

  return nativeImage.createFromBuffer(buffer, {
    width: size,
    height: size,
  });
}
```

**대안 (더 간단):**

Base64 인코딩된 PNG 3개를 미리 준비:
- `ICON_NORMAL` — 웨이브 + 퍼플 점
- `ICON_ACTIVE` — 웨이브 + 밝은 퍼플 점
- `ICON_MUTED` — 웨이브만

→ 런타임 렌더링 오버헤드 없이 즉시 전환 가능

**최종 결정: Base64 PNG 방식** (안정성 + 단순성)

### 3.2 수정: electron/tray.js

```javascript
const { createTrayIcon } = require('./tray-icon');

// 변경점:
// 1. createTray()에서 createTrayIcon('normal') 사용
// 2. setTrayState(state) 함수 export 추가

let tray = null;

function createTray(app) {
  const icon = createTrayIcon('normal');
  tray = new Tray(icon);
  tray.setToolTip('Voly - Volume, the way it should be.');
  // ... context menu ...
}

function setTrayState(state) {
  if (tray) {
    tray.setImage(createTrayIcon(state));
  }
}

module.exports = { createTray, destroyTray, setTrayState };
```

### 3.3 수정: electron/main.js

```javascript
const { setTrayState } = require('./tray');

// 뮤트 토글 시:
toggleMute().then((result) => {
  showOsd('mute', result.volume, osdDuration, result.muted);
  setTrayState(result.muted ? 'muted' : 'normal');
});

// 볼륨 조절 시 (optional active state):
// setTrayState('active');
// setTimeout(() => setTrayState(currentMuted ? 'muted' : 'normal'), 1500);
```

---

## 4. Data Flow

```
[앱 시작]
  → createTrayIcon('normal') → tray.setImage()

[뮤트 토글]
  → toggleMute() → result.muted
  → setTrayState(result.muted ? 'muted' : 'normal')
  → tray.setImage(createTrayIcon(state))

[볼륨 조절] (optional)
  → adjustVolume() → setTrayState('active')
  → 1.5s debounce → setTrayState(prev state)
```

---

## 5. Icon Pixel Design (16x16)

```
Row 0:  . . . . . . . . . . . . . . . .
Row 1:  . . . . . . . . . . . . . . . .
Row 2:  . . . . . . . . . . ○ . . . . .
Row 3:  . . . . . . . ○ . . . ○ . . . .
Row 4:  . . . . ○ . . . ○ . . . ○ . . .
Row 5:  . . . ○ . . . . . ○ . . . ○ . .
Row 6:  . . ○ . . . . . . . ○ . . . . .
Row 7:  . ○ . . . . . . . . . ○ . . . .
Row 8:  . ○ . . . . . . . . . ○ . . . .
Row 9:  . . ○ . . . . . . . ○ . . . . .
Row 10: . . . ○ . . . . . ○ . . . ○ . .
Row 11: . . . . ○ . . . ○ . . . ○ . . .
Row 12: . . . . . . . ○ . . . ○ . . . .
Row 13: . . . . . . . . . . ○ . . ● . .
Row 14: . . . . . . . . . . . . . . . .
Row 15: . . . . . . . . . . . . . . . .

○ = #FAFAFA (웨이브 픽셀)
● = #8B5CF6 (시그널 점, muted 시 생략)
. = transparent
```

---

## 6. Implementation Order

1. [ ] `electron/tray-icon.js` — 3개 상태 Base64 PNG 아이콘 생성
2. [ ] `electron/tray.js` — createTrayIcon 연동 + setTrayState export
3. [ ] `electron/main.js` — 뮤트 토글 시 setTrayState 호출

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-31 | Initial design | donghun.kim |
