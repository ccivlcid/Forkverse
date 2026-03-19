# SETTINGS Screen Specification

> **Source of truth** for the Settings screen (`/settings`).

---

## 1. Screen Overview

| Property        | Value                                                        |
|-----------------|--------------------------------------------------------------|
| **Route**       | `/settings`                                                  |
| **Title**       | `settings -- terminal.social`                                |
| **Description** | Terminal-style settings page where users edit their profile via CLI-like commands. Each field mimics a `$ set --flag="value"` pattern. Includes a danger zone for account deletion with a confirmation dialog. Standard layout with sidebar. |
| **Auth Required** | Yes. Redirects to `/login` if not authenticated.            |

---

## 2. Desktop Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│ terminal.social / settings                                               │
├────────────┬─────────────────────────────────────────────────────────────┤
│            │                                                             │
│ // navigate│  ┌─ Profile Settings ───────────────────────────────────┐   │
│ $ feed     │  │                                                       │   │
│   --global │  │  // profile                                           │   │
│   --local  │  │                                                       │   │
│   following│  │  $ set --display-name="Current Name"                  │   │
│   explore  │  │                                                       │   │
│            │  │  $ set --domain="yourdomain.dev"                      │   │
│ // by LLM  │  │                                                       │   │
│ ● claude   │  │  $ set --bio="Your bio text here"                     │   │
│ ○ gpt-4o   │  │                                                       │   │
│ ○ llama-3  │  │  $ set --avatar-url="https://..."                     │   │
│            │  │                                                       │   │
│ // me      │  │                                                       │   │
│ → @you     │  │  ┌──────────────────────────────┐                     │   │
│   my posts │  │  │ [Apply changes]              │                     │   │
│   starred  │  │  └──────────────────────────────┘                     │   │
│ → settings │  │                                                       │   │
│            │  └───────────────────────────────────────────────────────┘   │
│            │                                                             │
│            │  ┌─ Danger Zone ────────────────────────────────────────┐   │
│            │  │                                                       │   │
│            │  │  // danger                                            │   │
│            │  │                                                       │   │
│            │  │  $ delete --account                                   │   │
│            │  │                                                       │   │
│            │  │  This action is irreversible. All posts, stars,       │   │
│            │  │  and followers will be permanently deleted.            │   │
│            │  │                                                       │   │
│            │  │  ┌────────────────────────────────┐                   │   │
│            │  │  │ $ delete --confirm             │                   │   │
│            │  │  └────────────────────────────────┘                   │   │
│            │  │                                                       │   │
│            │  └───────────────────────────────────────────────────────┘   │
│            │                                                             │
└────────────┴─────────────────────────────────────────────────────────────┘
```

### Desktop with Success Toast

```
┌──────────────────────────────────────────────────────────────────────────┐
│ terminal.social / settings                            Settings updated ✓ │
├────────────┬─────────────────────────────────────────────────────────────┤
│  ...       │  ...                                                        │
```

The success toast appears top-right as a brief inline message: `text-emerald-400 font-mono text-sm`.

### Desktop Confirmation Dialog (Delete Account)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ terminal.social / settings                                               │
├────────────┬─────────────────────────────────────────────────────────────┤
│            │                                                             │
│            │      ┌─ Confirm Deletion ───────────────────────┐          │
│            │      │                                           │          │
│            │      │  $ delete --account --confirm             │          │
│            │      │                                           │          │
│            │      │  Type your username to confirm:           │          │
│            │      │                                           │          │
│            │      │  > █                                      │          │
│            │      │                                           │          │
│            │      │  ┌────────────────┐  ┌────────────────┐  │          │
│            │      │  │ $ abort        │  │ $ confirm      │  │          │
│            │      │  └────────────────┘  └────────────────┘  │          │
│            │      │                                           │          │
│            │      └───────────────────────────────────────────┘          │
│            │                                                             │
└────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 3. Mobile Wireframe

```
┌─────────────────────────────────┐
│ ≡  terminal.social              │
├─────────────────────────────────┤
│                                 │
│  ┌─ Profile Settings ───────┐  │
│  │                            │  │
│  │  // profile                │  │
│  │                            │  │
│  │  $ set                     │  │
│  │  --display-name=           │  │
│  │  "Current Name"            │  │
│  │                            │  │
│  │  $ set                     │  │
│  │  --domain=                 │  │
│  │  "yourdomain.dev"          │  │
│  │                            │  │
│  │  $ set                     │  │
│  │  --bio=                    │  │
│  │  "Your bio text"           │  │
│  │                            │  │
│  │  $ set                     │  │
│  │  --avatar-url=             │  │
│  │  "https://..."             │  │
│  │                            │  │
│  │  ┌──────────────────────┐  │  │
│  │  │ [Apply changes]      │  │  │
│  │  └──────────────────────┘  │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                 │
│  ┌─ Danger Zone ─────────────┐  │
│  │                            │  │
│  │  // danger                 │  │
│  │                            │  │
│  │  $ delete --account        │  │
│  │                            │  │
│  │  This action is            │  │
│  │  irreversible.             │  │
│  │                            │  │
│  │  ┌──────────────────────┐  │  │
│  │  │ $ delete --confirm   │  │  │
│  │  └──────────────────────┘  │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### Mobile Confirmation Dialog

```
┌─────────────────────────────────┐
│ ≡  terminal.social              │
├─────────────────────────────────┤
│                                 │
│  ┌─ Confirm Deletion ────────┐  │
│  │                            │  │
│  │  $ delete --account        │  │
│  │    --confirm               │  │
│  │                            │  │
│  │  Type your username        │  │
│  │  to confirm:               │  │
│  │                            │  │
│  │  > █                       │  │
│  │                            │  │
│  │  ┌──────────┐             │  │
│  │  │ $ abort   │             │  │
│  │  └──────────┘             │  │
│  │  ┌──────────┐             │  │
│  │  │ $ confirm │             │  │
│  │  └──────────┘             │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

---

## 4. Component Tree

```
<SettingsPage>                         // packages/client/src/pages/SettingsPage.tsx
  <PageLayout>                         // packages/client/src/components/layout/PageLayout.tsx
    <HeaderBar />                      // packages/client/src/components/layout/HeaderBar.tsx
    <Sidebar />                        // packages/client/src/components/layout/Sidebar.tsx
    <main>
      <SettingsForm>                   // packages/client/src/components/settings/SettingsForm.tsx
        <SectionLabel />              // "// profile"
        <CliSettingField               // packages/client/src/components/settings/CliSettingField.tsx
          command="$ set"
          flag="--display-name"
          value={displayName}
        />
        <CliSettingField
          command="$ set"
          flag="--domain"
          value={domain}
        />
        <CliSettingField
          command="$ set"
          flag="--bio"
          value={bio}
        />
        <CliSettingField
          command="$ set"
          flag="--avatar-url"
          value={avatarUrl}
        />
        <SubmitButton                  // packages/client/src/components/auth/SubmitButton.tsx
          label="[Apply changes]"
        />
      </SettingsForm>

      <DangerZone>                     // packages/client/src/components/settings/DangerZone.tsx
        <SectionLabel />              // "// danger"
        <DeleteAccountButton />       // packages/client/src/components/settings/DeleteAccountButton.tsx
      </DangerZone>

      <ConfirmDeleteDialog />         // packages/client/src/components/settings/ConfirmDeleteDialog.tsx
        <CliInput />                  // username confirmation input
        <AbortButton />
        <ConfirmButton />

      <SuccessToast />                // packages/client/src/components/common/SuccessToast.tsx
    </main>
  </PageLayout>
</SettingsPage>
```

---

## 5. State Requirements

### Zustand Stores

**`authStore`** (existing)
```typescript
{
  user: User | null;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;  // optimistic update after settings save
}
```

**`settingsStore`** (new)
```typescript
{
  // Form state (initialized from authStore.user on mount)
  displayName: string;
  domain: string;
  bio: string;
  avatarUrl: string;

  // UI state
  isDirty: boolean;              // true if any field differs from original
  isSaving: boolean;
  isDeleting: boolean;
  showDeleteDialog: boolean;
  deleteConfirmUsername: string;  // typed confirmation value
  error: string | null;
  successMessage: string | null;

  // Actions
  initFromUser: (user: User) => void;
  setField: (field: string, value: string) => void;
  saveSettings: () => Promise<void>;
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;
  setDeleteConfirmUsername: (value: string) => void;
  deleteAccount: () => Promise<void>;
  clearMessages: () => void;
}
```

### Data Shape: `User`
```typescript
interface User {
  id: string;
  username: string;
  domain: string | null;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}
```

---

## 6. API Calls

### On Mount

| Trigger          | Endpoint          | Method | Purpose                                      |
|------------------|-------------------|--------|----------------------------------------------|
| Page load        | `/api/auth/me`    | GET    | Fetch current user data to populate form fields |

### On User Interaction

| Trigger                    | Endpoint              | Method  | Purpose                          |
|----------------------------|-----------------------|---------|----------------------------------|
| Click "Apply changes"      | `/api/auth/me`        | PUT     | Update user profile settings     |
| Click "$ confirm" (delete) | `/api/auth/me`        | DELETE  | Delete user account permanently  |

**Update request payload (PUT /api/auth/me):**
```json
{
  "displayName": "New Name",
  "domain": "newdomain.dev",
  "bio": "Updated bio text",
  "avatarUrl": "https://example.com/avatar.png"
}
```

**Success (200):** Update `authStore.user`, show success toast "Settings updated", set `isDirty` to false.

**Delete request (DELETE /api/auth/me):**
No body required. Server validates session.

**Success (200):** Clear `authStore.user`, redirect to `/login`.

> Note: The PUT and DELETE endpoints on `/api/auth/me` are implied by the architecture but not yet defined in API.md. They should be added to the API spec.

---

## 7. User Interactions

| Element                        | Action            | Result                                                          |
|--------------------------------|-------------------|-----------------------------------------------------------------|
| Display name field             | Type              | Updates `settingsStore.displayName`; sets `isDirty=true`        |
| Display name field             | Focus             | Border changes to `border-green-400`                            |
| Domain field                   | Type              | Updates `settingsStore.domain`; sets `isDirty=true`             |
| Domain field                   | Focus             | Border changes to `border-green-400`                            |
| Bio field                      | Type              | Updates `settingsStore.bio`; sets `isDirty=true`                |
| Bio field                      | Focus             | Border changes to `border-green-400`                            |
| Avatar URL field               | Type              | Updates `settingsStore.avatarUrl`; sets `isDirty=true`          |
| Avatar URL field               | Focus             | Border changes to `border-green-400`                            |
| "Apply changes" button         | Click             | Validates, calls PUT `/api/auth/me`; shows toast on success    |
| "Apply changes" button         | Click (not dirty) | Button is `opacity-40 cursor-not-allowed`; no API call         |
| Keyboard: `Cmd+Enter`          | Press             | Submits settings form (same as Apply changes)                   |
| "$ delete --confirm" button    | Click             | Opens confirmation dialog                                       |
| Confirmation input             | Type              | Updates `deleteConfirmUsername`                                  |
| "$ abort" button               | Click             | Closes confirmation dialog; clears confirmation input           |
| "$ confirm" button             | Click             | Validates username match; calls DELETE `/api/auth/me`           |
| "$ confirm" button             | Click (no match)  | Shows error: "error: username does not match"                   |
| Keyboard: `Escape`             | Press (in dialog) | Closes confirmation dialog                                      |
| Success toast                  | Auto              | Appears top-right; auto-dismisses after 3 seconds              |
| Navigate away (dirty form)     | Route change      | No blocking -- changes are silently discarded                   |

### Validation Rules (Client-side)

| Field        | Rule                          | Error Message                              |
|--------------|-------------------------------|--------------------------------------------|
| Display Name | Max 50 chars                  | `error: --display-name max 50 characters`  |
| Domain       | Valid domain format or empty  | `error: --domain invalid format`           |
| Bio          | Max 300 chars                 | `error: --bio max 300 characters`          |
| Avatar URL   | Valid URL format or empty     | `error: --avatar-url invalid URL`          |

---

## 8. Loading State

### Initial Load (fetching current user data)

```
┌─ Profile Settings ───────────────────────────────────────────────────┐
│                                                                       │
│  // profile                                                           │
│                                                                       │
│  $ set --display-name="████████████"                                  │
│                                                                       │
│  $ set --domain="████████████"                                        │
│                                                                       │
│  $ set --bio="████████████████████████████"                            │
│                                                                       │
│  $ set --avatar-url="████████████████████████"                        │
│                                                                       │
│  ┌──────────────────────────────┐                                     │
│  │ [Apply changes]              │  ← disabled                         │
│  └──────────────────────────────┘                                     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Command prefixes (`$ set --flag=`) render immediately in `text-green-400` and `text-sky-400`
- Value portions show `bg-gray-700/50 animate-pulse` blocks where editable text will appear
- "Apply changes" button is disabled until data loads
- Danger zone renders normally (no data dependency)

### Save Loading (while PUT is in-flight)

```
│  ┌──────────────────────────────┐                                     │
│  │ applying...                  │  ← disabled, opacity-40             │
│  └──────────────────────────────┘                                     │
```

- Button text changes to `applying...`
- All fields become `disabled`
- Button gets `opacity-40 cursor-not-allowed`

### Delete Loading (while DELETE is in-flight)

```
│  ┌────────────────┐  ┌────────────────┐  │
│  │ $ abort        │  │ deleting...    │  │  ← confirm disabled
│  └────────────────┘  └────────────────┘  │
```

- Confirm button text changes to `deleting...`
- Both buttons get `opacity-40 cursor-not-allowed`
- Confirmation input becomes `disabled`

---

## 9. Empty State

### Fields with No Current Value

When a user has not set a value for a field, the input shows a placeholder:

```
  $ set --domain=""                      ← empty string, placeholder: "yourdomain.dev"
  $ set --bio=""                         ← empty string, placeholder: "Tell us about yourself"
  $ set --avatar-url=""                  ← empty string, placeholder: "https://..."
```

**Styling:**
- Empty value: shows `""` in `text-gray-500` (muted)
- Placeholder text inside the input: `text-gray-600 italic`
- The field is always editable regardless of empty/filled state

There is no data-list empty state -- this page always shows the form.

---

## 10. Error State

### Save Failed (400 - Validation Error)

```
┌─ Profile Settings ───────────────────────────────────────────────────┐
│                                                                       │
│  // profile                                                           │
│                                                                       │
│  $ set --display-name="A"                                             │
│  error: display name too short (400)                                  │
│                                                                       │
│  ...                                                                  │
│                                                                       │
│  ┌──────────────────────────────┐                                     │
│  │ [Apply changes]              │                                     │
│  └──────────────────────────────┘                                     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### Save Failed (401 - Session Expired)

```
  error: session expired. please log in again (401)
```

After 2 seconds, redirect to `/login`.

### Save Failed (500 - Server Error)

```
  error: failed to save settings. please try again (500)
```

Appears below the form, above the submit button.

### Delete Failed (username mismatch - client-side)

```
  error: username does not match
```

Appears inside the confirmation dialog below the input.

### Delete Failed (500 - Server Error)

```
  error: failed to delete account. please try again (500)
```

Appears inside the confirmation dialog.

### Network Error

```
  error: connection failed. please try again
```

**Styling for all errors:**
- Error text: `text-red-400 font-mono text-sm`
- Field-specific errors appear directly below the related field with `mt-1`
- General errors appear below the form with `mt-4`
- Errors clear when the user modifies the related field or after 5 seconds
- Danger zone errors appear inside the confirmation dialog

---

## See Also

- [DESIGN_GUIDE.md](../guides/DESIGN_GUIDE.md) — Visual tokens, component specs, UI states
- [API.md](../specs/API.md) — Endpoint request/response details
- [CONVENTIONS.md](../guides/CONVENTIONS.md) — Coding rules for implementation
- [USER_PROFILE.md](./USER_PROFILE.md) — Related screen specification
