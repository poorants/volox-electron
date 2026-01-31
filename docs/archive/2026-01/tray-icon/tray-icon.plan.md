# Tray Icon Planning Document

> **Summary**: Voly 시스템 트레이 아이콘 — 사운드 웨이브 + 퍼플 LED 시그널
>
> **Project**: Voly
> **Feature**: tray-icon
> **Version**: 1.0.0
> **Author**: donghun.kim
> **Date**: 2026-01-31
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

현재 플레이스홀더 아이콘을 Voly 브랜드에 맞는 트레이 아이콘으로 교체. 볼륨 컨트롤러를 나타내는 사운드 웨이브 형태에 활성 상태를 표시하는 퍼플 LED 시그널 포인트를 추가한다.

### 1.2 Design Direction

- **형태**: 미니멀 사운드 웨이브 곡선 (스피커 없이 웨이브만)
- **색상**: 단색 심플 — 흰색(#FAFAFA) 웨이브 + 퍼플(#8B5CF6) 시그널 점
- **시그널**: 우하단 작은 발광 점 (LED 느낌). Save 버튼 hover 시의 퍼플 라이트 형광 톤
- **뮤트**: 시그널 점만 꺼짐 (웨이브 형태 유지, 아이콘 자체는 변경 없음)
- **제작 방식**: Electron Canvas API 런타임 생성 (nativeImage.createFromCanvas)

---

## 2. Scope

### 2.1 In Scope

- [ ] Canvas API로 사운드 웨이브 아이콘 동적 생성
- [ ] 3가지 상태: Normal (퍼플 점 ON), Muted (점 OFF), Active (점 밝게)
- [ ] tray.js에서 뮤트 상태에 따라 아이콘 전환
- [ ] 16x16, 32x32 해상도 지원
- [ ] main.js에서 뮤트 토글 시 트레이 아이콘 업데이트 IPC

### 2.2 Out of Scope

- 외부 .ico 파일 사용
- 애니메이션 트레이 아이콘 (Windows 제약)
- 볼륨 레벨에 따른 웨이브 높이 변경 (과도한 복잡성)

---

## 3. Icon Design Spec

### 3.1 사운드 웨이브 형태

```
16x16 Canvas Grid:

    ╭╮
   ╭╯╰╮ ╭╮
  ╭╯  ╰╮╯╰╮
──╯    ╰╯  ╰──  ●
                 ↑
          퍼플 시그널 점 (우하단)

구현:
- 3개의 사인 웨이브 곡선 (진폭 다름)
- 또는 2~3개 수직 호(arc) 형태
- 선 두께: 1.5px (16x16), 2px (32x32)
- 색상: #FAFAFA (흰색 단색)
```

### 3.2 시그널 점 (LED)

```
위치: 아이콘 우측 하단 (x: 13, y: 13 @ 16x16)
크기: 반경 2px (16x16), 3px (32x32)

상태별:
┌──────────┬───────────────────────────────────┐
│ Normal   │ #8B5CF6 (voly-500) 채움           │
│          │ + 약한 glow (shadowBlur: 2)       │
│          │ = 은은한 퍼플 LED ON              │
├──────────┼───────────────────────────────────┤
│ Active   │ #A78BFA (voly-400) 채움           │
│          │ + 강한 glow (shadowBlur: 4)       │
│          │ = 밝은 퍼플 형광 (조절 중)        │
├──────────┼───────────────────────────────────┤
│ Muted    │ 점 없음 (그리지 않음)             │
│          │ = 웨이브만 표시, 시그널 OFF       │
└──────────┴───────────────────────────────────┘
```

### 3.3 전체 아이콘 상태

```
[Normal — 앱 실행 중]
  ~~~ ●    흰색 웨이브 + 퍼플 점

[Active — 볼륨 조절 중]
  ~~~ ◉    흰색 웨이브 + 밝은 퍼플 점 (glow 강화)

[Muted — 뮤트 상태]
  ~~~      흰색 웨이브만 (점 없음)
```

---

## 4. Requirements

### 4.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | Canvas API로 16x16, 32x32 트레이 아이콘 런타임 생성 | High |
| FR-02 | Normal 상태: 웨이브 + 퍼플 시그널 점 | High |
| FR-03 | Muted 상태: 웨이브만 (시그널 점 OFF) | High |
| FR-04 | 뮤트 토글 시 트레이 아이콘 즉시 전환 | High |
| FR-05 | Active 상태: 볼륨 조절 중 시그널 밝아짐 (선택적) | Low |

### 4.2 Technical Requirements

| Requirement | Detail |
|-------------|--------|
| Canvas 사용 | Electron `nativeImage.createFromBuffer` + offscreen canvas |
| 해상도 | 16x16 (1x), 32x32 (2x) |
| DPI 지원 | `scaleFactor` 감지하여 적절한 해상도 선택 |
| 색상 | 흰색 #FAFAFA (웨이브), #8B5CF6 (시그널) |

---

## 5. Implementation Approach

### 5.1 아이콘 생성 모듈

```
electron/tray-icon.js (신규)
├── createTrayIcon(state) → nativeImage
│   state: 'normal' | 'muted' | 'active'
├── drawWave(ctx, size) — 사운드 웨이브 곡선
└── drawSignal(ctx, size, state) — 퍼플 LED 점
```

### 5.2 상태 전환 흐름

```
[앱 시작] → createTrayIcon('normal') → tray.setImage()

[뮤트 토글]
  main.js: toggleMute() → result.muted
  → tray.setImage(createTrayIcon(result.muted ? 'muted' : 'normal'))

[볼륨 조절 중] (선택적)
  main.js: adjustVolume()
  → tray.setImage(createTrayIcon('active'))
  → 1.5초 후 → tray.setImage(createTrayIcon('normal'))
```

### 5.3 수정 대상 파일

| File | Change |
|------|--------|
| `electron/tray-icon.js` | **신규** — Canvas 아이콘 생성 모듈 |
| `electron/tray.js` | 아이콘 생성 연동, setTrayState(state) 함수 export |
| `electron/main.js` | 뮤트 토글 시 tray 상태 업데이트 호출 |

---

## 6. Risks

| Risk | Mitigation |
|------|------------|
| 16x16에서 웨이브+점이 뭉개질 수 있음 | 웨이브를 최대한 단순화, 점 크기 최소 2px |
| Canvas offscreen이 Electron 버전마다 다름 | `createCanvas` 대신 Buffer 직접 생성 검토 |
| 다크/라이트 테마 대응 | 흰색 아이콘으로 통일 (다크 트레이 기본) |

---

## 7. Next Steps

1. [ ] Design document 작성 (`pdca design tray-icon`)
2. [ ] `electron/tray-icon.js` 구현
3. [ ] `electron/tray.js` 연동
4. [ ] `electron/main.js` 상태 전환 연동
5. [ ] 실제 트레이에서 시각 확인

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-31 | Initial plan | donghun.kim |
