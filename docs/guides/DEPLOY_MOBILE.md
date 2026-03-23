# DEPLOY_MOBILE.md — Android & iOS 배포 실전 가이드

> Forkverse 모바일 앱 배포 가이드.
> 전체 아키텍처 및 전략은 [APP_RELEASE.md](../specs/APP_RELEASE.md), [MOBILE.md](../specs/MOBILE.md) 참고.
> Last updated: 2026-03-23

---

## 빠른 참조

```
웹 빌드 → Capacitor sync → 네이티브 빌드 → 스토어 제출

packages/client/
├── capacitor.config.ts    ← Capacitor 설정 (이미 생성됨)
├── dist/                  ← pnpm build 결과물
├── android/               ← npx cap add android 으로 생성
└── ios/                   ← npx cap add ios 로 생성
```

---

## 1. 사전 준비

### 1.1 필수 도구

| 도구 | Android | iOS | 설치 |
|------|---------|-----|------|
| Node.js 18+ | ✅ | ✅ | 이미 설치됨 |
| pnpm | ✅ | ✅ | 이미 설치됨 |
| Java JDK 17 | ✅ | - | `brew install openjdk@17` |
| Android Studio | ✅ | - | [developer.android.com](https://developer.android.com/studio) |
| Xcode 15+ | - | ✅ | Mac App Store (macOS 전용) |
| CocoaPods | - | ✅ | `sudo gem install cocoapods` |

```bash
# 환경 변수 (macOS ~/.zshrc 또는 ~/.bashrc)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
```

### 1.2 스토어 계정 (미리 개설)

| 스토어 | URL | 비용 | 심사 시간 |
|--------|-----|------|-----------|
| Google Play Console | [play.google.com/console](https://play.google.com/console) | $25 (1회) | 즉시 사용 가능 |
| Apple Developer | [developer.apple.com](https://developer.apple.com/programs/) | $99/년 | 1~3일 (계정 승인) |

---

## 2. 플랫폼 초기화 (최초 1회)

```bash
cd packages/client

# 1. 웹 빌드
pnpm build

# 2. 플랫폼 추가
npx cap add android
npx cap add ios

# 3. 네이티브에 웹 자산 동기화
npx cap sync
```

> `npx cap add` 는 `android/` 와 `ios/` 디렉토리를 자동 생성합니다.
> 이후 업데이트할 때는 `pnpm build && npx cap sync` 만 실행하면 됩니다.

---

## 3. Android 배포

### 3.1 개발/테스트 실행

```bash
cd packages/client

# 에뮬레이터 또는 연결된 기기에서 실행
npx cap run android

# Android Studio에서 열기 (디버깅, 로그 확인)
npx cap open android
```

### 3.2 서명 키스토어 생성 (최초 1회)

```bash
cd packages/client

keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore release.keystore \
  -alias forkverse \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

입력 항목:
- 키스토어 비밀번호 (안전하게 보관)
- 이름(CN): Forkverse
- 조직(O): terminal.social
- 국가(C): KR

> ⚠️ **`release.keystore` 파일과 비밀번호를 분실하면 앱 업데이트가 영구적으로 불가능합니다.**
> 반드시 별도 안전한 곳에 백업하세요 (1Password, Google Drive 암호화 등).

### 3.3 Gradle 서명 설정

```groovy
// android/app/build.gradle — android { } 블록 안에 추가

signingConfigs {
    release {
        storeFile file('../../release.keystore')
        storePassword System.getenv("KEYSTORE_PASSWORD")
        keyAlias 'forkverse'
        keyPassword System.getenv("KEY_PASSWORD")
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### 3.4 Release AAB 빌드

```bash
cd packages/client

# 1. 웹 빌드 + 동기화
pnpm build && npx cap sync android

# 2. AAB 빌드 (Play Store 제출용)
cd android
export KEYSTORE_PASSWORD="your-password"
export KEY_PASSWORD="your-key-password"
./gradlew bundleRelease

# 결과물:
# android/app/build/outputs/bundle/release/app-release.aab
```

### 3.5 Google Play Store 제출

```
1. play.google.com/console → "앱 만들기"
   ├── 앱 이름: Forkverse
   ├── 기본 언어: 한국어 (또는 English)
   ├── 유형: 앱 (게임 아님)
   ├── 유/무료: 무료
   └── 카테고리: 개발자 도구

2. "앱 콘텐츠" 항목 모두 작성
   ├── 개인정보처리방침 URL (필수)
   ├── 광고: 아니요
   ├── 앱 액세스: 제한됨 (GitHub OAuth 로그인 필요)
   │   └── 테스터 계정 정보 제공
   ├── 콘텐츠 등급: 설문 작성 → 전체 이용가
   └── 데이터 안전: 수집 항목 설명

3. "프로덕션" → 새 버전 만들기
   ├── app-release.aab 업로드
   ├── 버전명: 1.0.0
   └── 출시 노트 작성

4. "스토어 등록정보"
   ├── 아이콘: 512×512 PNG
   ├── 기능 그래픽: 1024×500 PNG
   ├── 스크린샷: 최소 2장 (1080×1920 이상)
   ├── 짧은 설명 (80자)
   └── 전체 설명 (4000자)

5. 심사 제출 → 초기 3~7일 소요
```

### 3.6 스토어 텍스트 (한국어)

**짧은 설명** (80자)
```
개발자 SNS. AI로 GitHub 레포 분석, 인사이트 공유, 포크로 확산.
```

**전체 설명**
```
Forkverse — 개발자를 위한 공유/확산 중심 SNS

⑂ 포크로 시작하는 개발자 커뮤니티
GitHub 레포 주소만 입력하면 AI가 아키텍처, 기술 스택, 강점, 리스크를
분석합니다. 결과를 피드에 공유하고, 다른 개발자가 포크(리포스트)하면서
인사이트가 확산됩니다.

🔍 AI 레포 분석
- 7개 섹션으로 구조화된 분석 결과 (요약, 기술스택, 아키텍처, 강점, 리스크, 개선점, CLI뷰)
- 리포트, PPTX, 애니메이션 워크스루 출력
- 9개 이상 AI 모델 지원 (Claude, GPT, Gemini, Ollama 등)

📢 개발자 소셜 피드
- 분석 결과를 피드에 공유
- GitHub 활동 (push, PR, release)이 자동 포스트로 변환
- 스타, 포크, 반응, 인용 포스트

⌨️ 터미널 감성
- 다크 모드 전용, 모노스페이스 타이포그래피
- 키보드 단축키 (j/k/s/o)
- 4개 언어 지원 (한국어, 영어, 중국어, 일본어)

🔑 GitHub 로그인
별도 가입 없이 GitHub OAuth로 즉시 연결.
```

---

## 4. iOS 배포

### 4.1 개발/테스트 실행

```bash
cd packages/client

# iOS 동기화 + CocoaPods 설치
npx cap sync ios

# Xcode에서 열기
npx cap open ios

# 또는 시뮬레이터에서 직접 실행
npx cap run ios
```

### 4.2 Apple Developer 설정

```
1. developer.apple.com → Certificates, Identifiers & Profiles

2. Identifiers → App IDs → "+"
   ├── Platform: iOS
   ├── Bundle ID: social.terminal.app (Explicit)
   ├── Description: Forkverse
   └── Capabilities: ✅ Push Notifications

3. Certificates → "+"
   ├── Apple Distribution (App Store 배포용)
   ├── CSR 파일 생성 (Keychain Access → Certificate Assistant → Request)
   ├── CSR 업로드 → 인증서 발급
   └── 인증서 다운로드 → 더블클릭으로 Keychain에 등록

4. Provisioning Profiles → "+"
   ├── Type: App Store Distribution
   ├── App ID: social.terminal.app
   ├── Certificate: 위에서 만든 Distribution 인증서
   └── 다운로드 → 더블클릭으로 Xcode에 등록
```

### 4.3 Xcode 프로젝트 설정

Xcode에서 `ios/App/App.xcworkspace` 열기 → App 타겟 선택:

```
Signing & Capabilities
├── Team: (내 Apple Developer 팀 선택)
├── Bundle Identifier: social.terminal.app
└── Automatically manage signing: ON (권장)

General → Identity
├── Display Name: Forkverse
├── Version: 1.0.0
└── Build: 1 (매 제출마다 +1)

Build Settings
├── iOS Deployment Target: 15.0
└── Enable Bitcode: No

Info.plist (필요시 추가)
├── NSUserNotificationsUsageDescription: "분석 완료 및 소셜 알림을 받습니다"
└── (카메라/사진 사용시 해당 Description 추가)
```

### 4.4 Archive 및 업로드

**방법 1: Xcode GUI (권장)**
```
1. Xcode → Product → Archive
2. Organizer 창 → "Distribute App"
3. Distribution method: App Store Connect
4. Destination: Upload
5. 자동 서명 → Upload 완료
```

**방법 2: 커맨드라인**
```bash
# Archive 생성
xcodebuild \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath ./build/Forkverse.xcarchive \
  archive

# App Store에 업로드
xcodebuild \
  -exportArchive \
  -archivePath ./build/Forkverse.xcarchive \
  -exportPath ./build/export \
  -exportOptionsPlist ExportOptions.plist
```

**ExportOptions.plist:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store</string>
  <key>teamID</key>
  <string>YOUR_TEAM_ID</string>
  <key>uploadBitcode</key>
  <false/>
  <key>uploadSymbols</key>
  <true/>
</dict>
</plist>
```

### 4.5 App Store Connect 제출

```
1. appstoreconnect.apple.com → "내 앱" → "+"
   ├── 플랫폼: iOS
   ├── 이름: Forkverse
   ├── 기본 언어: 한국어
   ├── 번들 ID: social.terminal.app
   └── SKU: forkverse-ios-001

2. 앱 정보
   ├── 카테고리: 개발자 도구 (Developer Tools)
   └── 개인정보 처리방침 URL (필수)

3. 가격 및 사용 가능 여부
   ├── 가격: 무료
   └── 출시 국가: 전체 (또는 선택)

4. 버전 1.0 준비
   ├── 빌드: TestFlight에서 업로드된 빌드 선택
   ├── 스크린샷 업로드 (아래 규격 참고)
   ├── 설명, 키워드, 지원 URL 작성
   └── 심사 정보:
       ├── 로그인 필요: 예
       └── 메모: "GitHub OAuth를 통해 로그인합니다.
                  테스트 계정: (GitHub ID/PW 제공)"

5. 심사 제출 → 초기 2~7일 소요
```

### 4.6 스크린샷 규격

| 디바이스 | 해상도 | 필수 |
|----------|--------|------|
| 6.7" iPhone (15 Pro Max) | 1290 × 2796 | ✅ |
| 6.5" iPhone (14 Plus) | 1242 × 2688 | ✅ |
| 5.5" iPhone (8 Plus) | 1242 × 2208 | ✅ |
| iPad Pro 12.9" | 2048 × 2732 | 선택 |

```bash
# Xcode Simulator에서 스크린샷 캡처:
# 1. Simulator → 원하는 기기 선택
# 2. 앱 실행 후 화면 캡처: Cmd + S
# 3. ~/Desktop 에 저장됨
```

---

## 5. 푸시 알림 설정

### 5.1 Android — Firebase Cloud Messaging (FCM)

```
1. console.firebase.google.com → 프로젝트 생성
2. "Android 앱 추가" → 패키지명: social.terminal.app
3. google-services.json 다운로드 → android/app/ 에 배치
4. android/build.gradle:
   classpath 'com.google.gms:google-services:4.4.0'
5. android/app/build.gradle:
   apply plugin: 'com.google.gms.google-services'
```

### 5.2 iOS — APNs

```
1. developer.apple.com → Keys → "+"
   ├── Name: Forkverse Push Key
   └── ✅ Apple Push Notifications service (APNs)
2. .p8 Key 파일 다운로드 (1회만 가능)
3. Key ID + Team ID 메모
4. Firebase에 등록 (Firebase → 프로젝트 설정 → Cloud Messaging → iOS)
   또는 서버에서 직접 APNs API 사용
```

### 5.3 서버 연동 (이미 구현됨)

```
- POST /api/notifications/push-token — 디바이스 토큰 등록
  Body: { token: "fcm-token-...", platform: "capacitor" }
- DB: push_tokens 테이블 (migration 028)
- 클라이언트: lib/native.ts → initPushNotifications()가 자동 호출
```

---

## 6. 딥링크 설정 (이미 구현됨)

서버에 `.well-known` 엔드포인트가 이미 구현되어 있습니다:

| 플랫폼 | 엔드포인트 | 설정 위치 |
|--------|-----------|----------|
| Android | `GET /.well-known/assetlinks.json` | `packages/server/src/index.ts` |
| iOS | `GET /.well-known/apple-app-site-association` | `packages/server/src/index.ts` |

**Android**: `ANDROID_CERT_FINGERPRINT` 환경변수에 SHA256 인증서 지문 설정 필요:
```bash
# SHA256 지문 확인
keytool -list -v -keystore release.keystore -alias forkverse | grep SHA256
```

**iOS**: `APPLE_TEAM_ID` 환경변수에 Apple Developer Team ID 설정 필요.

---

## 7. 업데이트 배포

일상적인 앱 업데이트 흐름:

```bash
cd packages/client

# 1. 코드 변경 후 빌드
pnpm build

# 2. 네이티브 동기화
npx cap sync

# 3a. Android
cd android
./gradlew bundleRelease
# → Play Console에 새 AAB 업로드 → 심사 제출

# 3b. iOS
npx cap open ios
# → Xcode → Product → Archive → Distribute → App Store Connect
# → App Store Connect에서 새 빌드 선택 → 심사 제출
```

### 버전 관리

```
버전 형식: MAJOR.MINOR.PATCH  (예: 1.2.0)
빌드 번호: 정수, 절대 감소 금지  (1 → 2 → 3 ...)

업데이트할 때 변경할 곳:
├── package.json → "version"
├── android/app/build.gradle → versionCode (정수 +1), versionName
└── ios/App/App.xcodeproj → Build (정수 +1), Version
```

---

## 8. CI/CD 자동화 (선택)

GitHub Actions로 태그 push 시 자동 빌드/배포:

```yaml
# .github/workflows/mobile-release.yml
name: Mobile Release

on:
  push:
    tags: ['v*']

jobs:
  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - run: pnpm install
      - run: pnpm --filter @forkverse/shared build
      - run: pnpm --filter @forkverse/client build
      - run: npx cap sync android
        working-directory: packages/client
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin' }
      - name: Decode keystore
        run: echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > packages/client/release.keystore
      - name: Build AAB
        working-directory: packages/client/android
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: ./gradlew bundleRelease
      - name: Upload to Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.PLAY_STORE_JSON_KEY }}
          packageName: social.terminal.app
          releaseFiles: packages/client/android/app/build/outputs/bundle/release/app-release.aab
          track: internal

  ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - run: pnpm install
      - run: pnpm --filter @forkverse/shared build
      - run: pnpm --filter @forkverse/client build
      - run: npx cap sync ios
        working-directory: packages/client
      - run: pod install
        working-directory: packages/client/ios/App
      - name: Build & Upload
        uses: yukiarrr/ios-build-action@v1.5.0
        with:
          project-path: packages/client/ios/App/App.xcworkspace
          p12-base64: ${{ secrets.IOS_P12_BASE64 }}
          p12-password: ${{ secrets.IOS_P12_PASSWORD }}
          mobileprovision-base64: ${{ secrets.IOS_MOBILEPROVISION_BASE64 }}
```

### 필요한 GitHub Secrets

| Secret | 설명 |
|--------|------|
| `KEYSTORE_BASE64` | `base64 release.keystore` 결과 |
| `KEYSTORE_PASSWORD` | 키스토어 비밀번호 |
| `KEY_PASSWORD` | 키 비밀번호 |
| `PLAY_STORE_JSON_KEY` | Google Play API JSON Key 내용 |
| `IOS_P12_BASE64` | iOS Distribution 인증서 (.p12) base64 |
| `IOS_P12_PASSWORD` | .p12 비밀번호 |
| `IOS_MOBILEPROVISION_BASE64` | Provisioning Profile base64 |

---

## 9. 배포 체크리스트

### 공통
- [ ] 웹 빌드 성공 (`pnpm build`)
- [ ] 개인정보처리방침 URL 준비
- [ ] 앱 아이콘 (512×512 PNG)
- [ ] 스크린샷 (각 플랫폼 규격)
- [ ] 딥링크 환경변수 설정 (`ANDROID_CERT_FINGERPRINT`, `APPLE_TEAM_ID`)

### Android
- [ ] `release.keystore` 생성 및 백업
- [ ] `google-services.json` 배치 (푸시 알림)
- [ ] `./gradlew bundleRelease` 성공
- [ ] Play Console 앱 콘텐츠 100% 작성
- [ ] 내부 테스트 → 프로덕션 심사 제출

### iOS
- [ ] Apple Developer 계정 + 인증서 + Provisioning Profile
- [ ] Xcode 서명 설정 완료
- [ ] `Product → Archive` 성공
- [ ] TestFlight 내부 테스트 완료
- [ ] App Store Connect 정보 작성 + 심사 제출

---

## 10. 심사 주의사항

### Android (Play Store)
- GitHub OAuth만 지원 → **테스터 계정 제공 필수**
- 타겟 API 레벨: 최신 Android SDK로 컴파일 (Play 정책)
- 앱 내 결제 없으면 별도 설정 불필요

### iOS (App Store)
- **Review 2.1**: 데모 계정 제공 — 심사팀에 테스트 GitHub 계정 제공
- **WebView 앱 거절 기준**: 단순 웹 래퍼는 거절됨. Forkverse는 네이티브 플러그인(푸시, 햅틱, 공유, StatusBar 등)을 사용하므로 통과 가능
- **Review 5.1.1**: 개인정보처리방침 URL 필수
- 앱 카테고리: Developer Tools

---

## See Also

- [APP_RELEASE.md](../specs/APP_RELEASE.md) — 상세 출시 스펙 (861줄)
- [MOBILE.md](../specs/MOBILE.md) — 모바일 전략 (PWA → Capacitor → Native)
- [PROGRESS.md](../PROGRESS.md) — Phase B4 진행 상황
