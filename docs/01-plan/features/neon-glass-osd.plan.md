# Plan: Neon Glass OSD Theme

## Overview
새로운 테마 "Neon Glass"를 추가하고, OSD 디자인을 Awwwards급 퀄리티로 개선한다.
Minimal Glass의 깔끔함 + Neon Cyberpunk의 글로우 강조를 결합한 컨셉.

## Goals
1. `theme-neon-glass.css` 테마 파일 생성
2. OSD 시각적 디테일 개선 (레이아웃 유지, 퀄리티 향상)
3. 테마 피커에 Neon Glass 카드 추가

## Theme Concept: Neon Glass
- **배경**: 극도로 투명한 frosted glass (blur 강화, opacity 낮춤)
- **보더**: 얇은 네온 퍼플 글로우 라인
- **프로그레스 바**: 네온 그라데이션 + 강한 글로우 + 끝단 발광
- **텍스트**: 깨끗한 화이트 + 볼륨 값에 네온 틴트
- **전체 톤**: 다크 베이스지만 글래스 투명도가 높고, 네온 발광이 핵심 포인트

## OSD Detail Improvements (within bar layout)
- 프로그레스 바 높이 약간 증가 (6px → 4~5px, 더 세련된 비율)
- 바 끝단에 글로우 dot 추가 (볼륨 위치 표시)
- 바 트랙에 미세한 inner glow
- 아이콘을 이모지 → SVG/CSS 아이콘으로 교체 (선택적)
- 위젯 전체에 미세한 네온 보더 글로우 애니메이션
- 볼륨 값(%) 폰트 웨이트/사이즈 미세 조정
- 페이드인/아웃 트랜지션 곡선 개선

## Scope
- [x] `renderer/theme-neon-glass.css` — 새 테마 변수
- [x] `renderer/osd.html` — OSD 스타일 개선 (테마 변수 기반)
- [x] `renderer/theme-picker.html` — THEMES 배열에 neon-glass 추가
- [ ] 기존 dark/light 테마 OSD는 변경 없음

## Out of Scope
- Settings, Tray Menu UI 변경
- OSD 레이아웃 구조 변경 (가로 바 형태 유지)
- 구독/결제 연동
