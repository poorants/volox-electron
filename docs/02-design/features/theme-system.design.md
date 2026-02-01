# Design: theme-system

> 3개 UI의 디자인 토큰을 통합 CSS 파일로 추출하여 테마 시스템 기반 구축

## 1. 파일 구조

```
renderer/
├── theme.css           ← 신규: 모든 디자인 토큰 + 공통 리셋
├── osd.html            ← 수정: :root 제거, theme.css import
├── settings.html       ← 수정: :root 제거, theme.css import
└── tray-menu.html      ← 수정: :root 제거, theme.css import
```

## 2. theme.css 토큰 정의

### 2.1 Colors
```css
--voly-400: #A78BFA;
--voly-500: #8B5CF6;
--voly-600: #7C3AED;
--voly-700: #6D28D9;
--voly-glow: rgba(139, 92, 246, 0.4);
--voly-glow-strong: rgba(139, 92, 246, 0.6);
--voly-hover: rgba(139, 92, 246, 0.1);
--voly-active: rgba(139, 92, 246, 0.18);
--surface-0: #09090B;
--surface-1: #18181B;
--surface-2: #27272A;
--glass-bg: rgba(9, 9, 11, 0.78);
--border: #3F3F46;
--border-accent: rgba(139, 92, 246, 0.2);
--border-subtle: rgba(63, 63, 70, 0.5);
--text-primary: #FAFAFA;
--text-secondary: #A1A1AA;
--text-tertiary: #71717A;
--mute-red: #EF4444;
--mute-red-glow: rgba(239, 68, 68, 0.4);
--mute-red-strong: rgba(239, 68, 68, 0.6);
--mute-red-hover: rgba(239, 68, 68, 0.15);
--mute-red-light: #FCA5A5;
--success: #16a34a;
--success-glow: rgba(34, 197, 94, 0.4);
--bar-track: rgba(255, 255, 255, 0.08);
```

### 2.2 Typography
```css
--font-family: 'Segoe UI', system-ui, sans-serif;
--font-size-xs: 11px;
--font-size-sm: 12px;
--font-size-md: 13px;
--font-size-lg: 14px;
--font-size-xl: 20px;
--font-size-2xl: 28px;
--font-size-icon: 22px;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;
```

### 2.3 Spacing & Sizing
```css
--radius-sm: 3px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 10px;
--radius-2xl: 12px;
--radius-3xl: 14px;
--radius-4xl: 16px;
--radius-full: 50%;
```

### 2.4 Effects
```css
--blur-md: 20px;
--blur-lg: 24px;
--shadow-menu: 0 8px 32px rgba(0,0,0,0.5), 0 0 1px rgba(139,92,246,0.15);
--transition-fast: 120ms;
--transition-normal: 150ms;
--transition-slow: 250ms;
```

### 2.5 공통 리셋
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: var(--font-family);
  color: var(--text-primary);
  user-select: none;
}
```

## 3. 각 HTML 변경 매핑

### osd.html 하드코딩 → 변수
| 기존 | 변경 |
|------|------|
| `font-family: 'Segoe UI'...` | 공통 리셋에서 처리 |
| `rgba(9, 9, 11, 0.75)` | `var(--glass-bg)` |
| `blur(20px)` | `blur(var(--blur-md))` |
| `border-radius: 16px` | `var(--radius-4xl)` |
| `font-size: 22px` | `var(--font-size-icon)` |
| `font-size: 11px` | `var(--font-size-xs)` |
| `font-size: 28px` | `var(--font-size-2xl)` |
| `font-weight: 500/600` | `var(--font-weight-medium/semibold)` |
| `rgba(255, 255, 255, 0.08)` | `var(--bar-track)` |
| `border-radius: 3px` | `var(--radius-sm)` |
| `rgba(239, 68, 68, 0.6)` | `var(--mute-red-strong)` |
| `180ms / 250ms / 120ms` | `var(--transition-normal/slow/fast)` |

### settings.html 하드코딩 → 변수
| 기존 | 변경 |
|------|------|
| `font-family: 'Segoe UI'...` | 공통 리셋에서 처리 |
| `border-radius: 6/8/10/12px` | `var(--radius-md/lg/xl/2xl)` |
| `font-size: 11/12/13/14/16/20px` | 해당 토큰 |
| `font-weight: 500/600/700/800` | 해당 토큰 |
| `rgba(239, 68, 68, 0.15)` | `var(--mute-red-hover)` |
| `#EF4444` (hover color) | `var(--mute-red)` |
| `#16a34a` | `var(--success)` |
| `rgba(34, 197, 94, 0.4)` | `var(--success-glow)` |
| `rgba(63, 63, 70, 0.5)` | `var(--border-subtle)` |
| `0.15s / 0.2s` | `var(--transition-normal)` |

### tray-menu.html 하드코딩 → 변수
| 기존 | 변경 |
|------|------|
| `font-family: 'Segoe UI'...` | 공통 리셋에서 처리 |
| `rgba(9, 9, 11, 0.82)` | `var(--glass-bg)` |
| `blur(24px)` | `blur(var(--blur-lg))` |
| `border-radius: 14px` | `var(--radius-3xl)` |
| `box-shadow: 0 8px 32px...` | `var(--shadow-menu)` |
| `font-size: 11/13/14/20px` | 해당 토큰 |
| `font-weight: 500/600` | 해당 토큰 |
| `rgba(139, 92, 246, 0.1)` | `var(--voly-hover)` |
| `rgba(139, 92, 246, 0.18)` | `var(--voly-active)` |
| `rgba(239, 68, 68, 0.1)` | `var(--mute-red-hover)` (근사치) |
| `#FCA5A5` | `var(--mute-red-light)` |

## 4. 구현 순서

1. `renderer/theme.css` 생성
2. `renderer/osd.html` 리팩터
3. `renderer/settings.html` 리팩터
4. `renderer/tray-menu.html` 리팩터
