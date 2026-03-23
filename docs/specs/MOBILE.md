# MOBILE.md — Mobile Strategy

> **Source of truth** for mobile platform strategy, responsive design guidelines, and native app roadmap.
> Created: 2026-03-21

---

## 1. Overview

Forkverse follows a **progressive mobile strategy**: start with responsive web, add PWA capabilities, wrap with Capacitor for app stores, and consider native only if needed at scale.

```
Phase B3: Mobile Web + PWA (cost: low, reuses existing code)
    ↓
Phase B4: Capacitor (cost: medium, reuses web code, store presence)
    ↓
Phase B6+: React Native (cost: high, only if Capacitor is insufficient)
```

**Core principle**: One codebase as long as possible. Native only when justified by user scale or platform-specific needs.

---

## 2. Current State

### What exists
- Responsive layout with `sm:` breakpoint (640px = desktop threshold)
- Bottom navigation (`MobileNav.tsx`) with 5 items: Feed, Explore, Create, Activity, Profile
- Mobile header (`HeaderBar.tsx`) with responsive sizing
- Mobile-specific patterns: `hidden sm:flex`, `sm:hidden`, `pb-14 sm:pb-0`
- Touch-friendly tap targets on buttons and cards

### What needs to change (B-plan)
- Mobile nav center button: Create Post → **Analyze**
- Post creation: Move from center nav to FAB or header button
- Analyze page: Optimize form layout for mobile (single column, large inputs)
- Result viewing: Card stack layout for sectioned results
- Home page: Mobile Hero with prominent repo input

---

## 3. Phase B3 — Mobile Web + PWA

### 3.1 Responsive Improvements

#### Mobile Navigation (Bottom Nav)

```
Current:    ~     ◆    [+]    ●    @
           feed  expl  new   actv  prof

B-plan:     ~     ◆    [▶]    ●    @
           feed  expl  anlz  actv  prof
```

| Position | Icon | Label | Route | Note |
|----------|------|-------|-------|------|
| 1 | `~` | feed | `/feed` | Global/local feed |
| 2 | `◆` | explore | `/explore` | Trending analyses |
| 3 (center) | `▶` | analyze | `/analyze` | **Primary action** — larger button, green accent |
| 4 | `●` | activity | `/activity` | Activity feed |
| 5 | `@` | profile | `/@me` | User profile |

Post creation moves to:
- FAB (floating action button) on feed page: `+` in bottom-right corner
- Header bar button on desktop (existing)

#### Mobile Analyze Page

```
┌─────────────────────────────────┐
│ ← Analyze            @user     │
├─────────────────────────────────┤
│                                  │
│  $ analyze --repo=               │
│  ┌────────────────────────────┐  │
│  │ owner/repo                 │  │  ← full-width, large touch target
│  └────────────────────────────┘  │
│                                  │
│  --output=                       │
│  ┌─────┐ ┌─────┐ ┌──────┐      │
│  │rept │ │pptx │ │video │      │  ← pill buttons, min 44px height
│  └─────┘ └─────┘ └──────┘      │
│                                  │
│  --model=                        │
│  ┌────────────────────────────┐  │
│  │ claude-sonnet           ▾ │  │  ← bottom sheet selector on tap
│  └────────────────────────────┘  │
│                                  │
│  --lang=en                       │
│                                  │
│  ┌────────────────────────────┐  │
│  │ $ analyze                  │  │  ← sticky bottom CTA on scroll
│  └────────────────────────────┘  │
│                                  │
│  // recent analyses              │
│  ■ vercel/next.js · report · 3h │
│  ■ ccivlcid/Forkverse · pptx · 1d│
│                                  │
├─────────────────────────────────┤
│  ~    ◆    [▶]    ●    @       │
└─────────────────────────────────┘
```

#### Mobile Result Viewing (Card Stack)

Analysis results displayed as scrollable section cards:

```
┌─────────────────────────────────┐
│ ← Result: vercel/next.js  [↗]  │
├─────────────────────────────────┤
│                                  │
│ ┌─ Executive Summary ────────┐  │
│ │ "Next.js is a production-  │  │
│ │  grade React framework..." │  │
│ │                    [copy]  │  │
│ └────────────────────────────┘  │
│                                  │
│ ┌─ Tech Stack ───────────────┐  │
│ │ TypeScript 87% · React     │  │
│ │ Turbopack · Webpack        │  │
│ │                    [copy]  │  │
│ └────────────────────────────┘  │
│                                  │
│ ┌─ Architecture ─────────────┐  │
│ │ Monorepo (Turborepo)       │  │
│ │ App Router + Pages Router  │  │
│ │ Server Components          │  │
│ │                    [copy]  │  │
│ └────────────────────────────┘  │
│                                  │
│ ┌─ Strengths ────────────────┐  │
│ │ ...                        │  │
│ └────────────────────────────┘  │
│                                  │
│ ┌─ Risks ────────────────────┐  │
│ │ ...                        │  │
│ └────────────────────────────┘  │
│                                  │
│ ┌──────────┐ ┌───────────────┐  │
│ │$ download│ │$ share        │  │  ← sticky bottom action bar
│ └──────────┘ └───────────────┘  │
│                                  │
├─────────────────────────────────┤
│  ~    ◆    [▶]    ●    @       │
└─────────────────────────────────┘
```

### 3.2 Touch Interaction Guidelines

| Interaction | Min Size | Implementation |
|-------------|----------|----------------|
| Tap targets | 44x44px | All buttons, links, nav items |
| Swipe | — | Back navigation (native feel) |
| Pull to refresh | — | Feed pages, analysis history |
| Long press | — | Context menu on analysis cards (share, copy link) |
| Scroll momentum | — | Native scroll behavior, no custom scroll |

### 3.3 PWA Configuration

#### Web App Manifest (`manifest.json`)

```json
{
  "name": "Forkverse — Repo Analysis Platform",
  "short_name": "Forkverse",
  "description": "AI-powered GitHub repo analysis with developer insights",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0d1117",
  "theme_color": "#3fb950",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/analyze.png", "sizes": "1080x1920", "type": "image/png", "form_factor": "narrow" },
    { "src": "/screenshots/result.png", "sizes": "1080x1920", "type": "image/png", "form_factor": "narrow" }
  ]
}
```

#### Service Worker Strategy

| Resource | Strategy | Notes |
|----------|----------|-------|
| App shell (HTML, CSS, JS) | Cache-first | Offline-capable shell |
| API responses | Network-first | Always try fresh data |
| Analysis results | Stale-while-revalidate | Show cached, update in background |
| Images/avatars | Cache-first | Long-lived cache |
| Fonts (JetBrains Mono) | Cache-first | Loaded once |

#### Offline Behavior

| State | Behavior |
|-------|----------|
| No connection | Show cached feed + analyses, disable new analysis |
| Partial connection | Queue analysis requests, sync when online |
| Returned online | Auto-sync queued items, refresh feed |

---

## 4. Phase B4 — Capacitor (App Store Release)

### 4.1 Why Capacitor

| Factor | Capacitor | React Native | Flutter |
|--------|-----------|-------------|---------|
| Code reuse from web | **~95%** | ~30% | 0% |
| Development effort | **Low** | High | Very High |
| Store presence | Yes | Yes | Yes |
| Native feel | Good (with plugins) | Great | Great |
| Web technology | **Same React + Tailwind** | Different components | Dart |

Capacitor is the right choice because:
1. Current codebase is React + Vite — Capacitor wraps it directly
2. No need to rewrite UI components
3. Native plugins available for push, camera, share, etc.
4. Can always migrate to React Native later if needed

### 4.2 Capacitor Setup

```bash
# Add Capacitor to the client package
cd packages/client
pnpm add @capacitor/core @capacitor/cli
npx cap init "Forkverse" "social.terminal.app" --web-dir dist

# Add platforms
npx cap add android
npx cap add ios

# Build and sync
pnpm build
npx cap sync
```

#### Capacitor Config (`capacitor.config.ts`)

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'social.terminal.app',
  appName: 'Forkverse',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // In development:
    // url: 'http://localhost:7878',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      backgroundColor: '#0d1117',
      androidScaleType: 'CENTER_CROP',
      launchShowDuration: 1000,
    },
  },
};

export default config;
```

### 4.3 Native Features via Capacitor Plugins

| Feature | Plugin | Priority |
|---------|--------|----------|
| Push Notifications | `@capacitor/push-notifications` | P0 |
| Deep Links | `@capacitor/app` + App Links / Universal Links | P0 |
| Share | `@capacitor/share` | P1 |
| Splash Screen | `@capacitor/splash-screen` | P1 |
| Status Bar | `@capacitor/status-bar` | P1 |
| Haptics | `@capacitor/haptics` | P2 |
| Keyboard | `@capacitor/keyboard` | P2 |
| Clipboard | `@capacitor/clipboard` | P2 |
| Camera | `@capacitor/camera` | P3 (if profile photo upload) |
| Filesystem | `@capacitor/filesystem` | P3 (for PPTX download) |

### 4.4 Push Notifications

#### Architecture

```
Server → FCM (Android) / APNs (iOS) → Device → App → notification_tokens table
```

#### Token Registration Flow

```
App launch → Request permission → Get device token → POST /api/notifications/register
                                                      { token, platform: 'android' | 'ios' }
```

#### Notification Types

| Event | Push Title | Push Body |
|-------|-----------|-----------|
| Analysis complete | "Analysis complete" | "{repo} report is ready" |
| Star on your analysis | "@{user} starred your analysis" | "{repo} analysis" |
| New follower | "@{user} followed you" | — |
| Reply | "@{user} replied" | First 100 chars of reply |
| Fork | "@{user} forked your analysis" | "{repo}" |

### 4.5 Deep Links

| URL Pattern | App Route | Note |
|-------------|-----------|------|
| `terminal.social/` | `/` | Home |
| `terminal.social/analyze` | `/analyze` | Analyze page |
| `terminal.social/analysis/:id` | `/analysis/:id` | Specific result |
| `terminal.social/@:username` | `/@:username` | Profile |
| `terminal.social/post/:id` | `/post/:id` | Post detail |

#### Android (App Links)

```json
// assetlinks.json at terminal.social/.well-known/assetlinks.json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "social.terminal.app",
    "sha256_cert_fingerprints": ["..."]
  }
}]
```

#### iOS (Universal Links)

```json
// apple-app-site-association at terminal.social/.well-known/apple-app-site-association
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAMID.social.terminal.app",
      "paths": ["/*"]
    }]
  }
}
```

### 4.6 Store Listings

#### Android (Google Play)

| Field | Value |
|-------|-------|
| Package name | `social.terminal.app` |
| Category | Developer Tools |
| Min SDK | 24 (Android 7.0) |
| Target SDK | Latest stable |
| Signing | App Signing by Google Play |

#### iOS (App Store)

| Field | Value |
|-------|-------|
| Bundle ID | `social.terminal.app` |
| Category | Developer Tools |
| Min iOS | 15.0 |
| Signing | Xcode Managed Signing |

### 4.7 Build & Release Pipeline

```bash
# Android
pnpm build                     # Build web assets
npx cap sync android           # Sync to Android project
cd android && ./gradlew bundleRelease  # Build AAB

# iOS
pnpm build
npx cap sync ios
# Open in Xcode → Archive → Distribute
```

Future: Automate with GitHub Actions + Fastlane.

---

## 5. Phase B6+ — React Native (If Needed)

### When to consider React Native

- Capacitor performance becomes a bottleneck (janky animations, slow transitions)
- Need for heavy native integrations (widgets, share extensions, background processing)
- User base exceeds 100K+ and platform-specific features are demanded
- Investor/team decision to go full native

### Migration strategy

1. Keep API layer unchanged
2. Rewrite UI layer with React Native components
3. Share business logic via shared TypeScript packages
4. Gradual migration: start with most-used screens (Analyze, Results)

### What would change

| Layer | Web (current) | React Native |
|-------|--------------|-------------|
| UI components | React + Tailwind | React Native + NativeWind or StyleSheet |
| Navigation | React Router | React Navigation |
| State | Zustand | Zustand (shared) |
| API calls | fetch | fetch (shared) |
| Storage | localStorage | AsyncStorage / MMKV |

---

## 6. Responsive Breakpoints

| Breakpoint | Range | Layout |
|------------|-------|--------|
| Mobile | < 640px | Bottom nav, single column, stacked cards |
| Tablet | 640px – 1024px | Sidebar collapsible, 2-column where appropriate |
| Desktop | > 1024px | Fixed sidebar (220px), full layout |

### Critical Mobile Patterns

| Pattern | Implementation |
|---------|---------------|
| Bottom nav | `fixed bottom-0`, 48px height, 5 items, `sm:hidden` |
| Content padding | `pb-14` on mobile (nav clearance), `pb-0` on desktop |
| Sidebar | `hidden sm:flex`, 220px width |
| Stacked forms | Full-width inputs, vertical layout on mobile |
| Cards | Full-width on mobile, grid on desktop |
| Modals | Full-screen on mobile, centered on desktop |
| Selectors | Bottom sheet on mobile, dropdown on desktop |
| Sticky CTA | Fixed bottom bar for primary actions on mobile |

---

## 7. Performance Targets (Mobile)

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s (3G) |
| Largest Contentful Paint | < 2.5s (3G) |
| Time to Interactive | < 3s (3G) |
| Cumulative Layout Shift | < 0.1 |
| Bundle size | < 500KB gzipped |
| PWA Lighthouse score | > 90 |

---

## See Also

- [PRD.md](./PRD.md) — Product requirements (B-plan phases)
- [PROGRESS.md](../PROGRESS.md) — Phase tracking
- [DESIGN_UI.md](../design/DESIGN_UI.md) — Responsive design patterns
- [HOME.md](../screens/HOME.md) — Home page mobile wireframe
- [ANALYZE.md](../screens/ANALYZE.md) — Analyze page mobile wireframe
