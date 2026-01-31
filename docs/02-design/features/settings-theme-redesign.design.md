# Design: Settings Theme Redesign

## 1. 변경 파일 목록

| # | 파일 | 변경 유형 |
|---|------|-----------|
| 1 | `electron/tray.js` | 수정 - frameless 윈도우 설정 |
| 2 | `renderer/settings.html` | 수정 - 커스텀 타이틀바 + 스크롤바 CSS |

## 2. 상세 설계

### 2-1. `electron/tray.js` 변경

```diff
 settingsWindow = new BrowserWindow({
   width: 420,
-  height: 520,
+  height: 540,
   resizable: false,
-  frame: true,
+  frame: false,
   title: 'Voly',
   backgroundColor: '#09090B',
```

- `frame: false`: 네이티브 타이틀바 제거
- height 540: 커스텀 타이틀바(40px) 추가 여유

### 2-2. `renderer/settings.html` - 커스텀 타이틀바

#### HTML 구조 (body 최상단)
```html
<div class="titlebar">
  <span class="titlebar-title">Voly Settings</span>
  <button class="titlebar-close" id="titlebar-close">✕</button>
</div>
```

#### CSS
```css
.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 6px 0 16px;
  -webkit-app-region: drag;
  border-bottom: 1px solid var(--border);
}
.titlebar-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
}
.titlebar-close {
  -webkit-app-region: no-drag;
  width: 32px; height: 32px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-tertiary);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.titlebar-close:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #EF4444;
}
```

#### JS
```js
document.getElementById('titlebar-close').addEventListener('click', () => window.close());
```

### 2-3. `renderer/settings.html` - 커스텀 스크롤바

```css
/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--voly-600);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--voly-500);
  box-shadow: 0 0 8px var(--voly-glow);
}
```

### 2-4. body 패딩 조정

기존 `padding: 28px 24px 20px` → `padding: 20px 24px 20px`
(타이틀바가 추가되므로 상단 패딩 줄임)

## 3. 구현 순서
1. `electron/tray.js` - frame: false, height 조정
2. `renderer/settings.html` - 커스텀 타이틀바 HTML/CSS/JS 추가
3. `renderer/settings.html` - 커스텀 스크롤바 CSS 추가
4. `renderer/settings.html` - body 패딩 조정

## 4. 검증 기준
- [ ] Windows 기본 타이틀바가 보이지 않음
- [ ] 커스텀 타이틀바로 창 드래그 가능
- [ ] ✕ 버튼으로 창 닫기 동작
- [ ] 스크롤바가 보라색 테마로 표시됨
- [ ] 기존 기능(단축키 설정, 슬라이더, 저장) 정상 동작
