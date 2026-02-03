# GitHub Actions 빌드 자동화 Design

## 1. 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                    volox-electron (Private)                      │
│                                                                  │
│  git tag v2.2.1 && git push --tags                              │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              GitHub Actions Workflow                     │    │
│  │                 release.yml                              │    │
│  │  ┌─────────────────┐     ┌─────────────────┐           │    │
│  │  │ build-windows   │     │ build-macos     │           │    │
│  │  │ windows-latest  │     │ macos-latest    │           │    │
│  │  │                 │     │                 │           │    │
│  │  │ 1. checkout     │     │ 1. checkout     │           │    │
│  │  │ 2. setup-node   │     │ 2. setup-node   │           │    │
│  │  │ 3. npm ci       │     │ 3. npm ci       │           │    │
│  │  │ 4. create .env  │     │ 4. create .env  │           │    │
│  │  │ 5. npm run build│     │ 5. npm run build│           │    │
│  │  │ 6. upload       │     │ 6. upload       │           │    │
│  │  └────────┬────────┘     └────────┬────────┘           │    │
│  └───────────┼───────────────────────┼─────────────────────┘    │
└──────────────┼───────────────────────┼──────────────────────────┘
               │                       │
               ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      volox (Public)                              │
│                                                                  │
│  Releases                                                        │
│  ├── v2.2.1                                                     │
│  │   ├── volox-setup-2.2.1.exe                                  │
│  │   └── volox-2.2.1.dmg                                        │
│  └── latest → v2.2.1                                            │
│                                                                  │
│  Download URL:                                                   │
│  https://github.com/poorants/volox/releases/latest              │
└─────────────────────────────────────────────────────────────────┘
```

## 2. 파일 구조

### 2.1 신규/수정 파일

```
volox-electron/
├── .github/
│   └── workflows/
│       └── release.yml        # [신규] 빌드 워크플로우
└── package.json               # [수정] artifactName 추가
```

### 2.2 워크플로우 파일 위치

```
.github/workflows/release.yml
```

## 3. 상세 설계

### 3.1 package.json 수정사항

**현재**:
```json
{
  "build": {
    "win": {
      "target": "nsis"
    },
    "mac": {
      "target": "dmg"
    }
  }
}
```

**수정 후**:
```json
{
  "build": {
    "win": {
      "target": "nsis",
      "artifactName": "volox-setup-${version}.${ext}"
    },
    "mac": {
      "target": "dmg",
      "artifactName": "volox-${version}.${ext}"
    }
  }
}
```

### 3.2 release.yml 워크플로우

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Create .env
        run: |
          echo "FIREBASE_API_KEY=${{ secrets.FIREBASE_API_KEY }}" >> .env
          echo "FIREBASE_AUTH_DOMAIN=${{ secrets.FIREBASE_AUTH_DOMAIN }}" >> .env
          echo "FIREBASE_PROJECT_ID=${{ secrets.FIREBASE_PROJECT_ID }}" >> .env
          echo "FIREBASE_APP_ID=${{ secrets.FIREBASE_APP_ID }}" >> .env

      - name: Build Windows
        run: npm run build:win

      - name: Upload to volox Releases
        uses: softprops/action-gh-release@v2
        with:
          repository: poorants/volox
          token: ${{ secrets.RELEASE_REPO_TOKEN }}
          files: dist/*.exe
          tag_name: ${{ github.ref_name }}
          name: Volox ${{ github.ref_name }}
          draft: false
          prerelease: false

  build-macos:
    runs-on: macos-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Create .env
        run: |
          echo "FIREBASE_API_KEY=${{ secrets.FIREBASE_API_KEY }}" >> .env
          echo "FIREBASE_AUTH_DOMAIN=${{ secrets.FIREBASE_AUTH_DOMAIN }}" >> .env
          echo "FIREBASE_PROJECT_ID=${{ secrets.FIREBASE_PROJECT_ID }}" >> .env
          echo "FIREBASE_APP_ID=${{ secrets.FIREBASE_APP_ID }}" >> .env

      - name: Build macOS
        run: npm run build:mac

      - name: Upload to volox Releases
        uses: softprops/action-gh-release@v2
        with:
          repository: poorants/volox
          token: ${{ secrets.RELEASE_REPO_TOKEN }}
          files: dist/*.dmg
          tag_name: ${{ github.ref_name }}
          name: Volox ${{ github.ref_name }}
          draft: false
          prerelease: false
```

### 3.3 GitHub Secrets 설정

**저장소**: `poorants/volox-electron` → Settings → Secrets and variables → Actions

| Secret Name | 값 예시 | 출처 |
|-------------|---------|------|
| `FIREBASE_API_KEY` | `AIzaSy...` | Firebase Console → Project Settings |
| `FIREBASE_AUTH_DOMAIN` | `volox-xxx.firebaseapp.com` | Firebase Console |
| `FIREBASE_PROJECT_ID` | `volox-xxx` | Firebase Console |
| `FIREBASE_APP_ID` | `1:123456:web:abc...` | Firebase Console |
| `RELEASE_REPO_TOKEN` | `ghp_...` | GitHub Settings → Developer settings → PAT |

### 3.4 Personal Access Token (PAT) 생성

**경로**: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens

**설정**:
- Token name: `volox-release-token`
- Expiration: No expiration (또는 1년)
- Repository access: Only select repositories → `poorants/volox`
- Permissions:
  - Contents: Read and write
  - Metadata: Read-only (자동 선택됨)

## 4. 구현 순서

| 순서 | 작업 | 파일 |
|------|------|------|
| 1 | package.json에 artifactName 추가 | `package.json` |
| 2 | .github/workflows 디렉토리 생성 | - |
| 3 | release.yml 워크플로우 작성 | `.github/workflows/release.yml` |
| 4 | GitHub Secrets 등록 (수동) | GitHub 웹 UI |
| 5 | 테스트 태그 푸시 | `git tag v2.2.1` |
| 6 | 빌드 결과 확인 | GitHub Actions 탭 |

## 5. 빌드 산출물

### 5.1 Windows
- **파일명**: `volox-setup-2.2.1.exe`
- **경로**: `dist/volox-setup-2.2.1.exe`
- **타입**: NSIS 설치 파일

### 5.2 macOS
- **파일명**: `volox-2.2.1.dmg`
- **경로**: `dist/volox-2.2.1.dmg`
- **타입**: DMG 디스크 이미지

## 6. 검증 체크리스트

- [ ] package.json artifactName 설정 완료
- [ ] release.yml 문법 오류 없음 (yamllint)
- [ ] GitHub Secrets 5개 모두 등록
- [ ] PAT에 volox 저장소 쓰기 권한 있음
- [ ] `v*` 태그 푸시 시 워크플로우 트리거됨
- [ ] Windows 빌드 성공 + exe 업로드됨
- [ ] macOS 빌드 성공 + dmg 업로드됨
- [ ] volox Releases에서 다운로드 가능

## 7. 예상 이슈 및 대응

| 이슈 | 원인 | 대응 |
|------|------|------|
| `npm ci` 실패 | package-lock.json 불일치 | `npm install` 후 커밋 |
| koffi 빌드 실패 (macOS) | native addon 호환성 | optionalDependencies 확인 |
| 릴리즈 업로드 403 | PAT 권한 부족 | Contents write 권한 추가 |
| 중복 릴리즈 오류 | 같은 태그로 재시도 | 태그 삭제 후 재생성 |
