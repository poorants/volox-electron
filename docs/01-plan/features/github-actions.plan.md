# GitHub Actions 빌드 자동화 Plan

## 1. 개요

### 1.1 목적
- volox-electron 저장소에서 태그 푸시 시 자동 빌드
- Windows/macOS 크로스 플랫폼 빌드
- volox 퍼블릭 저장소 Releases에 실행 파일 자동 업로드

### 1.2 범위
- GitHub Actions 워크플로우 파일 작성
- electron-builder 빌드 설정 확인/수정
- GitHub Secrets 등록 가이드
- 빌드 테스트 및 검증

### 1.3 배경
```
poorants/volox-electron (Private) → 소스코드 + GitHub Actions
poorants/volox (Public) → 홈페이지 (GitHub Pages) + Releases 다운로드
```

## 2. 요구사항

### 2.1 기능 요구사항
| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | `v*` 태그 푸시 시 자동 빌드 트리거 | 필수 |
| FR-02 | Windows 빌드 (.exe 설치파일) | 필수 |
| FR-03 | macOS 빌드 (.dmg) | 필수 |
| FR-04 | volox 저장소 Releases에 자동 업로드 | 필수 |
| FR-05 | Firebase 환경변수 주입 | 필수 |
| FR-06 | 빌드 실패 시 알림 | 선택 |

### 2.2 비기능 요구사항
| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-01 | 빌드 시간 | 10분 이내 (플랫폼당) |
| NFR-02 | 무료 티어 범위 | 월 2,000분 내 |

## 3. 기술 스택

### 3.1 CI/CD
- **GitHub Actions**: 빌드 자동화
- **softprops/action-gh-release@v2**: 릴리즈 업로드

### 3.2 빌드 도구
- **electron-builder**: Electron 앱 패키징
- **Node.js 20**: 런타임

### 3.3 러너
- **windows-latest**: Windows 빌드
- **macos-latest**: macOS 빌드 (분당 10배 차감)

## 4. 구현 계획

### 4.1 작업 목록

| Phase | 작업 | 산출물 |
|-------|------|--------|
| 1 | electron-builder 설정 확인 | package.json 수정 (필요시) |
| 2 | GitHub Actions 워크플로우 작성 | `.github/workflows/release.yml` |
| 3 | GitHub Secrets 등록 | 5개 시크릿 |
| 4 | 테스트 빌드 | v2.2.1 태그로 검증 |

### 4.2 Phase 1: electron-builder 설정 확인

```json
// package.json build 섹션 확인 사항
{
  "build": {
    "appId": "com.poorants.volox",
    "productName": "Volox",
    "win": {
      "target": ["nsis"],
      "artifactName": "volox-setup-${version}.${ext}"
    },
    "mac": {
      "target": ["dmg"],
      "artifactName": "volox-${version}.${ext}"
    }
  }
}
```

### 4.3 Phase 2: GitHub Actions 워크플로우

**파일**: `.github/workflows/release.yml`

**트리거**: `v*` 태그 푸시
```yaml
on:
  push:
    tags: ['v*']
```

**Jobs**:
1. `build-windows` (windows-latest)
2. `build-macos` (macos-latest)

**공통 스텝**:
1. Checkout
2. Setup Node.js 20
3. npm ci
4. Create .env (secrets 주입)
5. npm run build
6. Upload to volox Releases

### 4.4 Phase 3: GitHub Secrets 등록

**volox-electron 저장소에 등록할 Secrets**:

| Secret Name | 용도 | 값 출처 |
|-------------|------|---------|
| `FIREBASE_API_KEY` | Firebase 클라이언트 키 | Firebase Console |
| `FIREBASE_AUTH_DOMAIN` | Firebase Auth 도메인 | Firebase Console |
| `FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID | Firebase Console |
| `FIREBASE_APP_ID` | Firebase 앱 ID | Firebase Console |
| `RELEASE_REPO_TOKEN` | volox 저장소 쓰기 권한 PAT | GitHub Settings → Developer settings → PAT |

**PAT(Personal Access Token) 생성**:
- Scope: `repo` (Full control of private repositories)
- 또는 Fine-grained: `volox` 저장소에 Contents/Releases write 권한

### 4.5 Phase 4: 테스트 빌드

```bash
# 테스트 태그 생성
git tag v2.2.1
git push origin v2.2.1

# GitHub Actions 탭에서 빌드 확인
# volox 저장소 Releases에서 파일 확인
```

## 5. 파일 구조

```
volox-electron/
├── .github/
│   └── workflows/
│       └── release.yml      # [신규] 빌드 워크플로우
├── package.json             # build 설정 확인
└── .env                     # (로컬만, gitignore)

volox/
└── (Releases)               # 빌드된 파일 자동 업로드
    ├── volox-setup-2.2.1.exe
    └── volox-2.2.1.dmg
```

## 6. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| macOS 빌드 분당 10배 차감 | 무료 티어 소진 빠름 | 릴리즈 빈도 조절, Windows만 빌드 옵션 |
| PAT 만료 | 릴리즈 업로드 실패 | Fine-grained PAT (no expiration) 또는 갱신 알림 |
| 코드 서명 없음 | Windows SmartScreen 경고 | 추후 코드 서명 도입 (자동 업데이트 단계에서) |

## 7. 성공 기준

- [ ] `v*` 태그 푸시 시 GitHub Actions 자동 실행
- [ ] Windows .exe 파일 빌드 성공
- [ ] macOS .dmg 파일 빌드 성공
- [ ] volox 저장소 Releases에 파일 업로드 완료
- [ ] 다운로드 URL 정상 동작: `https://github.com/poorants/volox/releases/latest`

## 8. 다음 단계

- 홈페이지 (GitHub Pages) 구성 → 다운로드 버튼 연결
- 자동 업데이트 (electron-updater) 구성
