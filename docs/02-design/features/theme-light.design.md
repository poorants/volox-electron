# Design: theme-light

> 라이트 테마 CSS 파일 생성 및 파일 구조 정리

## 1. 파일 구조

### Before
```
renderer/
└── theme.css       ← 토큰 + 리셋 혼합
```

### After
```
renderer/
├── theme.css           ← 공통 리셋 + @import theme-dark.css
├── theme-dark.css      ← 다크 토큰 (:root)
└── theme-light.css     ← 라이트 토큰 (:root)
```

## 2. theme.css (공통)

```css
@import url('theme-dark.css');

/* Global Reset & Base */
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: var(--font-family);
  color: var(--text-primary);
  user-select: none;
}
```

## 3. theme-dark.css

현재 theme.css의 `:root { ... }` 블록 그대로 이동.

## 4. theme-light.css 토큰 매핑

| 카테고리 | 토큰 | Dark 값 | Light 값 |
|----------|------|---------|----------|
| Primary | --volox-400 | #A78BFA | #A78BFA |
| Primary | --volox-500 | #8B5CF6 | #8B5CF6 |
| Primary | --volox-600 | #7C3AED | #7C3AED |
| Primary | --volox-700 | #6D28D9 | #6D28D9 |
| Primary | --volox-glow | rgba(139,92,246,0.4) | rgba(139,92,246,0.25) |
| Primary | --volox-glow-strong | rgba(139,92,246,0.6) | rgba(139,92,246,0.35) |
| Primary | --volox-hover | rgba(139,92,246,0.1) | rgba(139,92,246,0.08) |
| Primary | --volox-active | rgba(139,92,246,0.18) | rgba(139,92,246,0.14) |
| Surface | --surface-0 | #09090B | #FFFFFF |
| Surface | --surface-1 | #18181B | #F4F4F5 |
| Surface | --surface-2 | #27272A | #E4E4E7 |
| Surface | --glass-bg | rgba(9,9,11,0.78) | rgba(255,255,255,0.85) |
| Border | --border | #3F3F46 | #D4D4D8 |
| Border | --border-accent | rgba(139,92,246,0.2) | rgba(139,92,246,0.25) |
| Border | --border-subtle | rgba(63,63,70,0.5) | rgba(212,212,216,0.6) |
| Text | --text-primary | #FAFAFA | #09090B |
| Text | --text-secondary | #A1A1AA | #52525B |
| Text | --text-tertiary | #71717A | #A1A1AA |
| Semantic | --mute-red | #EF4444 | #DC2626 |
| Semantic | --mute-red-glow | rgba(239,68,68,0.4) | rgba(220,38,38,0.2) |
| Semantic | --mute-red-strong | rgba(239,68,68,0.6) | rgba(220,38,38,0.3) |
| Semantic | --mute-red-hover | rgba(239,68,68,0.15) | rgba(220,38,38,0.08) |
| Semantic | --mute-red-light | #FCA5A5 | #F87171 |
| Semantic | --success | #16a34a | #15803d |
| Semantic | --success-glow | rgba(34,197,94,0.4) | rgba(21,128,61,0.2) |
| Misc | --bar-track | rgba(255,255,255,0.08) | rgba(0,0,0,0.08) |
| Effects | --shadow-menu | dark shadow | 0 4px 16px rgba(0,0,0,0.12), 0 0 1px rgba(139,92,246,0.1) |

Typography, Border Radius, blur, transition 값은 다크와 동일하게 유지.

## 5. 구현 순서

1. theme.css에서 `:root` 블록을 theme-dark.css로 이동
2. theme.css를 공통 리셋 + `@import` 구조로 변경
3. theme-light.css 생성
