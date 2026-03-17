<p align="center">
  <img src="assets/volox-icon.png" width="120" alt="Volox Logo" />
</p>

<h1 align="center">Volox</h1>

<p align="center">
  <strong>Volume, the way it should be.</strong><br/>
  가볍고 편하게, 확실한 볼륨 제어를 제공하는 데스크톱 트레이 앱
</p>

<p align="center">
  <a href="https://poorants.github.io/volox/">Homepage</a> &middot;
  <a href="https://github.com/poorants/volox-electron/releases">Download</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS-8B5CF6?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/version-2.0.6-8B5CF6?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/license-ISC-8B5CF6?style=flat-square" alt="License" />
</p>

---

## What is Volox?

마우스 휠이나 키보드 단축키 하나로 시스템 볼륨을 조절하세요.
**어떤 앱 위에서든** 동작하는 글로벌 단축키와 깔끔한 OSD로, 볼륨 제어가 한결 편해집니다.

## Key Features

| | Feature | Description |
|---|---------|-------------|
| **Alt + Wheel** | 볼륨 조절 | 어디서든 Alt 키와 마우스 휠로 즉시 볼륨 업/다운 |
| **Alt + Middle Click** | 뮤트 토글 | 한 번의 클릭으로 음소거 전환 |
| **OSD** | 온스크린 디스플레이 | Glass morphism 스타일의 볼륨 상태 표시 |
| **Acceleration** | 스텝 가속 | 연속 입력 시 자동으로 볼륨 변화량 증가 (최대 10%) |
| **Themes** | 테마 3종 | Dark · Light · Cyber Pulse |
| **Customizable** | 단축키 설정 | 트리거 키, 볼륨 스텝, 자동 시작 등 자유 설정 |
| **Tray App** | 시스템 트레이 | 작업 표시줄에서 조용히 대기, 필요할 때만 동작 |

## Default Shortcuts

| Action | Windows | macOS |
|--------|---------|-------|
| Volume Up | `Alt` + `Wheel Up` | `Alt` + `Arrow Up` |
| Volume Down | `Alt` + `Wheel Down` | `Alt` + `Arrow Down` |
| Mute Toggle | `Alt` + `Middle Click` | `Alt` + `M` |

> 모든 단축키는 설정 창에서 변경할 수 있습니다.

## Themes

| Dark | Light | Cyber Pulse |
|------|-------|-------------|
| Electric Violet on deep black | Clean white with violet accents | Cyan neon with slim pill OSD |

트레이 메뉴 > Theme에서 전환할 수 있습니다.

## Download

최신 버전은 [Releases](https://github.com/poorants/volox-electron/releases) 페이지에서 다운로드하세요.

| Platform | File |
|----------|------|
| Windows | `volox-setup.exe` |
| macOS | `volox.dmg` |

## Development

```bash
# 의존성 설치
npm install

# 개발 실행
npm run dev

# 빌드
npm run build        # 현재 플랫폼
npm run build:win    # Windows
npm run build:mac    # macOS
```

## Tech Stack

[Electron](https://www.electronjs.org/) · [koffi](https://koffi.dev/) · [loudness](https://github.com/nicehash/loudness) · [electron-store](https://github.com/sindresorhus/electron-store) · [Firebase Auth](https://firebase.google.com/docs/auth)

## License

ISC
