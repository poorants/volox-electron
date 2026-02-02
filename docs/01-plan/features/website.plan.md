# Plan: website

> Volox 제품 소개 웹사이트 — Awwwards 수준의 세련된 랜딩페이지

## 1. 배경 (Background)

Volox는 Windows 시스템 볼륨을 단축키+마우스 휠로 조절하는 트레이 유틸리티.
제품의 가치를 전달하고 다운로드를 유도할 세련된 소개 페이지가 필요.

## 2. 목표 (Goals)

- Awwwards 등록 수준의 비주얼 퀄리티
- Volox 브랜드(Electric Violet, Glass morphism, Neon glow) 일관성
- 단일 페이지, 정적 HTML/CSS/JS (프레임워크 없음)
- `/website` 디렉토리에 독립 구성

## 3. 요구사항 (Requirements)

### 섹션 구성
- Hero: 제품명 + 태그라인 + CTA(다운로드) + 비주얼
- Features: 핵심 기능 3~4개 카드
- How it works: 사용 방법 시각적 설명
- Download CTA: 최종 다운로드 유도
- Footer: 저작권, GitHub 링크

### 비주얼 요소
- Smooth scroll + scroll-triggered animations
- Glass morphism 카드
- Neon glow 효과
- 커스텀 커서 또는 마우스 인터랙션
- 그라디언트 배경 + 파티클/그리드 효과
- 반응형 (모바일/태블릿/데스크톱)

### 기술
- 순수 HTML + CSS + Vanilla JS
- 외부 의존성 최소 (폰트만 Google Fonts)
- `/website/index.html` 단일 진입점

## 4. 범위 제외 (Out of Scope)

- 백엔드, CMS
- 다국어
- 실제 다운로드 파일 호스팅 (링크만 placeholder)
