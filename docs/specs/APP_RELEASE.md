# APP_RELEASE.md — Android & iOS 출시 가이드

> Forkverse 앱 스토어 출시를 위한 실전 가이드.
> 전략 전체는 [MOBILE.md](./MOBILE.md) 참고.
> Last updated: 2026-03-21

---

## 전체 흐름

```
Phase B3: PWA 준비          ← 앱 아이콘, manifest, Service Worker
    ↓
Phase B4-A: Capacitor 셋업  ← 패키지 설치, 플랫폼 추가
    ↓
Phase B4-B: 네이티브 빌드    ← Android Studio / Xcode
    ↓
Phase B4-C: 스토어 등록      ← 계정 개설, 앱 정보 입력, 심사 제출
```

---

## 1. 사전 준비

### 1.1 개발 환경 요구사항

| 도구 | 버전 | 용도 |
|------|------|------|
| Node.js | 18+ | 기존 빌드 |
| pnpm | 8+ | 패키지 관리 |
| Java JDK | 17 (LTS) | Android 빌드 |
| Android Studio | Hedgehog+ | Android SDK, 에뮬레이터 |
| Xcode | 15+ | iOS 빌드 (macOS 필수) |
| CocoaPods | 최신 | iOS 의존성 관리 |

```bash
# Java 확인
java -version   # openjdk 17 이상

# CocoaPods (macOS)
sudo gem install cocoapods
pod --version

# Android SDK 환경변수 (예: macOS ~/.zshrc)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 1.2 계정 사전 개설 (시간 소요 큼 — 미리 준비)

| 플랫폼 | URL | 비용 | 소요 시간 |
|--------|-----|------|-----------|
| Google Play Console | [play.google.com/console](https://play.google.com/console) | $25 (1회) | 즉시 |
| Apple Developer Program | [developer.apple.com](https://developer.apple.com/programs/) | $99/년 | 1–3일 (계정 심사) |

---

## 2. PWA 설정 (B3)

Capacitor 래핑 전, PWA가 먼저 완성되어야 합니다.

### 2.1 manifest.json 생성

```bash
# packages/client/public/manifest.json
```

```json
{
  "name": "Forkverse — Repo Analysis Platform",
  "short_name": "Forkverse",
  "description": "AI-powered GitHub repo analysis. Understand any codebase instantly.",
  "start_url": "/analyze",
  "display": "standalone",
  "background_color": "#08090d",
  "theme_color": "#3fb950",
  "orientation": "portrait-primary",
  "lang": "en",
  "categories": ["developer tools", "productivity"],
  "icons": [
    { "src": "/icons/icon-72.png",   "sizes": "72x72",   "type": "image/png" },
    { "src": "/icons/icon-96.png",   "sizes": "96x96",   "type": "image/png" },
    { "src": "/icons/icon-128.png",  "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144.png",  "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152.png",  "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192.png",  "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-384.png",  "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512.png",  "sizes": "512x512", "type": "image/png" },
    {
      "src": "/icons/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/analyze.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Analyze any GitHub repo with AI"
    },
    {
      "src": "/screenshots/feed.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Developer social feed"
    }
  ]
}
```

### 2.2 index.html에 manifest 링크 추가

```html
<!-- packages/client/index.html <head> 안에 -->
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#3fb950" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Forkverse" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

### 2.3 앱 아이콘 제작 체크리스트

터미널 미학을 유지하는 아이콘 디자인 기준:
- 배경: `#08090d` (최대한 어두운 void)
- 로고: `⑂Fork` 또는 `⑂` 심볼 + 초록 강조 `#3fb950`
- 단순하고 작은 크기에서도 읽힘

```
필요한 파일 목록 (packages/client/public/icons/):
├── icon-72.png
├── icon-96.png
├── icon-128.png
├── icon-144.png
├── icon-152.png
├── icon-192.png      ← Android 홈 화면
├── icon-384.png
├── icon-512.png      ← Play Store
└── icon-maskable.png ← Android 어댑티브 아이콘 (safe zone 80% 안에 로고)
```

> **도구**: [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator) — 원본 1024x1024 PNG 하나로 모든 크기 자동 생성

```bash
npx pwa-asset-generator ./src-icon.png ./public/icons --manifest ./public/manifest.json
```

---

## 3. Capacitor 설정 (B4-A)

### 3.1 패키지 설치

```bash
cd packages/client

# Capacitor 코어
pnpm add @capacitor/core
pnpm add -D @capacitor/cli

# 플러그인 (필수)
pnpm add @capacitor/app
pnpm add @capacitor/splash-screen
pnpm add @capacitor/status-bar
pnpm add @capacitor/push-notifications

# 플러그인 (선택)
pnpm add @capacitor/haptics
pnpm add @capacitor/keyboard
pnpm add @capacitor/share
pnpm add @capacitor/clipboard
```

### 3.2 Capacitor 초기화

```bash
cd packages/client

# 초기화 (프로젝트 루트에서 실행)
npx cap init "Forkverse" "social.terminal.app" --web-dir dist
```

### 3.3 capacitor.config.ts

```typescript
// packages/client/capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'social.terminal.app',
  appName: 'Forkverse',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // 개발 중에는 로컬 서버로:
    ...(isDev ? { url: 'http://10.0.2.2:7878' } : {}),
    // 프로덕션: 빌드된 assets 사용 (server.url 없음)
  },
  android: {
    buildOptions: {
      keystorePath: 'release.keystore',
      keystoreAlias: 'forkverse',
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#08090d',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0d1117',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
```

### 3.4 플랫폼 추가 및 초기 빌드

```bash
cd packages/client

# 플랫폼 추가 (최초 1회)
npx cap add android
npx cap add ios

# 웹 빌드 → native 동기화
pnpm build
npx cap sync

# 개발 확인 (에뮬레이터/디바이스에서 실행)
npx cap run android
npx cap run ios
```

### 3.5 딥링크 설정

#### Android — App Links

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="terminal.social" />
</intent-filter>
```

서버에 추가할 파일:
```json
// /.well-known/assetlinks.json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "social.terminal.app",
    "sha256_cert_fingerprints": ["AA:BB:CC:..."]
  }
}]
```

#### iOS — Universal Links

```json
// /.well-known/apple-app-site-association
{
  "applinks": {
    "details": [{
      "appIDs": ["TEAMID.social.terminal.app"],
      "components": [
        { "/": "/analyze*" },
        { "/": "/feed*" },
        { "/": "/@*" },
        { "/": "/post/*" },
        { "/": "/analysis/*" }
      ]
    }]
  }
}
```

---

## 4. Android 빌드 및 Play Store 출시 (B4-B/C)

### 4.1 서명 키스토어 생성 (최초 1회, 안전하게 보관)

```bash
keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore release.keystore \
  -alias forkverse \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 입력 항목:
# 키스토어 비밀번호, 이름(CN), 조직(O), 도시(L), 도/주(ST), 국가(C=KR)
```

> ⚠️ **`release.keystore` 분실 시 앱 업데이트 불가** — 반드시 안전한 곳에 백업 (비밀번호와 함께)

### 4.2 Gradle 서명 설정

```groovy
// android/app/build.gradle
android {
  signingConfigs {
    release {
      storeFile file('../release.keystore')
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
}
```

### 4.3 Release 빌드

```bash
# 1. 웹 빌드
cd packages/client && pnpm build

# 2. Android 동기화
npx cap sync android

# 3. AAB 빌드 (Play Store용 — APK보다 AAB 권장)
cd android
export KEYSTORE_PASSWORD="your-password"
export KEY_PASSWORD="your-key-password"
./gradlew bundleRelease

# 결과물: android/app/build/outputs/bundle/release/app-release.aab

# APK도 필요하다면:
./gradlew assembleRelease
# 결과물: android/app/build/outputs/apk/release/app-release.apk
```

### 4.4 Google Play Console 등록 절차

```
1. play.google.com/console → 앱 만들기
   - 앱 이름: Forkverse
   - 기본 언어: 한국어 (ko) 또는 English (en)
   - 앱 유형: 앱 (게임 아님)
   - 유료/무료: 무료
   - 카테고리: 개발자 도구

2. 앱 콘텐츠 → 각 항목 작성
   ├── 개인정보처리방침 URL 필수
   ├── 광고 여부: 아니요
   ├── 앱 액세스: 로그인 필요 (GitHub OAuth)
   │     → 테스터 계정 제공
   └── 콘텐츠 등급: 설문 작성 (전체 이용가 예상)

3. 프로덕션 트랙 → 새 버전 만들기
   ├── AAB 업로드: app-release.aab
   ├── 버전명: 1.0.0
   └── 출시 노트 작성 (한국어/영어)

4. 스토어 등록정보
   ├── 아이콘: 512×512 PNG (배경 없음)
   ├── 기능 그래픽: 1024×500 PNG (Play Store 배너)
   ├── 스크린샷: 최소 2장
   │     - 휴대전화: 1080×1920 이상
   │     - 7인치 태블릿 (선택)
   │     - 10인치 태블릿 (선택)
   └── 짧은 설명 (80자), 전체 설명 (4000자)

5. 검토 제출 → 초기 심사 3–7일
```

### 4.5 스토어 등록정보 텍스트

**짧은 설명 (80자)**
```
AI로 아무 GitHub 레포나 즉시 분석. 개발자를 위한 인사이트와 소셜 피드.
```

**전체 설명 (한국어)**
```
Forkverse는 AI 기반 GitHub 레포지토리 분석 플랫폼입니다.

🔍 레포 분석
GitHub 레포 주소 하나만 입력하면 AI가 아키텍처, 기술 스택, 강점, 리스크, 개선 방향을 분석합니다. 리포트, PPTX 슬라이드, 또는 애니메이션 워크스루로 결과를 받으세요.

📢 개발자 소셜 피드
분석 결과를 피드에 공유하세요. 다른 개발자들이 발견하고 토론합니다. GitHub 활동(push, PR, 릴리스)이 자동으로 소셜 포스트가 됩니다.

🤖 9+ AI 모델 지원
Anthropic Claude, OpenAI GPT, Google Gemini, Ollama(로컬), OpenRouter, Together, Groq, Cerebras 중 선택. 내 키로, 내 모델을 사용합니다.

🔑 GitHub 로그인
별도 계정 없이 GitHub OAuth로 바로 연결. 내 GitHub 정체성이 그대로 소셜 프로필이 됩니다.

⌨️ 터미널 미학
키보드 우선 네비게이션. 다크 모드 전용. 4개 언어 지원(영어, 한국어, 중국어, 일본어).
```

---

## 5. iOS 빌드 및 App Store 출시 (B4-B/C)

### 5.1 Apple Developer 설정

```
1. developer.apple.com → Certificates, IDs & Profiles

2. Identifiers → App IDs → +
   - Bundle ID: social.terminal.app
   - Description: Forkverse
   - Capabilities: Push Notifications 체크

3. Certificates → +
   - Apple Distribution (프로덕션 배포용)
   → CSR 생성 후 업로드 → 인증서 다운로드 → Keychain 등록

4. Provisioning Profiles → +
   - App Store Distribution
   - App ID: social.terminal.app
   → 다운로드 → Xcode에 등록
```

### 5.2 Xcode 프로젝트 설정

```bash
# Capacitor sync 후 Xcode 열기
cd packages/client
npx cap sync ios
npx cap open ios
```

Xcode에서:
```
1. App target 선택 → Signing & Capabilities
   - Team: 내 Apple Developer Team
   - Bundle Identifier: social.terminal.app
   - Automatically manage signing: ON (권장)

2. General → Identity
   - Version: 1.0.0
   - Build: 1

3. Info.plist 확인/추가
   - NSCameraUsageDescription (카메라 사용시)
   - NSPhotoLibraryUsageDescription (사진 첨부시)
   - NSUserNotificationsUsageDescription: "분석 완료 및 소셜 알림을 받습니다"

4. Build Settings
   - iOS Deployment Target: 15.0
   - Enable Bitcode: No (Capacitor)
```

### 5.3 Archive 및 업로드

```bash
# Xcode에서:
# Product → Archive
# → Distribute App → App Store Connect → Upload

# 또는 xcodebuild 커맨드라인:
xcodebuild \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath ./build/Forkverse.xcarchive \
  archive

xcodebuild \
  -exportArchive \
  -archivePath ./build/Forkverse.xcarchive \
  -exportPath ./build/export \
  -exportOptionsPlist ExportOptions.plist
```

```xml
<!-- ExportOptions.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
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

### 5.4 App Store Connect 등록 절차

```
1. appstoreconnect.apple.com → 내 앱 → +
   - 플랫폼: iOS
   - 이름: Forkverse
   - 기본 언어: 한국어
   - 번들 ID: social.terminal.app
   - SKU: forkverse-ios-001

2. 앱 정보
   - 카테고리: 개발자 도구 (Developer Tools)
   - 개인정보 처리방침 URL 필수

3. 가격 및 사용 가능 여부
   - 가격: 무료
   - 출시 국가: 전체 또는 선택

4. 1.0 준비 → 빌드 추가
   - Xcode에서 업로드한 빌드 선택 (TestFlight 경유)
   - 심사 정보 입력

5. 스크린샷
   - 6.7인치 (iPhone 15 Pro Max): 필수
   - 6.5인치 (iPhone 14 Plus): 필수
   - 5.5인치 (iPhone 8 Plus): 필수
   - iPad Pro 12.9인치 (선택)
   → 해상도 정확히 맞춰야 함 (Simulator로 캡처 가능)

6. 앱 심사 정보
   - 로그인 필요: 예
   → 데모 계정 제공 (GitHub OAuth는 직접 로그인이므로 설명 필요)
   → 메모: "GitHub OAuth를 통해 로그인합니다. 테스트용 GitHub 계정: ID/PW"

7. 제출 → 심사 1–7일 (첫 제출은 보통 2–3일)
```

### 5.5 스크린샷 규격

| 디바이스 | 필수 해상도 |
|----------|------------|
| 6.7인치 iPhone (15 Pro Max) | 1290 × 2796 |
| 6.5인치 iPhone (14 Plus) | 1242 × 2688 |
| 5.5인치 iPhone (8 Plus) | 1242 × 2208 |
| iPad Pro 12.9인치 (선택) | 2048 × 2732 |

```bash
# Simulator에서 캡처:
# iPhone 15 Pro Max 선택 → 앱 실행 → Cmd+S (스크린샷)
# 저장 위치: ~/Desktop
```

---

## 6. 푸시 알림 연동

### 6.1 Android — Firebase Cloud Messaging (FCM)

```
1. console.firebase.google.com → 프로젝트 생성 → Android 앱 추가
   - Android 패키지명: social.terminal.app
   - google-services.json 다운로드 → android/app/ 에 배치

2. android/build.gradle (프로젝트 레벨)
   dependencies {
     classpath 'com.google.gms:google-services:4.4.0'
   }

3. android/app/build.gradle
   apply plugin: 'com.google.gms.google-services'
   dependencies {
     implementation platform('com.google.firebase:firebase-bom:32.7.0')
     implementation 'com.google.firebase:firebase-messaging'
   }
```

### 6.2 iOS — APNs

```
1. developer.apple.com → Certificates → +
   - Apple Push Notification service SSL (Sandbox & Production)
   - App ID: social.terminal.app
   → 인증서 다운로드 → .p12 내보내기

2. Firebase에 APNs 인증서 등록 (Firebase 사용 시)
   또는 APNs 직접 사용 시: .p8 Key 발급
   - Certificates → Keys → + → Apple Push Notifications service (APNs)
   - Key ID 및 Team ID 메모
```

### 6.3 서버 푸시 발송 (향후 구현)

```typescript
// packages/server/src/lib/push.ts (구현 예시)
// FCM v1 API 사용
async function sendPush(token: string, title: string, body: string) {
  await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      },
    }),
  });
}
```

---

## 7. CI/CD 자동화 (선택 — Fastlane)

### 7.1 Fastlane 설치

```bash
# macOS
brew install fastlane

cd packages/client/ios
fastlane init
```

### 7.2 Android Fastfile

```ruby
# packages/client/android/fastlane/Fastfile
default_platform(:android)

platform :android do
  desc "Deploy to Play Store Internal Track"
  lane :internal do
    gradle(
      task: "bundle",
      build_type: "Release",
      project_dir: "./"
    )
    upload_to_play_store(
      track: "internal",
      aab: "app/build/outputs/bundle/release/app-release.aab",
      json_key: ENV["PLAY_STORE_JSON_KEY"]
    )
  end

  desc "Promote to Production"
  lane :production do
    upload_to_play_store(
      track: "internal",
      track_promote_to: "production"
    )
  end
end
```

### 7.3 iOS Fastfile

```ruby
# packages/client/ios/fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Push to TestFlight"
  lane :beta do
    build_app(
      workspace: "App/App.xcworkspace",
      scheme: "App",
      configuration: "Release"
    )
    upload_to_testflight(
      api_key_path: "AuthKey.json"
    )
  end

  desc "Submit to App Store"
  lane :release do
    deliver(
      submit_for_review: true,
      automatic_release: false,
      force: true
    )
  end
end
```

### 7.4 GitHub Actions 워크플로우

```yaml
# .github/workflows/mobile-release.yml
name: Mobile Release

on:
  push:
    tags:
      - 'v*'

jobs:
  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: pnpm install && pnpm build
        working-directory: packages/client
      - run: npx cap sync android
        working-directory: packages/client
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin' }
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
      - run: pnpm install && pnpm build
        working-directory: packages/client
      - run: npx cap sync ios
        working-directory: packages/client
      - run: pod install
        working-directory: packages/client/ios/App
      - name: Build & Upload to TestFlight
        uses: yukiarrr/ios-build-action@v1.5.0
        with:
          project-path: packages/client/ios/App/App.xcworkspace
          p12-base64: ${{ secrets.IOS_P12_BASE64 }}
          p12-password: ${{ secrets.IOS_P12_PASSWORD }}
          mobileprovision-base64: ${{ secrets.IOS_MOBILEPROVISION_BASE64 }}
          app-store-connect-api-key-id: ${{ secrets.ASC_KEY_ID }}
          app-store-connect-api-issuer-id: ${{ secrets.ASC_ISSUER_ID }}
          app-store-connect-api-key-base64: ${{ secrets.ASC_KEY_BASE64 }}
```

---

## 8. 버전 관리 전략

```
버전 형식: MAJOR.MINOR.PATCH
예시: 1.0.0

- MAJOR: 큰 기능 변경 (Phase 전환)
- MINOR: 새 기능 추가 (B2, B3 등)
- PATCH: 버그 수정, 디자인 개선

Build Number (iOS) / versionCode (Android):
- 절대 감소 금지 (스토어 규칙)
- 릴리스마다 +1
- 예: 1 → 2 → 3 ...
```

```groovy
// android/app/build.gradle
android {
  defaultConfig {
    versionCode 1        // 매 릴리스마다 +1
    versionName "1.0.0"  // 사람이 읽는 버전
  }
}
```

---

## 9. 출시 체크리스트

### 공통

- [ ] 앱 아이콘 전체 사이즈 준비
- [ ] 스크린샷 (각 플랫폼 규격 맞게)
- [ ] 개인정보처리방침 URL (필수)
- [ ] 이용약관 URL
- [ ] 딥링크 검증 파일 서버 배포 (`.well-known/`)
- [ ] GitHub OAuth 콜백 URL에 앱 scheme 추가 (필요시)

### Android

- [ ] `release.keystore` 백업 (비밀번호 포함 — 분실 불가)
- [ ] `google-services.json` 배치
- [ ] AAB 빌드 성공
- [ ] Play Console 앱 콘텐츠 100% 작성
- [ ] 내부 테스트 트랙 → 내부 팀 테스트
- [ ] 프로덕션 출시 신청

### iOS

- [ ] Apple Developer 인증서/Provisioning Profile 설정
- [ ] Push Notification Entitlement 활성화
- [ ] Info.plist 권한 설명 작성
- [ ] Archive 빌드 성공
- [ ] TestFlight 내부 테스트
- [ ] App Store Connect 모든 정보 작성
- [ ] 심사 제출 (로그인 방법 설명 첨부)

---

## 10. 심사 주의사항

### Android (Play Store)
- GitHub OAuth 로그인만 지원하는 경우 → **"게스트 로그인" 또는 테스트 계정 제공 필수**
- 앱 내 결제 없으면 별도 설정 불필요
- 타겟 API 레벨: 최신 Android SDK (Play 정책)

### iOS (App Store)
- **Review 2.1**: 데모 계정 제공 — GitHub 계정 직접 로그인이므로 심사팀에 테스트용 GitHub 계정 제공
- **Review 4.0**: 앱이 명확한 기능 제공 → "Developer Tools" 카테고리로 충분
- **Review 5.1.1**: 개인정보처리방침 URL 필수
- WebView 앱이지만 실질적인 앱 기능을 제공하면 통과 가능 (단순 웹래퍼 거절 기준 해당 안 됨)

---

## See Also

- [MOBILE.md](./MOBILE.md) — 모바일 전략 전체
- [PROGRESS.md](../PROGRESS.md) — Phase B3/B4 진행 상황
- [PRD.md](./PRD.md) — 제품 요구사항
