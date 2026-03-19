# REGISTER Screen Specification

---

## 1. Screen Overview

| Property        | Value                                                        |
|-----------------|--------------------------------------------------------------|
| **Route**       | `/register`                                                  |
| **Title**       | `register -- terminal.social`                                |
| **Description** | Terminal-style registration page. Mimics running a CLI command to create an account. No sidebar -- full-width centered layout. Redirects to `/` if already authenticated. |
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
│         ┌─ Register ─────────────────────────────────────────┐           │
│         │                                                     │           │
│         │  // create account                                  │           │
│         │                                                     │           │
│         │  $ register --user=█                                │           │
│         │                                                     │           │
│         │  --password=████████                                │           │
│         │                                                     │           │
│         │  --name="Display Name"              (optional)      │           │
│         │                                                     │           │
│         │                                                     │           │
│         │  ┌──────────────────────────────┐                   │           │
│         │  │ [Enter] create account       │                   │           │
│         │  └──────────────────────────────┘                   │           │
│         │                                                     │           │
│         │  Already have an account? $ login                   │           │
│         │                                                     │           │
│         └─────────────────────────────────────────────────────┘           │
│                                                                          │
│                                                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Desktop with Validation Errors

```
┌──────────────────────────────────────────────────────────────────────────┐
│ terminal.social                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                                                                          │
│         ┌─ Register ─────────────────────────────────────────┐           │
│         │                                                     │           │
│         │  // create account                                  │           │
│         │                                                     │           │
│         │  $ register --user=jy                               │           │
│         │  error: username already taken (409)                 │           │
│         │                                                     │           │
│         │  --password=██                                      │           │
│         │  error: password too short, min 8 chars (400)       │           │
│         │                                                     │           │
│         │  --name="Jiyeon"                    (optional)      │           │
│         │                                                     │           │
│         │  ┌──────────────────────────────┐                   │           │
│         │  │ [Enter] create account       │                   │           │
│         │  └──────────────────────────────┘                   │           │
│         │                                                     │           │
│         │  Already have an account? $ login                   │           │
│         │                                                     │           │
│         └─────────────────────────────────────────────────────┘           │
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
│  ┌─ Register ────────────────┐  │
│  │                            │  │
│  │  // create account         │  │
│  │                            │  │
│  │  $ register                │  │
│  │  --user=█                  │  │
│  │                            │  │
│  │  --password=████████       │  │
│  │                            │  │
│  │  --name="Name"             │  │
│  │  (optional)                │  │
│  │                            │  │
│  │  ┌──────────────────────┐  │  │
│  │  │ [Enter] create       │  │  │
│  │  └──────────────────────┘  │  │
│  │                            │  │
│  │  Have an account?          │  │
│  │  $ login                   │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                 │
│                                 │
└─────────────────────────────────┘
```

---

## 4. Component Tree

```
<RegisterPage>                         // packages/client/src/pages/RegisterPage.tsx
  <AuthLayout>                         // packages/client/src/components/layout/AuthLayout.tsx
    <HeaderBar />                      // packages/client/src/components/layout/HeaderBar.tsx
      └── (logo only, no sidebar, no breadcrumbs)
    <main>                             // centered vertically and horizontally
      <RegisterForm>                   // packages/client/src/components/auth/RegisterForm.tsx
        <SectionLabel />              // "// create account"
        <CliInput                      // packages/client/src/components/auth/CliInput.tsx
          prefix="$ register --user="
          type="text"
        />
        <FieldError />                // packages/client/src/components/auth/FieldError.tsx
        <CliInput
          prefix="--password="
          type="password"
        />
        <FieldError />
        <CliInput
          prefix='--name="'
          suffix='"'
          type="text"
          optional={true}
        />
        <OptionalLabel />            // "(optional)" in text-gray-500
        <SubmitButton                  // packages/client/src/components/auth/SubmitButton.tsx
          label="[Enter] create account"
        />
        <AuthLink                      // packages/client/src/components/auth/AuthLink.tsx
          text="Already have an account?"
          command="$ login"
          to="/login"
        />
      </RegisterForm>
    </main>
  </AuthLayout>
</RegisterPage>
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

  register: (data: {
    username: string;
    password: string;
    displayName?: string;
  }) => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}
```

### Local Component State (React useState)

```typescript
// RegisterForm local state
{
  username: string;        // bound to --user= input
  password: string;        // bound to --password= input
  displayName: string;     // bound to --name= input (optional, defaults to "")
  isSubmitting: boolean;   // disables form during API call
  fieldErrors: {
    username: string | null;
    password: string | null;
  };
}
```

No new Zustand store is needed. The `authStore` handles registration and session state.

---

## 6. API Calls

### On Mount

| Trigger          | Endpoint          | Method | Purpose                                      |
|------------------|-------------------|--------|----------------------------------------------|
| Page load        | `/api/auth/me`    | GET    | Check if already logged in; redirect to `/` if so |

### On User Interaction

| Trigger              | Endpoint              | Method | Purpose                          |
|----------------------|-----------------------|--------|----------------------------------|
| Submit form          | `/api/auth/register`  | POST   | Create new user account          |

**Request payload:**
```json
{
  "username": "jiyeon_dev",
  "password": "securepassword123",
  "displayName": "Jiyeon"
}
```

**Success (201):** Auto-login (session is created by the server), store user in `authStore`, redirect to `/` (global feed).

**Failure (400):** Display validation error below the relevant field.

**Failure (409):** Display "username already taken" below the username field.

---

## 7. User Interactions

| Element                    | Action            | Result                                                        |
|----------------------------|-------------------|---------------------------------------------------------------|
| Username input             | Type              | Updates local `username` state; clears username field error   |
| Username input             | Focus             | Border changes to `border-green-400`                          |
| Username input             | Blur              | Client-side validation: min 3 chars, alphanumeric + underscore |
| Password input             | Type              | Updates local `password` state; renders as `████`; clears error|
| Password input             | Focus             | Border changes to `border-green-400`                          |
| Password input             | Blur              | Client-side validation: min 8 chars                           |
| Display name input         | Type              | Updates local `displayName` state                             |
| Display name input         | Focus             | Border changes to `border-green-400`                          |
| Submit button              | Click             | Validates all inputs, calls POST `/api/auth/register`         |
| Keyboard: `Enter`          | Press (any input) | Submits the form                                              |
| Keyboard: `Tab`            | Press             | Moves focus: username -> password -> displayName -> submit    |
| "$ login" link             | Click             | Navigate to `/login`                                          |
| Field error                | Displayed         | Clears when user starts typing in that field                  |

### Validation Rules (Client-side)

| Field        | Rule                                      | Error Message                                     |
|--------------|-------------------------------------------|---------------------------------------------------|
| Username     | Required, min 3 chars                     | `error: --user must be at least 3 characters`     |
| Username     | Alphanumeric + underscore only            | `error: --user allows only [a-z0-9_]`             |
| Password     | Required, min 8 chars                     | `error: --password must be at least 8 characters` |
| Display Name | Optional, max 50 chars                    | `error: --name must be at most 50 characters`     |

### Validation Rules (Server-side, displayed on API response)

| HTTP Code | Condition               | Error Message                                     |
|-----------|-------------------------|---------------------------------------------------|
| 400       | Username too short       | `error: username too short (400)`                 |
| 400       | Password too weak        | `error: password too short, min 8 chars (400)`    |
| 409       | Username already taken   | `error: username already taken (409)`             |

---

## 8. Loading State

### Submit Loading (while POST /auth/register is in-flight)

```
┌─ Register ─────────────────────────────────────────┐
│                                                     │
│  // create account                                  │
│                                                     │
│  $ register --user=jiyeon_dev                       │
│                                                     │
│  --password=████████                                │
│                                                     │
│  --name="Jiyeon"                    (optional)      │
│                                                     │
│  ┌──────────────────────────────┐                   │
│  │ creating account...          │  ← disabled       │
│  └──────────────────────────────┘                   │
│                                                     │
│  Already have an account? $ login                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Implementation:**
- Submit button text changes from `[Enter] create account` to `creating account...`
- Button gets `opacity-40 cursor-not-allowed` styling
- All inputs become `disabled`
- No skeleton needed -- the form renders immediately

### Initial Session Check

- While checking `/api/auth/me`, form renders normally
- If session exists, redirect happens before user interacts

---

## 9. Empty State

Not applicable for the registration page. The form is always displayed. There is no data-dependent empty state.

---

## 10. Error State

### Username Already Taken (409)

```
  $ register --user=jiyeon_dev
  error: username already taken (409)
```

Error appears directly below the username input field.

### Password Too Short (400)

```
  --password=██
  error: password too short, min 8 chars (400)
```

Error appears directly below the password input field.

### Generic Validation Error (400)

```
  error: invalid input (400)
```

Appears below the last input field, above the submit button.

### Rate Limited (429)

```
  error: too many attempts. try again in 60s (429)
```

Appears below all inputs, above the submit button.

### Network Error / Server Down (500)

```
  error: connection failed. please try again (500)
```

Appears below all inputs, above the submit button.

**Styling for all errors:**
- Error text: `text-red-400 font-mono text-sm`
- Field-specific errors appear directly below the related input with `mt-1`
- General errors appear below all inputs with `mt-4`
- No border or background on error lines (bare terminal output style)
- Field errors clear when the user types in the corresponding field
- General errors clear after 5 seconds or on next submission attempt
