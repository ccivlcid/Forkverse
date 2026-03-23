# SETUP Screen Specification

> **Source of truth** for the Setup screen (`/setup`). Replaces the former REGISTER.md.

---

## 1. Screen Overview

| Property        | Value                                                        |
|-----------------|--------------------------------------------------------------|
| **Route**       | `/setup`                                                     |
| **Title**       | `setup -- terminal.social`                                   |
| **Description** | First-time profile configuration after GitHub OAuth. Displays data imported from GitHub (avatar, name, bio, repos count) and lets the user choose a Forkverse username. Only shown once on first connect. No sidebar -- full-width centered layout. B-plan: After setup, user is redirected to `/analyze` (not feed) to start their first repo analysis. |
| **Auth Required** | Partial. Requires a valid GitHub OAuth session without a completed profile. Redirects to `/` if profile is already set up. Redirects to `/login` if no session. |

---

## 2. Desktop Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│ terminal.social                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                                                                          │
│         ┌─ Setup ──────────────────────────────────────────────┐         │
│         │                                                       │         │
│         │  // connection established. configure profile.        │         │
│         │                                                       │         │
│         │  > imported from github:                              │         │
│         │    avatar: ✓ synced                                   │         │
│         │    name:   "Jiyeon Kim"                               │         │
│         │    bio:    "full-stack dev. open source lover."       │         │
│         │    repos:  42 public                                  │         │
│         │                                                       │         │
│         │  $ register --user=█jiyeon_dev                        │         │
│         │  (suggested from github: jiyeon-kim)                  │         │
│         │                                                       │         │
│         │  --display-name="Jiyeon Kim"           (edit ok)      │         │
│         │                                                       │         │
│         │  --bio="full-stack dev. open source…"  (edit ok)      │         │
│         │                                                       │         │
│         │                                                       │         │
│         │  ┌─────────────────────────────────────────────┐      │         │
│         │  │  [Enter] initialize profile                 │      │         │
│         │  └─────────────────────────────────────────────┘      │         │
│         │                                                       │         │
│         └───────────────────────────────────────────────────────┘         │
│                                                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Desktop with Validation Error

```
┌──────────────────────────────────────────────────────────────────────────┐
│ terminal.social                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│         ┌─ Setup ──────────────────────────────────────────────┐         │
│         │                                                       │         │
│         │  // connection established. configure profile.        │         │
│         │                                                       │         │
│         │  > imported from github:                              │         │
│         │    avatar: ✓ synced                                   │         │
│         │    name:   "Jiyeon Kim"                               │         │
│         │    bio:    "full-stack dev. open source lover."       │         │
│         │    repos:  42 public                                  │         │
│         │                                                       │         │
│         │  $ register --user=jy                                 │         │
│         │  error: username already taken (409)                  │         │
│         │                                                       │         │
│         │  --display-name="Jiyeon Kim"           (edit ok)      │         │
│         │                                                       │         │
│         │  --bio="full-stack dev. open source…"  (edit ok)      │         │
│         │                                                       │         │
│         │  ┌─────────────────────────────────────────────┐      │         │
│         │  │  [Enter] initialize profile                 │      │         │
│         │  └─────────────────────────────────────────────┘      │         │
│         │                                                       │         │
│         └───────────────────────────────────────────────────────┘         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Mobile Wireframe

```
┌─────────────────────────────────┐
│ terminal.social                  │
├─────────────────────────────────┤
│                                  │
│  ┌─ Setup ───────────────────┐  │
│  │                            │  │
│  │  // configure profile      │  │
│  │                            │  │
│  │  > imported from github:   │  │
│  │    avatar: ✓ synced        │  │
│  │    name: "Jiyeon Kim"      │  │
│  │    bio: "full-stack dev…"  │  │
│  │    repos: 42 public        │  │
│  │                            │  │
│  │  $ register                │  │
│  │  --user=█jiyeon_dev        │  │
│  │  (from github: jiyeon-kim) │  │
│  │                            │  │
│  │  --display-name=           │  │
│  │  "Jiyeon Kim" (edit ok)    │  │
│  │                            │  │
│  │  --bio=                    │  │
│  │  "full-stack…" (edit ok)   │  │
│  │                            │  │
│  │  ┌──────────────────────┐  │  │
│  │  │ [Enter] initialize   │  │  │
│  │  └──────────────────────┘  │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
└─────────────────────────────────┘
```

---

## 4. Component Tree

```
<SetupPage>                            // packages/client/src/pages/SetupPage.tsx
  <AuthLayout>                         // packages/client/src/components/layout/AuthLayout.tsx
    <HeaderBar />                      // packages/client/src/components/layout/HeaderBar.tsx
      └── (logo only, no sidebar, no breadcrumbs)
    <main>                             // centered vertically and horizontally
      <SetupForm>                      // packages/client/src/components/auth/SetupForm.tsx
        <SectionLabel />              // "// connection established. configure profile."
        <GitHubImportSummary />       // packages/client/src/components/auth/GitHubImportSummary.tsx
          └── avatar, name, bio, repos count from GitHub
        <CliInput                      // packages/client/src/components/auth/CliInput.tsx
          prefix="$ register --user="
          type="text"
        />
        <UsernameSuggestion />        // "(suggested from github: jiyeon-kim)"
        <FieldError />                // packages/client/src/components/auth/FieldError.tsx
        <CliInput
          prefix='--display-name="'
          suffix='"'
          type="text"
        />
        <EditableLabel />            // "(edit ok)" in text-gray-500
        <CliInput
          prefix='--bio="'
          suffix='"'
          type="text"
        />
        <EditableLabel />
        <SubmitButton                  // packages/client/src/components/auth/SubmitButton.tsx
          label="[Enter] initialize profile"
        />
      </SetupForm>
    </main>
  </AuthLayout>
</SetupPage>
```

---

## 5. State Requirements

### Zustand Stores

**`authStore`** (existing)
```typescript
{
  user: User | null;
  githubProfile: {
    githubId: string;
    githubUsername: string;
    avatarUrl: string;
    displayName: string;
    bio: string | null;
    publicRepos: number;
  } | null;
  isLoading: boolean;
  error: string | null;

  completeSetup: (data: {
    username: string;
    displayName?: string;
    bio?: string;
  }) => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}
```

### Local Component State (React useState)

```typescript
// SetupForm local state
{
  username: string;          // bound to --user= input, pre-filled from GitHub username
  displayName: string;       // bound to --display-name= input, pre-filled from GitHub
  bio: string;               // bound to --bio= input, pre-filled from GitHub
  isSubmitting: boolean;     // disables form during API call
  fieldErrors: {
    username: string | null;
  };
}
```

---

## 6. API Calls

### On Mount

| Trigger          | Endpoint          | Method | Purpose                                      |
|------------------|-------------------|--------|----------------------------------------------|
| Page load        | `/api/auth/me`    | GET    | Check session; redirect to `/` if setup complete, to `/login` if no session |

The GitHub profile data (avatar, name, bio, repos count) is available from the OAuth callback and stored in `authStore.githubProfile`. No additional API call is needed on mount.

### On User Interaction

| Trigger              | Endpoint              | Method | Purpose                          |
|----------------------|-----------------------|--------|----------------------------------|
| Submit form          | `/api/auth/setup`     | POST   | Complete profile setup           |

**Request payload:**
```json
{
  "username": "jiyeon_dev",
  "displayName": "Jiyeon Kim",
  "bio": "full-stack dev. open source lover."
}
```

**Success (201):** Auto-login (full session created), store user in `authStore`, redirect to `/` (global feed).

**Failure (400):** Display validation error below the relevant field.

**Failure (409):** Display "username already taken" below the username field.

---

## 7. User Interactions

| Element                    | Action            | Result                                                        |
|----------------------------|-------------------|---------------------------------------------------------------|
| Username input             | Type              | Updates local `username` state; clears username field error   |
| Username input             | Focus             | Border changes to `border-green-400`                          |
| Username input             | Blur              | Client-side validation: min 3 chars, alphanumeric + underscore |
| Display name input         | Type              | Updates local `displayName` state                             |
| Display name input         | Focus             | Border changes to `border-green-400`                          |
| Bio input                  | Type              | Updates local `bio` state                                     |
| Bio input                  | Focus             | Border changes to `border-green-400`                          |
| Submit button              | Click             | Validates all inputs, calls POST `/api/auth/setup`            |
| Keyboard: `Enter`          | Press (any input) | Submits the form                                              |
| Keyboard: `Tab`            | Press             | Moves focus: username -> displayName -> bio -> submit         |
| GitHub import summary      | Displayed         | Static display, shows data imported from GitHub               |
| Username suggestion        | Displayed         | Static hint showing GitHub username as suggestion             |
| Field error                | Displayed         | Clears when user starts typing in that field                  |

### Validation Rules (Client-side)

| Field        | Rule                                      | Error Message                                     |
|--------------|-------------------------------------------|---------------------------------------------------|
| Username     | Required, min 3 chars                     | `error: --user must be at least 3 characters`     |
| Username     | Alphanumeric + underscore only            | `error: --user allows only [a-z0-9_]`             |
| Display Name | Optional, max 50 chars                    | `error: --display-name must be at most 50 characters` |
| Bio          | Optional, max 300 chars                   | `error: --bio must be at most 300 characters`     |

### Validation Rules (Server-side, displayed on API response)

| HTTP Code | Condition               | Error Message                                     |
|-----------|-------------------------|---------------------------------------------------|
| 400       | Username too short       | `error: username too short (400)`                 |
| 400       | Username invalid chars   | `error: username allows only [a-z0-9_] (400)`    |
| 409       | Username already taken   | `error: username already taken (409)`             |

---

## 8. Loading State

### Submit Loading (while POST /auth/setup is in-flight)

```
┌─ Setup ──────────────────────────────────────────────┐
│                                                       │
│  // connection established. configure profile.        │
│                                                       │
│  > imported from github:                              │
│    avatar: ✓ synced                                   │
│    name:   "Jiyeon Kim"                               │
│    ...                                                │
│                                                       │
│  $ register --user=jiyeon_dev                         │
│                                                       │
│  --display-name="Jiyeon Kim"                          │
│                                                       │
│  --bio="full-stack dev. open source lover."           │
│                                                       │
│  ┌─────────────────────────────────────────────┐      │
│  │  initializing profile...                     │      │
│  └─────────────────────────────────────────────┘      │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Implementation:**
- Submit button text changes from `[Enter] initialize profile` to `initializing profile...`
- Button gets `opacity-40 cursor-not-allowed` styling
- All inputs become `disabled`
- GitHub import summary remains visible

### Initial Session Check

While checking `/api/auth/me` on mount:
- Show the setup form normally (no skeleton)
- GitHub import data renders from `authStore.githubProfile`
- If profile is already complete, redirect to `/`
- If no session, redirect to `/login`

---

## 9. Empty State

Not applicable for the setup page. The form is always displayed with GitHub-imported data pre-filled.

---

## 10. Error State

### Username Already Taken (409)

```
  $ register --user=jiyeon_dev
  error: username already taken (409)
  hint: try --user=jiyeon_dev_2
```

Error and hint appear directly below the username input field.

### Username Invalid (400)

```
  $ register --user=jy
  error: username too short (400)
```

### GitHub Session Expired (401)

```
  error: github session expired. please reconnect (401)
```

After 2 seconds, redirect to `/login`.

### Rate Limited (429)

```
  error: too many attempts. try again in 60s (429)
```

### Network Error / Server Down (500)

```
  error: connection failed. please try again (500)
```

**Styling for all errors:**
- Error text: `text-red-400 font-mono text-sm`
- Hint text: `text-yellow-400/70 font-mono text-sm`
- Field-specific errors appear directly below the related input with `mt-1`
- General errors appear below all inputs with `mt-4`
- No border or background on error lines (bare terminal output style)
- Field errors clear when the user types in the corresponding field
- General errors clear after 5 seconds or on next submission attempt

---

## 11. Test IDs (`data-testid`)

| Element | `data-testid` | Purpose |
|---------|---------------|---------|
| GitHub import summary | `github-import-summary` | E2E: verify GitHub data displayed |
| Username input | `username-input` | E2E: type username |
| Username suggestion | `username-suggestion` | E2E: verify GitHub suggestion |
| Display name input | `displayname-input` | E2E: type display name |
| Bio input | `bio-input` | E2E: type bio |
| Submit button | `setup-submit` | E2E: submit setup form |
| Username error | `username-error` | E2E: verify username error |
| General error | `setup-error` | E2E: verify general error |
| Setup form container | `setup-form` | E2E: verify form visible |

---

## 12. Accessibility Notes

| Requirement | Implementation |
|-------------|---------------|
| Form | `role="form"` with `aria-label="Set up your profile on terminal.social"` |
| GitHub import summary | `role="status"` with `aria-label="Data imported from GitHub"` |
| Username input | `aria-label="Username"` with `autocomplete="username"`, `aria-describedby="username-error username-suggestion"` |
| Display name input | `aria-label="Display name (pre-filled from GitHub, editable)"` with `autocomplete="name"` |
| Bio input | `aria-label="Bio (pre-filled from GitHub, editable)"` |
| Field errors | `role="alert"` with `aria-live="assertive"` per field |
| Editable labels | `aria-hidden="true"` (visual hint only) |
| Submit button | `aria-label="Initialize profile"`, `aria-disabled="true"` when submitting |

---

## See Also

- [DESIGN_GUIDE.md](../design/DESIGN_GUIDE.md) — Visual tokens, component specs, UI states
- [API.md](../specs/API.md) — Endpoint request/response details
- [CONVENTIONS.md](../guides/CONVENTIONS.md) — Coding rules for implementation
- [LOGIN.md](./LOGIN.md) — Related screen specification (GitHub OAuth connect)
