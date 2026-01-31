# Report: key-input (키보드 입력 연속 반복 및 가속)

## 결과: 완료 (Match Rate 100%)

## 변경 요약

`electron/main.js` 1개 파일, ~10줄 변경.

### 변경 내용
1. `lastWheelTime` → `lastInputTime`으로 변수명 변경 (마우스/키보드 공유 의미 반영)
2. keyboard 이벤트의 `volumeUp`, `volumeDown` 핸들러에 `getSpeedMultiplier()` 가속 적용

### 동작 원리
- Electron `globalShortcut`은 OS 키 리피트를 그대로 전달 → 키를 누르고 있으면 콜백 반복 호출
- 기존 `getSpeedMultiplier()`가 입력 간격 기반 가속을 계산 (50ms 미만 → 4배, 100ms → 3배, 150ms → 2배)
- 마우스 휠과 키보드가 동일한 `lastInputTime`을 공유하여 일관된 가속 경험 제공

### 영향 범위
- 마우스 휠 기존 동작: 변경 없음
- darwin.js, win32.js, settings.js, volume.js: 변경 없음

## PDCA 이력

| Phase | 상태 |
|-------|------|
| Plan | ✅ 완료 |
| Design | ✅ 완료 |
| Do | ✅ 완료 |
| Check | ✅ 100% |
| Report | ✅ 완료 |
