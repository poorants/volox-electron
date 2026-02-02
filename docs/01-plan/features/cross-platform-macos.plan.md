# Plan: Cross-Platform macOS Support

> Volox의 macOS 지원을 위한 크로스플랫폼 분리 계획

## 1. 현황 분석

### 현재 구조
```
electron/
  main.js          ← 앱 진입점 (이미 darwin dock.hide 분기 있음)
  input-hook.js    ← ❌ Windows 전용 (koffi + user32.dll + WH_MOUSE_LL)
  volume.js        ← ✅ 크로스플랫폼 (loudness)
  tray.js          ← ✅ 크로스플랫폼 (Electron API)
  osd.js           ← ✅ 크로스플랫폼 (Electron API)
  settings.js      ← ✅ 크로스플랫폼 (electron-store)
  tray-icon.js     ← ⚠️ 확인 필요 (.ico → macOS는 .png 권장)
  preload.js       ← ✅ 크로스플랫폼
```

### 플랫폼별 차이점

| 영역 | Windows | macOS |
|------|---------|-------|
| 마우스 훅 | `WH_MOUSE_LL` (koffi) | 지원 안 함 (키보드만) |
| 키보드 단축키 | `input-hook.js` (koffi) | `globalShortcut` (Electron) |
| 볼륨 제어 | loudness | loudness |
| 트레이 아이콘 | .ico | .png (Template 이미지) |
| 빌드 출력 | .exe (NSIS) | .dmg / .app |

### 핵심 제약

- macOS에서 글로벌 마우스 휠 이벤트를 잡으려면 `CGEventTap` + 접근성 권한 필요 → 복잡도 높음
- **결정: macOS는 키보드 단축키 방식으로 제공** (Electron `globalShortcut` 활용)
- `koffi` 의존성은 Windows 전용 optional dependency로 전환

## 2. 목표

1. `input-hook`을 플랫폼별 모듈로 분리 (공통 인터페이스)
2. macOS용 키보드 단축키 입력 모듈 구현 (`globalShortcut`)
3. macOS용 트레이 아이콘 지원
4. `electron-builder`에 macOS 빌드 타겟 추가
5. `npm run dev`로 macOS에서 바로 실행 가능

## 3. 변경 범위

### 3-1. input-hook 플랫폼 분리

**현재**: `electron/input-hook.js` (Windows 전용 단일 파일)

**변경 후**:
```
electron/
  input-hook/
    index.js          ← process.platform 분기 라우터
    win32.js           ← 기존 input-hook.js 이동 (koffi + WH_MOUSE_LL)
    darwin.js          ← 신규: Electron globalShortcut 기반
```

**공통 인터페이스**:
```js
module.exports = {
  startHook(onEvent),    // 입력 감지 시작
  stopHook(),            // 입력 감지 중지
  startCapture(cb),      // 단축키 캡처 모드 (설정 UI용)
  cancelCapture(),       // 캡처 취소
};
```

**darwin.js 이벤트 매핑**:

| Windows (마우스) | macOS (키보드) | 설명 |
|-----------------|---------------|------|
| Alt + Wheel Up | Option + Up Arrow | 볼륨 업 |
| Alt + Wheel Down | Option + Down Arrow | 볼륨 다운 |
| Alt + Middle Click | Option + M | 뮤트 토글 |

- macOS에서는 `event.type`이 `'keyboard'`로 전달
- `main.js`의 `matchesShortcut()` 함수에 키보드 이벤트 타입 분기 추가

### 3-2. settings.js 단축키 스키마 확장

**현재**: trigger 값이 `wheelUp`, `wheelDown`, `middleClick`만 존재

**추가**: macOS용 키보드 트리거
- `arrowUp`, `arrowDown`, `keyM` 등 키보드 키 값 허용
- 플랫폼별 기본값 분기:
  ```js
  const defaults = process.platform === 'darwin'
    ? { volumeUp: { modifier: 'alt', trigger: 'arrowUp' }, ... }
    : { volumeUp: { modifier: 'alt', trigger: 'wheelUp' }, ... };
  ```

### 3-3. tray-icon.js macOS 대응

- macOS 트레이 아이콘은 16x16 또는 22x22 `.png` (Template 이미지)
- `nativeImage.createFromPath()`로 통일하되, macOS에서는 `setTemplateImage(true)`
- 아이콘 파일: `assets/tray-icon-darwin.png`, `assets/tray-icon-darwin-muted.png` 추가

### 3-4. package.json 변경

**koffi를 optional dependency로 전환**:
```json
{
  "dependencies": {
    "electron-store": "^11.0.2",
    "loudness": "^0.4.2"
  },
  "optionalDependencies": {
    "koffi": "^2.15.1"
  }
}
```

**electron-builder macOS 빌드 설정 추가**:
```json
{
  "build": {
    "mac": {
      "target": "dmg",
      "category": "public.app-category.utilities",
      "icon": "assets/icon.icns"
    },
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    }
  }
}
```

**스크립트 추가**:
```json
{
  "scripts": {
    "dev": "electron .",
    "build": "electron-builder",
    "build:mac": "electron-builder --mac",
    "build:win": "electron-builder --win"
  }
}
```

### 3-5. main.js 수정

- `require('./input-hook')` → `require('./input-hook/index')`
- `matchesShortcut()` 함수에 키보드 이벤트 타입 처리 추가
- 기존 로직 변경 최소화 (input-hook이 동일 인터페이스를 제공하므로)

### 3-6. settings.html UI 분기

- macOS에서 단축키 설정 시 "키보드 키" 선택 UI 표시
- Windows에서는 기존 "마우스 동작" 선택 UI 유지
- `window.electronAPI`에 플랫폼 정보 전달 (`preload.js`에서 `process.platform` 노출)

## 4. 구현 순서

| 단계 | 작업 | 영향 파일 |
|------|------|----------|
| 1 | input-hook 디렉토리 분리 + index.js 라우터 | `electron/input-hook/*` |
| 2 | 기존 코드를 win32.js로 이동 | `electron/input-hook/win32.js` |
| 3 | darwin.js 구현 (globalShortcut) | `electron/input-hook/darwin.js` |
| 4 | main.js import 경로 + 이벤트 매칭 수정 | `electron/main.js` |
| 5 | settings.js 플랫폼별 기본값 분기 | `electron/settings.js` |
| 6 | preload.js에 platform 노출 | `electron/preload.js` |
| 7 | settings.html 플랫폼별 UI 분기 | `renderer/settings.html` |
| 8 | tray-icon macOS 대응 | `electron/tray-icon.js`, `assets/` |
| 9 | package.json 빌드 설정 + koffi optional | `package.json` |
| 10 | macOS에서 `npm run dev` 테스트 | - |

## 5. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| `globalShortcut`이 다른 앱과 충돌 | 단축키 무반응 | 설정에서 변경 가능하도록 |
| `loudness` macOS 지원 불안정 | 볼륨 조절 실패 | try-catch 이미 적용됨 |
| macOS 트레이 아이콘 크기/스타일 | 뿌옇게 보임 | Template 이미지 + @2x 대응 |
| `koffi` optional 전환 시 Windows에서 누락 | 훅 실패 | `npm install` 시 자동 설치, 런타임 체크 추가 |

## 6. 성공 기준

- [ ] macOS에서 `npm run dev` 실행 시 크래시 없이 트레이 표시
- [ ] macOS에서 키보드 단축키로 볼륨 조절 + OSD 표시
- [ ] macOS에서 뮤트 토글 동작
- [ ] Windows 기존 기능 100% 유지 (마우스 휠 + 중간 클릭)
- [ ] `npm run build:mac`으로 .dmg 빌드 성공
- [ ] `npm run build:win`으로 .exe 빌드 성공 (기존과 동일)
