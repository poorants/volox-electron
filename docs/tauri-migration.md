# Electron → Tauri 2 마이그레이션

> 브랜치: `migrate/electron-to-tauri`
> 순수 HTML/CSS/JS 렌더러는 그대로 두고, Electron 메인 프로세스(Node.js)를
> Rust(Tauri 2) 백엔드로 1:1 포팅했습니다.

## 왜 Tauri인가
- 네이티브 OS 웹뷰 사용(WebView2/WKWebView) → 번들 용량·메모리 대폭 감소
- 메인 로직이 Rust → 글로벌 훅/오디오 제어를 FFI 래퍼(koffi) 없이 직접 호출
- 트레이/창/자동시작/단일 인스턴스가 Tauri 플러그인·코어로 일원화

## 아키텍처 (스레드 모델)

```
┌───────────────┐   HookEvent 채널    ┌────────────────────┐
│ input-hook 스레드│ ──────────────────▶ │ dispatch 스레드      │
│ WH_MOUSE_LL    │                    │ - 볼륨 캐시 + 가속    │
│ WH_KEYBOARD_LL │                    │ - COM 볼륨 set/get   │
│ (메시지 펌프)    │                    │ - OSD/트레이 갱신     │
└───────────────┘                    └────────────────────┘
        ▲                                      ▲
        │ 단축키 매칭(읽기 전용)                  │ AppHandle (emit/window)
   state(RwLock<Shortcuts>, 캡처 플래그, 버스)   Tauri 메인 이벤트 루프
```

- 저수준 훅 콜백은 **반드시 빠르게** 끝나야 하므로(느리면 OS가 훅을 제거함),
  콜백은 수정키 상태 읽기 + 단축키 매칭 + 채널 전송만 수행하고 **매칭 시 1을 반환해
  원본 이벤트를 차단**한다. 실제 볼륨 변경(COM 호출), OSD/트레이 갱신은 dispatch
  스레드가 담당한다.
- COM(`IAudioEndpointVolume`)은 호출 스레드별로 한 번 lazily 초기화하고
  thread-local 로 엔드포인트를 캐싱한다(dispatch 스레드 + Tauri command 워커 스레드).

## 모듈 매핑

| Electron (electron/) | Tauri (src-tauri/src/) | 비고 |
|---|---|---|
| `main.js` | `lib.rs` | 앱 빌드/setup, ExitRequested 가로채 트레이 상주 |
| `volume.js` (loudness) | `volume.rs` | Windows Core Audio `IAudioEndpointVolume` |
| `input-hook/win32.js` (koffi) | `input_hook.rs` | `windows` crate로 LL 훅 직접 설치 |
| (메인의 가속/매칭 로직) | `dispatch.rs` | 볼륨 캐시·가속·OSD·트레이 조율 |
| `settings.js` (electron-store) | `settings.rs` | serde + JSON 파일, 동일 스키마 |
| `tray.js` + `tray-icon.js` | `tray.rs` | Tauri 트레이 + 커스텀 팝업 창 |
| `osd.js` | `osd.rs` | 투명/클릭통과/최상위 창 |
| `auth.js` | `panels.rs` (auth 창) | 로컬 HTTP 서버 불필요(`tauri://` origin) |
| `preload.js` (contextBridge) | `renderer/tauri-bridge.js` | `window.electronAPI` shim → `invoke`/`listen` |
| IPC handlers | `commands.rs` | `#[tauri::command]` 전량 1:1 |

### 설정 파일 위치
- Windows: `%APPDATA%\Volox\config.json`

스키마(`shortcuts`/`volume`/`osd`/`theme`/`autoStart`/`user`/`subscription`)는
electron-store 와 동일하며 `photoURL` 등 필드명도 그대로 직렬화한다.

## 렌더러 변경점 (최소)
- 각 HTML `<head>`에 `<script src="tauri-bridge.js"></script>` 1줄 추가.
- `osd.html`의 아이콘 경로 `../assets/sound.png` → `assets/sound.png`
  (에셋을 `renderer/assets/`로 복사, 번들 dist 안에 포함되도록).
- 드래그 가능한 영역에 `data-tauri-drag-region` 추가
  (`-webkit-app-region`은 웹뷰에서 동작하지 않음 → settings/theme 타이틀바, auth 컨테이너).
- `window.close()`는 브릿지에서 `invoke('close_window')`로 라우팅.

`window.electronAPI`의 메서드 시그니처는 그대로라 나머지 렌더러 JS는 무수정.

## 실행 / 빌드

```bash
npm install            # @tauri-apps/cli 설치
npm run dev            # = tauri dev (트레이 상주, 개발 모드)
npm run build          # = tauri build (Windows 번들)
npm run build:win      # NSIS 설치 파일 (.exe)
```

산출물: `src-tauri/target/release/bundle/{nsis,dmg}/...`

### Firebase 설정 주입
`get_firebase_config` 커맨드가 다음 우선순위로 값을 찾는다:
1. 컴파일 타임 env (`option_env!`) — CI 릴리스 빌드에서 step `env:`로 주입
2. 런타임 env
3. 실행 파일/작업 디렉터리의 `.env` 파일

CI(`.github/workflows/release.yml`)는 빌드 step에 `FIREBASE_*`를 env로 전달한다.

## 알려진 제약 / 후속 작업
- **Google OAuth (Firebase popup):** auth 창은 그대로 Firebase JS SDK +
  `signInWithPopup`을 사용한다. Tauri 웹뷰의 `window.open` 팝업 동작은 환경에 따라
  제약이 있을 수 있어, 필요 시 `tauri-plugin-oauth`(루프백) + `signInWithCredential`
  방식으로 전환을 권장한다. (그 외 모든 기능—훅/볼륨/OSD/트레이/설정/테마—은 네이티브 동작.)
- **플랫폼:** Windows 전용. (이전 Electron 앱의 macOS 지원은 중단했다. `volume.rs`/
  `input_hook.rs`의 비-Windows `cfg` 스텁은 크로스 컴파일 편의를 위한 no-op일 뿐
  지원 대상이 아니다.)
- **자동 업데이트:** 기존 로드맵 항목. Tauri는 `tauri-plugin-updater`로 GitHub
  Releases 자동 업데이트를 구성할 수 있다.

## 컴파일 검증
`cargo check --manifest-path src-tauri/Cargo.toml` 통과(경고 0).
