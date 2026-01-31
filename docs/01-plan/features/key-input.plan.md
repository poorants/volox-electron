# Plan: key-input (키보드 입력 연속 반복 및 가속)

## 1. 개요

키보드 단축키(Alt+ArrowUp/Down 등)로 볼륨 조절 시, 키를 누르고 있으면 연속으로 볼륨이 변경되어야 한다. 현재는 키 다운 시점에 1회만 반응하며, 키를 누르고 있어도 추가 입력이 발생하지 않는다.

추가로 마우스 휠과 동일하게 빠르게 연속 입력 시 볼륨 변화량이 가속되어야 한다.

## 2. 현재 문제

### macOS (darwin.js)
- `globalShortcut.register()`는 키 다운 시 콜백을 1회만 호출
- OS 레벨 키 리피트 이벤트를 받지 못함
- 키를 누르고 있어도 볼륨이 1 step만 변경됨

### Windows (win32.js)
- 기본 단축키가 마우스 휠 기반이라 연속 입력은 자연스럽게 동작
- 단, 키보드 트리거(arrowUp/Down)를 설정한 경우 globalShortcut 사용 시 같은 문제 발생 가능

### main.js
- `type === 'keyboard'` 이벤트에 `getSpeedMultiplier()` 가속 로직이 적용되지 않음
- 마우스 휠에만 가속이 존재

## 3. 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| R1 | 키를 누르고 있으면 일정 간격으로 볼륨이 연속 변경됨 | 필수 |
| R2 | 연속 입력 시 시간이 지날수록 변화 step이 가속됨 (마우스 휠과 동일) | 필수 |
| R3 | 키를 떼면 즉시 반복 중단 | 필수 |
| R4 | macOS와 Windows 모두 동작 | 필수 |
| R5 | 기존 마우스 휠 동작에 영향 없음 | 필수 |

## 4. 해결 방안

### 접근: 자체 키 리피트 타이머

`globalShortcut`은 키 다운/업 구분이 없으므로, 키 다운 이벤트 수신 시 자체 `setInterval` 타이머를 시작하고 modifier 키 상태를 폴링하여 키가 떼어졌는지 감지한다.

#### macOS (darwin.js)
- `globalShortcut` 콜백에서 첫 볼륨 변경 수행
- `setInterval`로 반복 타이머 시작 (초기 간격: ~200ms → 가속 시 ~50ms)
- 매 tick마다 modifier 키 상태 확인 (Electron `globalShortcut.isRegistered` 또는 별도 방법)
- modifier가 떼어지면 타이머 중단
- 문제: macOS에서 modifier 키 상태 폴링이 제한적 → **키 업 감지를 위해 별도 방법 필요**

#### 대안: Electron의 globalShortcut 특성 활용
- `globalShortcut.register`는 실제로 OS 키 리피트를 받음 (OS 키 리피트 설정에 따라)
- 테스트 필요: Electron globalShortcut이 키 리피트 이벤트를 전달하는지 확인
- 만약 전달된다면 `getSpeedMultiplier()` 패턴을 키보드에도 적용하면 해결

#### 최종 접근 (두 단계)
1. **Step 1**: Electron globalShortcut의 키 리피트 동작 확인
2. **Step 2-A** (리피트 지원 시): 키보드 이벤트에도 `getSpeedMultiplier()` 가속 로직 적용
3. **Step 2-B** (리피트 미지원 시): 자체 타이머 + modifier 폴링 방식 구현

## 5. 영향 범위

| 파일 | 변경 내용 |
|------|----------|
| `electron/input-hook/darwin.js` | 키 리피트 또는 자체 타이머 로직 추가 |
| `electron/main.js` | keyboard 이벤트에 가속 로직 적용 |
| `electron/settings.js` | (선택) 키 리피트 속도 설정 추가 |

## 6. 리스크

- macOS에서 modifier 키 상태 폴링이 불가능할 수 있음 → IOKit 또는 native addon 필요 가능성
- Electron globalShortcut 키 리피트 동작이 OS 설정에 의존적
- 타이머 기반 구현 시 CPU 사용량 고려 필요

## 7. 완료 기준

- [ ] Alt+Up/Down 키를 누르고 있으면 볼륨이 연속으로 변경됨
- [ ] 누르고 있는 시간이 길어질수록 변화 속도가 가속됨
- [ ] 키를 떼면 즉시 중단됨
- [ ] 마우스 휠 기존 동작이 정상 작동함
