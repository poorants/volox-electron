# Volox 배포 플랜

## 방식
GitHub 퍼블릭 저장소를 활용한 무료 배포 (서버 비용 0원)

## 구조

```
poorants/volox-electron (프라이빗) — 소스코드 + GitHub Actions 빌드 자동화
poorants/volox          (퍼블릭)   — 홈페이지 (GitHub Pages) + 릴리즈 다운로드
```

## 구성 요소

### 1. 저장소 구성
- **`volox-electron`** (프라이빗) — 소스코드, 빌드 워크플로우. 현재 저장소 그대로 유지
- **`volox`** (퍼블릭) — 프로젝트 대표 저장소. 소개 페이지 + 릴리즈 파일만 관리

### 2. GitHub Pages (소개 페이지)
- URL: `https://poorants.github.io/volox`
- 내용: 앱 소개, 스크린샷, 기능 설명, 다운로드 버튼
- 정적 HTML/CSS (별도 프레임워크 불필요)

### 3. GitHub Releases (파일 배포)
- `electron-builder`로 빌드한 `.exe` 파일을 릴리즈에 첨부
- 최신 다운로드 URL: `https://github.com/poorants/volox/releases/latest/download/volox-setup.exe`
- 소개 페이지의 다운로드 버튼에서 이 URL로 연결

### 4. 빌드 서버: GitHub Actions (무료)

별도 빌드 서버 불필요. GitHub이 제공하는 클라우드 러너에서 빌드.

- 프라이빗 저장소: 월 2,000분 무료 (빌드 1회 5~10분 → 월 200회 이상 가능)
- Windows/macOS/Linux 러너 제공 → 크로스 플랫폼 빌드 가능
- macOS 러너는 분당 10배 차감 (월 200분 상당) — 그래도 소규모면 충분

### 5. 빌드 & 배포 파이프라인

**트리거:** `volox-electron` 저장소에 `v*` 태그 푸시 시 자동 실행

**흐름:**
```
git tag v2.3.0 && git push --tags
        ↓
GitHub Actions (volox-electron 저장소)
        ↓
  ┌─────────────────────┬─────────────────────┐
  │  Windows 러너        │  macOS 러너          │
  │  npm ci → build     │  npm ci → build     │
  │  → volox-setup.exe   │  → volox.dmg         │
  └─────────┬───────────┴──────────┬──────────┘
            ↓                      ↓
    volox 저장소 Releases에 업로드
```

**워크플로우 파일:** `.github/workflows/release.yml` (추후 생성)
```yaml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - name: Create .env
        run: |
          echo "FIREBASE_API_KEY=${{ secrets.FIREBASE_API_KEY }}" >> .env
          echo "FIREBASE_AUTH_DOMAIN=${{ secrets.FIREBASE_AUTH_DOMAIN }}" >> .env
          echo "FIREBASE_PROJECT_ID=${{ secrets.FIREBASE_PROJECT_ID }}" >> .env
          echo "FIREBASE_APP_ID=${{ secrets.FIREBASE_APP_ID }}" >> .env
      - run: npm run build
      - name: Upload to volox-releases
        uses: softprops/action-gh-release@v2
        with:
          repository: poorants/volox
          token: ${{ secrets.RELEASE_REPO_TOKEN }}
          files: dist/*.exe

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - name: Create .env
        run: |
          echo "FIREBASE_API_KEY=${{ secrets.FIREBASE_API_KEY }}" >> .env
          echo "FIREBASE_AUTH_DOMAIN=${{ secrets.FIREBASE_AUTH_DOMAIN }}" >> .env
          echo "FIREBASE_PROJECT_ID=${{ secrets.FIREBASE_PROJECT_ID }}" >> .env
          echo "FIREBASE_APP_ID=${{ secrets.FIREBASE_APP_ID }}" >> .env
      - run: npm run build
      - name: Upload to volox-releases
        uses: softprops/action-gh-release@v2
        with:
          repository: poorants/volox
          token: ${{ secrets.RELEASE_REPO_TOKEN }}
          files: dist/*.dmg
```

### 6. 필요한 GitHub Secrets (volox-electron 저장소에 등록)

| Secret 이름 | 용도 |
|---|---|
| `FIREBASE_API_KEY` | Firebase 클라이언트 키 |
| `FIREBASE_AUTH_DOMAIN` | Firebase Auth 도메인 |
| `FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID |
| `FIREBASE_APP_ID` | Firebase 앱 ID |
| `RELEASE_REPO_TOKEN` | volox 저장소에 릴리즈 생성 권한이 있는 Personal Access Token |

**수동 빌드 (로컬):**
```bash
npm run build
gh release create v2.x.0 ./dist/volox-setup.exe --repo poorants/volox
```

## 환경변수(.env) 관리

### 현재 .env 내용
Firebase 클라이언트 설정 (apiKey, authDomain, projectId, appId)

### 분류
- **Firebase 클라이언트 키**: 비밀이 아님. Firebase 설계상 공개되는 값이며 Security Rules로 보호하는 구조. 빌드에 포함해도 무방
- **서버 시크릿 (현재 없음)**: 만약 추가된다면 클라이언트 앱에 절대 포함 금지. 별도 백엔드 서버에서만 사용

### 배포 빌드 시 주입 방법

**수동 빌드:**
- 로컬 `.env` 파일 유지, `dotenv`가 빌드 시 로드 (현재 방식 그대로)

**GitHub Actions 자동 빌드:**
1. GitHub 저장소 Settings → Secrets and variables → Actions에 등록:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_APP_ID`
2. 워크플로우에서 `.env` 파일 생성 후 빌드:
   ```yaml
   - name: Create .env
     run: |
       echo "FIREBASE_API_KEY=${{ secrets.FIREBASE_API_KEY }}" >> .env
       echo "FIREBASE_AUTH_DOMAIN=${{ secrets.FIREBASE_AUTH_DOMAIN }}" >> .env
       echo "FIREBASE_PROJECT_ID=${{ secrets.FIREBASE_PROJECT_ID }}" >> .env
       echo "FIREBASE_APP_ID=${{ secrets.FIREBASE_APP_ID }}" >> .env
   - name: Build
     run: npm run build
   ```

### 주의사항
- `.env` 파일은 `.gitignore`에 포함하여 저장소에 커밋하지 않음
- Electron 앱(.exe)은 언패킹 가능하므로 진짜 비밀 키는 절대 포함 금지
- 클라이언트 키가 노출되어도 Firebase Security Rules가 데이터를 보호하는지 반드시 확인

## 작업 순서

1. [x] 배포 플랜 수립
2. [ ] GitHub Actions 빌드 자동화 + `volox` 퍼블릭 저장소 생성 + 홈페이지(GitHub Pages) + 릴리즈 다운로드 구성
3. [ ] 자동 업데이트 (electron-updater) 구성

## 자동 업데이트 계획 (3단계)

앱이 실행 중일 때 새 버전이 나오면 자동으로 감지 → 다운로드 → 업데이트하는 기능.

### 방식
- `electron-updater` (electron-builder 내장) 사용
- GitHub Releases를 업데이트 서버로 활용 (추가 서버 비용 없음)
- `volox` 퍼블릭 저장소의 릴리즈에서 `latest.yml` + 설치파일을 자동 확인

### 흐름
```
앱 시작 → autoUpdater.checkForUpdates()
        → volox 저장소 latest 릴리즈 확인
        → 새 버전 있으면 백그라운드 다운로드
        → 사용자에게 알림 → 재시작 시 적용
```

### 필요 작업
- `electron-builder` 설정에 `publish` provider 추가 (GitHub)
- main process에 `electron-updater` 로직 추가
- 업데이트 알림 UI (OSD 또는 트레이 알림)
- 빌드 시 코드 서명 (Windows: Authenticode, macOS: Apple Developer ID) — 서명 없으면 업데이트 차단될 수 있음
