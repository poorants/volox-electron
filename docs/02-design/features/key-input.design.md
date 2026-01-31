# Design: key-input (키보드 입력 연속 반복 및 가속)

## 1. 설계 요약

Electron `globalShortcut`은 OS 키 리피트를 그대로 전달하므로 키를 누르고 있으면 콜백이 반복 호출된다. 따라서 자체 타이머 구현 없이 `main.js`의 keyboard 이벤트 핸들러에 기존 `getSpeedMultiplier()` 가속 로직을 적용하면 해결된다.

## 2. 변경 사항

### 2.1 `electron/main.js`

**현재**: keyboard 이벤트에 고정 step 사용
```js
if (event.action === 'volumeUp') {
  adjustVolume('up', currentSettings.volume.step)...
}
```

**변경**: keyboard 이벤트에도 `getSpeedMultiplier()` 적용
```js
if (event.action === 'volumeUp') {
  const step = currentSettings.volume.step * getSpeedMultiplier();
  adjustVolume('up', step)...
}
```

### 2.2 가속 로직 공유

`getSpeedMultiplier()`는 이미 마우스 휠용으로 존재하며, `lastWheelTime` 변수를 사용한다. 키보드 이벤트에도 동일 변수를 공유하면 마우스↔키보드 전환 시 가속이 리셋되는 자연스러운 동작이 된다.

변수명을 `lastInputTime`으로 변경하여 의미를 명확히 한다.

## 3. 변경 파일

| 파일 | 변경 | 규모 |
|------|------|------|
| `electron/main.js` | keyboard 핸들러에 가속 적용, 변수명 변경 | ~10줄 |

## 4. 영향 없음

- `darwin.js` / `win32.js`: 변경 없음
- `settings.js` / `volume.js`: 변경 없음
- 마우스 휠 기존 동작: 동일 로직이므로 영향 없음
