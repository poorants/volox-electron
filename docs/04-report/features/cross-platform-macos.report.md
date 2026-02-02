# Report: Cross-Platform macOS Support

## 요약

Volox의 macOS 크로스플랫폼 지원을 구현했습니다. Windows 전용이었던 `input-hook.js`를 플랫폼별 모듈로 분리하고, macOS에서는 Electron `globalShortcut` 기반 키보드 단축키로 볼륨을 제어합니다.

## 변경 파일

| 파일 | 변경 |
|------|------|
| `electron/input-hook/index.js` | 신규 - 플랫폼 분기 라우터 |
| `electron/input-hook/win32.js` | 신규 - 기존 input-hook.js 이동 (변경 없음) |
| `electron/input-hook/darwin.js` | 신규 - macOS globalShortcut 구현 |
| `electron/input-hook.js` | 삭제 |
| `electron/main.js` | import 변경, keyboard 이벤트 처리, bindShortcuts 호출 |
| `electron/settings.js` | 플랫폼별 기본 단축키 분기 |
| `electron/tray-icon.js` | macOS Template 이미지 설정 |
| `renderer/settings.html` | 트리거 라벨 확장, 플랫폼별 기본값 |
| `package.json` | koffi → optionalDeps, mac/win 빌드 타겟, 스크립트 추가 |

## macOS 기본 단축키

| 기능 | 단축키 |
|------|--------|
| Volume Up | Option + Up Arrow |
| Volume Down | Option + Down Arrow |
| Mute Toggle | Option + M |

## PDCA 결과

- Plan: 완료
- Design: 완료
- Do: 완료 (9개 구현 항목)
- Check: Match Rate 100% (런타임 검증은 사용자 환경 필요)

## 사용자 검증 필요 항목

1. `npm run dev` — macOS에서 트레이 표시 및 단축키 동작
2. `npm run build:mac` — .dmg 빌드 성공 여부
3. Windows 기존 기능 회귀 없음 확인
