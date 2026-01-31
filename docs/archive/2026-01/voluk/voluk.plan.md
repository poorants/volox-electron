# Voly Planning Document

> **Summary**: Windows 시스템 볼륨을 단축키+마우스 휠로 조절하는 시스템 트레이 앱
>
> **Project**: Voly
> **Version**: 2.0.0
> **Author**: donghun.kim
> **Date**: 2026-01-31
> **Status**: Updated (rebrand from Voluk → Voly)

---

## 1. Overview

### 1.1 Purpose

Windows에서 시스템 볼륨을 빠르게 조절할 수 있는 경량 데스크톱 유틸리티. 시스템 트레이에 상주하며 단축키+마우스 휠 조합으로 즉시 제어한다.

### 1.2 Slogan

**"Volume, the way it should be."**

### 1.3 Brand Rename Log

| Date | From | To | Reason |
|------|------|----|--------|
| 2026-01-31 | Voluk (volume+lux) | Voly | 밝기(lux) 기능 제거, volume + ly(부사형) |

---

## 2. Design Identity

### 2.1 Prime Color

**Electric Violet**

| Token | Hex | Usage |
|-------|-----|-------|
| `--voly-50` | `#F5F3FF` | 밝은 배경 |
| `--voly-100` | `#EDE9FE` | 호버 배경 |
| `--voly-300` | `#C4B5FD` | 비활성 요소 |
| `--voly-400` | `#A78BFA` | 세컨더리 액센트 |
| `--voly-500` | `#8B5CF6` | **Prime (기본 액센트)** |
| `--voly-600` | `#7C3AED` | 호버/액티브 상태 |
| `--voly-700` | `#6D28D9` | 강조 |
| `--voly-glow` | `rgba(139, 92, 246, 0.4)` | Glow/Blur 효과 |

**보조 컬러:**

| Token | Hex | Usage |
|-------|-----|-------|
| `--surface-0` | `#09090B` | 최하위 배경 (Zinc 950) |
| `--surface-1` | `#18181B` | 카드/패널 배경 (Zinc 900) |
| `--surface-2` | `#27272A` | 입력 필드 배경 (Zinc 800) |
| `--border` | `#3F3F46` | 테두리 (Zinc 700) |
| `--text-primary` | `#FAFAFA` | 주요 텍스트 |
| `--text-secondary` | `#A1A1AA` | 보조 텍스트 (Zinc 400) |
| `--mute-red` | `#EF4444` | Mute 상태 표시 |

### 2.2 Mood & Tone

- **Vibrant Neon Dark**: 다크 배경에 Electric Violet 글로우가 포인트
- 업무/개발 환경에서 방해하지 않으면서도, OSD가 뜰 때 존재감 있는 바이올렛 라이트
- 글래스모피즘 (backdrop-blur) + 네온 글로우 조합
- Typography: Segoe UI (Windows 네이티브) / Inter (웹 폰트)

### 2.3 Tray Icon Concept

**레터마크 "Vy"**

```
설계:
┌────────────┐
│            │
│   V   y    │  ← "Vy" 레터마크
│    ╲╱      │  ← V의 하단과 y의 꼬리가 연결
│     │      │  ← 사운드 웨이브 느낌으로 y 꼬리 처리
│            │
└────────────┘

변형:
- 기본: 바이올렛 Vy on transparent
- Mute: 회색 Vy + 취소선 또는 빨간 점
- Active (조절 중): 글로우 효과 Vy

Windows 트레이 아이콘 사이즈:
- 16x16 (기본), 32x32 (고해상도)
- .ico 포맷 (multi-resolution)
```

### 2.4 OSD Design Concept

```
┌─────────────────────────────────────────────┐
│                                             │
│    ┌───────────────────────────────────┐    │
│    │ 🔊  Volume          ╶╶╶╶  72%    │    │
│    │ ████████████████░░░░░░░░░░░░░░░░ │    │
│    │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓              │    │
│    │   ↑ Glow bar (violet glow)       │    │
│    └───────────────────────────────────┘    │
│      ↑ Glass card (blur + violet border)   │
└─────────────────────────────────────────────┘

OSD 위젯:
- 배경: rgba(9, 9, 11, 0.75) + backdrop-blur(20px)
- 테두리: 1px solid rgba(139, 92, 246, 0.2)
- 프로그레스 바: voly-500 그라데이션 + box-shadow glow
- Glow: 0 0 20px rgba(139, 92, 246, 0.4)
- 모서리: border-radius: 16px
- Mute 시: 바가 빨간색(--mute-red) + 글로우도 빨강
```

### 2.5 Settings Window Design Concept

```
┌──────────────────────────────────────────┐
│  Voly                              ── □ ×│
├──────────────────────────────────────────┤
│                                          │
│  ┌ VOLUME CONTROL ─────────────────────┐ │
│  │                                     │ │
│  │  Volume Up                          │ │
│  │  ┌──────────────────────────────┐   │ │
│  │  │  Alt + Wheel Up         [⟳] │   │ │
│  │  └──────────────────────────────┘   │ │
│  │   ↑ 클릭하면 "Press shortcut..."   │ │
│  │     대기 모드 → 입력 감지 → 적용    │ │
│  │                                     │ │
│  │  Volume Down                        │ │
│  │  ┌──────────────────────────────┐   │ │
│  │  │  Alt + Wheel Down       [⟳] │   │ │
│  │  └──────────────────────────────┘   │ │
│  │                                     │ │
│  │  Mute Toggle                        │ │
│  │  ┌──────────────────────────────┐   │ │
│  │  │  Alt + Middle Click     [⟳] │   │ │
│  │  └──────────────────────────────┘   │ │
│  │                                     │ │
│  │  Step Size                          │ │
│  │  ┌──────────────────────────────┐   │ │
│  │  │  ●━━━━━━━○──────── 2%       │   │ │
│  │  └──────────────────────────────┘   │ │
│  └─────────────────────────────────────┘ │
│                                          │
│            [ Save ]  [ Reset ]           │
│              ↑ violet glow button        │
└──────────────────────────────────────────┘

디자인 요소:
- 배경: --surface-0 (#09090B)
- 카드: --surface-1 + 1px border + border-radius: 12px
- 입력 필드: --surface-2 + violet focus ring
- Save 버튼: voly-500 배경 + glow shadow
- [⟳] 리셋 버튼: 해당 단축키만 초기화
- 단축키 캡처 모드: 필드가 보라색 펄스 애니메이션
```

---

## 3. Scope

### 3.1 In Scope

- [x] 시스템 트레이 상주 (Vy 레터마크 아이콘)
- [x] 글로벌 단축키 + 마우스 휠로 볼륨 조절
- [ ] **볼륨 뮤트 토글** (단축키 지정)
- [ ] **단축키 캡처 모드** (사용자 입력 대기 → 감지 → 적용)
- [x] 조절 시 OSD 표시 (Glow Bar + fade in/out)
- [x] 설정 창에서 커스터마이징
- [x] 휠 속도 기반 볼륨 가속
- [x] 부드러운 애니메이션
- [ ] **Electric Violet 네온 디자인 시스템 적용**

### 3.2 Out of Scope

- ~~화면 밝기 조절~~ (기술적 한계로 제거)
- 멀티 모니터 관련 기능
- 오디오 출력 장치 선택/전환
- 앱별 개별 볼륨 제어
- macOS/Linux 지원

---

## 4. Requirements

### 4.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 시스템 트레이에 Vy 레터마크 아이콘으로 상주 | High | Update needed |
| FR-02 | 단축키 + 마우스 휠로 시스템 볼륨 조절 | High | Done |
| FR-03 | **단축키로 볼륨 뮤트/언뮤트 토글** | High | New |
| FR-04 | 조절 시 Glow Bar OSD 위젯 표시 | High | Update needed |
| FR-05 | 트레이 우클릭 → 설정 창 열기 | Medium | Done |
| FR-06 | **단축키 캡처: 입력 대기 → 감지 → 적용** | High | New |
| FR-07 | 설정 값 로컬 저장 | Medium | Done |
| FR-08 | 트레이 우클릭 → 종료 메뉴 | Medium | Done |
| FR-09 | 휠 속도에 따른 볼륨 변화량 가속 | Medium | Done |
| FR-10 | **Electric Violet 디자인 시스템 OSD/Settings 적용** | Medium | New |

### 4.2 Shortcut Configuration

| Action | Default Shortcut | Configurable |
|--------|-----------------|:------------:|
| Volume Up | Alt + Wheel Up | ✅ (캡처 모드) |
| Volume Down | Alt + Wheel Down | ✅ (캡처 모드) |
| Mute Toggle | Alt + Middle Click | ✅ (캡처 모드) |

**단축키 캡처 플로우:**
```
1. 설정 창에서 단축키 필드 클릭
2. 필드가 "Press shortcut..." 상태로 변경 (보라색 펄스)
3. WH_MOUSE_LL / WH_KEYBOARD_LL로 입력 감지
4. 감지된 조합 표시 (예: "Ctrl + Wheel Up")
5. Save로 확정 / ESC로 취소
```

### 4.3 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | OSD 표시 지연 < 50ms | 체감 테스트 |
| Resource | 메모리 사용량 < 100MB | Task Manager |
| UX | 애니메이션 60fps, 글로우 효과 부드러움 | 시각 확인 |

---

## 5. Success Criteria

### 5.1 Definition of Done

- [x] 볼륨 조절 기능 구현
- [ ] 뮤트 토글 구현
- [ ] 단축키 캡처 모드 구현
- [ ] Vy 트레이 아이콘 적용
- [ ] Electric Violet 디자인 적용 (OSD + Settings)
- [ ] Windows 10/11 정상 동작

### 5.2 Quality Criteria

- [ ] 빌드 성공 (.exe 생성)
- [ ] 메모리 누수 없음
- [ ] 글로우 효과 GPU 가속

---

## 6. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 글로벌 마우스 휠 훅이 다른 앱과 충돌 | High | Medium | Modifier 키 조합으로 한정 |
| 단축키 캡처 시 다른 앱 입력 가로챔 | Medium | Medium | 캡처 모드 진입/해제 명확히 구분 |
| Electron 메모리 사용량 | Medium | Medium | 트레이 전용 모드 |
| 글로우 효과 GPU 부하 | Low | Low | CSS box-shadow만 사용, 캔버스 불사용 |

---

## 7. Architecture

### 7.1 Dependencies

| Package | Purpose | node-gyp |
|---------|---------|----------|
| electron | 앱 프레임워크 | No |
| koffi | Win32 API FFI (마우스/키보드 훅) | No |
| loudness | 시스템 볼륨 제어 | No |
| electron-store | 설정 저장 | No |
| electron-builder | 빌드/패키징 | No |

### 7.2 Architecture Overview

```
┌─────────────────────────────────────────────┐
│ Main Process                                │
│  ├── WH_MOUSE_LL Hook (koffi + user32.dll)  │
│  ├── Volume Controller (loudness)           │
│  ├── Mute Controller (loudness)             │
│  ├── Wheel Speed Multiplier                 │
│  ├── Shortcut Capture Manager               │
│  └── Settings Store (electron-store)        │
├─────────────────────────────────────────────┤
│ OSD Window (transparent, glow bar)          │
│  └── Electric Violet 디자인 시스템           │
├─────────────────────────────────────────────┤
│ Settings Window                             │
│  ├── Shortcut Capture UI (입력 대기 모드)    │
│  └── Electric Violet 디자인 시스템           │
└─────────────────────────────────────────────┘
```

---

## 8. Next Steps

1. [ ] Design document 업데이트 (`/pdca design voluk`)
2. [ ] 트레이 아이콘 제작 (Vy 레터마크 .ico)
3. [ ] OSD 디자인 리뉴얼 (Glow Bar + Violet)
4. [ ] Settings 디자인 리뉴얼
5. [ ] 뮤트 토글 기능 구현
6. [ ] 단축키 캡처 모드 구현
7. [ ] 프로젝트 리네임 (voluk → voly)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-31 | Initial draft | donghun.kim |
| 1.1 | 2026-01-31 | 밝기 기능 제거 반영 | donghun.kim |
| 2.0 | 2026-01-31 | Rebrand to Voly, Electric Violet 디자인 시스템, 뮤트/단축키 캡처 추가 | donghun.kim |
