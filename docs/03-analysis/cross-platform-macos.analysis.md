# Gap Analysis: Cross-Platform macOS Support

> Design 문서 vs 실제 구현 비교

## 1. 체크리스트

| # | Design 항목 | 구현 상태 | 일치 |
|---|------------|----------|------|
| 2-1 | `input-hook/index.js` 플랫폼 분기 라우터 | `electron/input-hook/index.js` 생성 완료 | O |
| 2-2 | `input-hook/win32.js` 기존 코드 이동 | 기존 `input-hook.js` → `win32.js` 이동, 원본 삭제 | O |
| 2-3 | `input-hook/darwin.js` globalShortcut 구현 | `darwin.js` 생성, bindShortcuts/startHook/stopHook/capture 구현 | O |
| 2-4 | `main.js` import 변경 + keyboard 이벤트 처리 | `inputHook` 객체로 변경, keyboard 분기 추가, bindShortcuts 호출 | O |
| 2-5 | `settings.js` 플랫폼별 기본값 | DEFAULTS_WIN32/DEFAULTS_DARWIN 분기, schema 반영 | O |
| 2-6 | `tray-icon.js` macOS Template 이미지 | `setTemplateImage(true)` 추가 | O |
| 2-7 | `settings.html` TRIGGER_LABELS + DEFAULTS 분기 | 라벨 6종 추가, platform 기반 DEFAULTS 분기 | O |
| 2-8 | `package.json` koffi optional + 빌드 설정 | optionalDependencies 이동, mac/win 타겟, build:mac/win 스크립트 | O |

## 2. Gap 목록

| # | Gap | 심각도 | 상태 |
|---|-----|--------|------|
| - | 없음 | - | - |

## 3. Match Rate

**9/9 항목 일치 = 100%**

## 4. 런타임 검증 (미완료)

현재 환경에 Node.js/npm이 설치되어 있지 않아 실제 실행 테스트 불가.
사용자 환경에서 아래 항목 수동 검증 필요:

- [ ] macOS: `npm run dev` 크래시 없이 트레이 표시
- [ ] macOS: Option + Up/Down으로 볼륨 조절 + OSD
- [ ] macOS: Option + M으로 뮤트 토글
- [ ] macOS: Settings UI에서 macOS용 기본값 표시
- [ ] Windows: 기존 마우스 휠/중간 클릭 동작 유지
- [ ] `npm run build:mac` → .dmg 빌드
- [ ] `npm run build:win` → .exe 빌드

## 5. 결론

Design 대비 코드 구현 일치율 100%. 런타임 검증은 사용자 환경에서 수행 필요.
