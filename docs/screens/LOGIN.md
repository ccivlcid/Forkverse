# LOGIN Screen Specification

> **Source of truth** for the Login screen (`/login`).

---

## 1. Screen Overview

| Property        | Value                                                        |
|-----------------|--------------------------------------------------------------|
| **Route**       | `/login`                                                     |
| **Title**       | `login -- terminal.social`                                   |
| **Description** | Terminal-style login page. Looks like a CLI prompt where the user types credentials into command flags. No sidebar -- full-width centered layout. Redirects to `/` if already authenticated. |
| **Auth Required** | No. Redirects to `/` (global feed) if session already exists. |

---

## 2. Desktop Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│ terminal.social                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                                                                          │
│                                                                          │
│                                                                          │
│         ┌─ Login ────────────────────────────────────────────┐           │
│         │                                                     │           │
│         │  // authenticate                                    │           │
│         │                                                     │           │
│         │  $ login --user=█                                   │           │
│         │                                                     │           │
│         │  --password=████████                                │           │
│         │                                                     │           │
│         │                                                     │           │
│         │  ┌──────────────────────────────┐                   │           │
│         │  │ [Enter] submit               │                   │           │
│         │  └──────────────────────────────┘                   │           │
│         │                                                     │           │
│         │  No account? $ register                             │           │
│         │                                                     │           │
│         └─────────────────────────────────────────────────────┘           │
│                                                                          │
│                                                                          │
│                                                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Desktop with Error

```
┌──────────────────────────────────────────────────────────────────────────┐
│ terminal.social                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                                                                          │
│         ┌─ Login ────────────────────────────────────────────┐           │
│         │                                                     │           │
│         │  // authenticate                                    │           │
│         │                                                     │           │
│         │  $ login --user=jiyeon_dev                          │           │
│         │                                                     │           │
│         │  --password=████████                                │           │
│         │                                                     │           │
│         │  error: invalid credentials (401)                   │           │
│         │                                                     │           │
│         │  ┌──────────────────────────────┐                   │           │
│         │  │ [Enter] submit               │                   │           │
│         │  └──────────────────────────────┘                   │           │
│         │                                                     │           │
│         │  No account? $ register                             │           │
│         │                                                     │           │
│         └─────────────────────────────────────────────────────┘           │
│                                                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Mobile Wireframe

```
┌─────────────────────────────────┐
│ terminal.social                  │
├─────────────────────────────────┤
│                                 │
│                                 │
│                                 │
│  ┌─ Login ──────────────────┐   │
│  │                           │   │
│  │  // authenticate          │   │
│  │                           │   │
│  │  $ login                  │   │
│  │  --user=█                 │   │
│  │                           │   │
│  │  --password=████████      │   │
│  │                           │   │
│  │                           │   │
│  │  ┌────────────────────┐   │   │
│  │  │ [Enter] submit     │   │   │
│  │  └────────────────────┘   │   │
│  │                           │   │
│  │  No account?              │   │
│  │  $ register               │   │
│  │                           │   │
│  └───────────────────────────┘   │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

---

## 4. Component Tree

```
<LoginPage>                            // packages/client/src/pages/LoginPage.tsx
  <AuthLayout>                         // packages/client/src/components/layout/AuthLayout.tsx
    <HeaderBar />                      // packages/client/src/components/layout/HeaderBar.tsx
      └── (logo only, no sidebar, no breadcrumbs)
    <main>                             // centered vertically and horizontally
      <LoginForm>                      // packages/client/src/components/auth/LoginForm.tsx
        <SectionLabel />              // "// authenticate"
        <CliInput                      // packages/client/src/components/auth/CliInput.tsx
          prefix="$ login --user="
          type="text"
        />
        <CliInput
          prefix="--password="
          type="password"
        />
        <ErrorMessage />              // packages/client/src/components/auth/ErrorMessage.tsx
        <SubmitButton                  // packages/client/src/components/auth/SubmitButton.tsx
          label="[Enter] submit"
        />
        <AuthLink                      // packages/client/src/components/auth/AuthLink.tsx
          text="No account?"
          command="$ register"
          to="/register"
        />
      </LoginForm>
    </main>
  </AuthLayout>
</LoginPage>
```

---

## 5. State Requirements

### Zustand Stores

**`authStore`** (existing)
```typescript
{
  user: User | null;
  isLoading: boolean;
  error: string | null;

  login: (credentials: { username: string; password: string }) => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}
```

### Local Component State (React useState)

```typescript
// LoginForm local state
{
  username: string;      // bound to --user= input
  password: string;      // bound to --password= input
  isSubmitting: boolean; // disables form during API call
}
```

No new Zustand store is needed. The `authStore` handles authentication state and errors.

---

## 6. API Calls

### On Mount

| Trigger          | Endpoint          | Method | Purpose                                      |
|------------------|-------------------|--------|----------------------------------------------|
| Page load        | `/api/auth/me`    | GET    | Check if already logged in; redirect to `/` if so |

### On User Interaction

| Trigger              | Endpoint          | Method | Purpose                          |
|----------------------|-------------------|--------|----------------------------------|
| Submit form          | `/api/auth/login` | POST   | Authenticate user                |

**Request payload:**
```json
{
  "username": "jiyeon_dev",
  "password": "securepassword123"
}
```

**Success:** Store user in `authStore`, redirect to `/` (global feed).

**Failure:** Set `authStore.error` to error message from response.

---

## 7. User Interactions

| Element                  | Action            | Result                                                   |
|--------------------------|-------------------|----------------------------------------------------------|
| Username input           | Type              | Updates local `username` state; cursor blinks at end     |
| Username input           | Focus             | Border changes to `border-green-400`                     |
| Password input           | Type              | Updates local `password` state; renders as `████` blocks |
| Password input           | Focus             | Border changes to `border-green-400`                     |
| Submit button            | Click             | Validates inputs, calls POST `/api/auth/login`           |
| Keyboard: `Enter`        | Press (any input) | Submits the form (same as clicking submit)               |
| Keyboard: `Cmd+Enter`    | Press             | Submits the form                                         |
| Keyboard: `Tab`          | Press             | Moves focus: username -> password -> submit button       |
| "$ register" link        | Click             | Navigate to `/register`                                  |
| Error message            | Displayed         | Automatically clears after 5 seconds or on next input    |

### Validation Rules (Client-side)

| Field    | Rule                          | Error Message                     |
|----------|-------------------------------|-----------------------------------|
| Username | Required, non-empty           | `error: --user is required`       |
| Password | Required, non-empty           | `error: --password is required`   |

---

## 8. Loading State

### Submit Loading (while POST /auth/login is in-flight)

```
┌─ Login ────────────────────────────────────────────┐
│                                                     │
│  // authenticate                                    │
│                                                     │
│  $ login --user=jiyeon_dev                          │
│                                                     │
│  --password=████████                                │
│                                                     │
│                                                     │
│  ┌──────────────────────────────┐                   │
│  │ authenticating...            │  ← disabled       │
│  └──────────────────────────────┘                   │
│                                                     │
│  No account? $ register                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Implementation:**
- Submit button text changes from `[Enter] submit` to `authenticating...`
- Button gets `opacity-40 cursor-not-allowed` styling
- All inputs become `disabled`
- No skeleton needed -- the form is always rendered immediately (no data to fetch)

### Initial Session Check

While checking `/api/auth/me` on mount:
- Show the login form normally (no skeleton)
- If session exists, redirect happens before user interacts
- Brief flash is acceptable; no full-page loader needed

---

## 9. Empty State

Not applicable for the login page. The form is always displayed. There is no data-dependent empty state.

---

## 10. Error State

### Invalid Credentials (401)

```
┌─ Login ────────────────────────────────────────────┐
│                                                     │
│  // authenticate                                    │
│                                                     │
│  $ login --user=jiyeon_dev                          │
│                                                     │
│  --password=████████                                │
│                                                     │
│  error: invalid credentials (401)                   │
│                                                     │
│  ┌──────────────────────────────┐                   │
│  │ [Enter] submit               │                   │
│  └──────────────────────────────┘                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Rate Limited (429)

```
  error: too many attempts. try again in 60s (429)
```

### Network Error / Server Down (500)

```
  error: connection failed. please try again (500)
```

### Client-side Validation Error

```
  error: --user is required
```

```
  error: --password is required
```

**Styling for all errors:**
- Error text: `text-red-400 font-mono text-sm`
- Appears directly below the password input, above the submit button
- No border or background on the error line (bare terminal output style)
- Error clears when user starts typing again or after 5 seconds

---

## See Also

- [DESIGN_GUIDE.md](../guides/DESIGN_GUIDE.md) — Visual tokens, component specs, UI states
- [API.md](../specs/API.md) — Endpoint request/response details
- [CONVENTIONS.md](../guides/CONVENTIONS.md) — Coding rules for implementation
- [REGISTER.md](./REGISTER.md) — Related screen specification
