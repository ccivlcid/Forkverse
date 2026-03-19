# PROMPTS.md — Vibe Coding Prompt Guide

> **Source of truth** for vibe coding prompt templates and AI interaction patterns.

A collection of prompt templates for instructing AI during development.

## Usage

Copy each prompt and pass it to the AI. Replace `{variables}` as needed.
All prompts reference `docs/guides/CONVENTIONS.md` and `docs/architecture/ARCHITECTURE.md` as context.

---

## 1. Create Component

```
Create a {ComponentName} component under packages/client/src/components/{folder}/.

Requirements:
- {Feature description}
- Props: {list required props}
- Style with Tailwind CSS (dark theme, terminal aesthetic)
- Follow docs/guides/CONVENTIONS.md rules
- Reference docs/guides/DESIGN_GUIDE.md for colors and spacing
```

### Worked Example

**Prompt:**
```
Create a DualPanel component under packages/client/src/components/post/.

Requirements:
- Display natural language text on the left, CLI output on the right, side by side
- Props: messageRaw (string), messageCli (string), lang (string)
- Stack vertically on mobile (< 640px)
- CLI panel: bg-[#0d1117], text-green-400, font-mono
- Natural panel: bg-[#16213e], text-gray-200, font-sans
- Add "CLI — open source" label and copy button on CLI panel header
```

**Expected AI output structure:**
```typescript
// packages/client/src/components/post/dual-panel.tsx

interface DualPanelProps {
  messageRaw: string;
  messageCli: string;
  lang: string;
}

export function DualPanel({ messageRaw, messageCli, lang }: DualPanelProps): JSX.Element {
  function handleCopy(): void { ... }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2">
      <div className="bg-[#16213e] p-4 text-gray-200 font-sans text-sm">
        {messageRaw}
      </div>
      <div className="bg-[#0d1117] p-4 text-green-400 font-mono text-[13px]">
        <div className="flex justify-between text-gray-500 text-xs mb-2">
          <span>CLI — open source</span>
          <button onClick={handleCopy} className="hover:text-gray-300">⎘ copy</button>
        </div>
        <pre>{messageCli}</pre>
      </div>
    </div>
  );
}
```

---

## 2. Implement Screen from Spec

```
Implement the {screen name} screen.

Refer to: docs/screens/{SCREEN_NAME}.md for the full specification.
Follow: docs/guides/CONVENTIONS.md for coding rules.
Use: docs/guides/DESIGN_GUIDE.md for visual tokens.

Create:
1. Page component at packages/client/src/pages/{page-name}.tsx
2. Any new sub-components needed
3. Wire up Zustand stores and API calls as specified in the screen doc
```

### Worked Example

**Prompt:**
```
Implement the Login screen.

Refer to: docs/screens/LOGIN.md for the full specification.
Follow: docs/guides/CONVENTIONS.md for coding rules.
Use: docs/guides/DESIGN_GUIDE.md for visual tokens.

Create:
1. Page component at packages/client/src/pages/login.tsx
2. Terminal-style login form component
3. Wire up authStore.login() and redirect to / on success
```

---

## 3. Add API Route

```
Add a {HTTP_METHOD} {path} route to packages/server/src/routes/{filename}.ts.

Requirements:
- {Feature description}
- Input: {request body/params}
- Output: ApiResponse<{Type}>
- DB query: {describe needed query}
- Validation: zod schema for input
- Refer to docs/specs/API.md for the full endpoint spec
```

---

## 4. DB Migration

```
Create a new migration file under packages/server/src/db/migrations/.

Filename: {number}_{description}.sql
Content: {describe table/column changes}
Follow docs/specs/DATABASE.md migration rules (sequential, append-only).
```

---

## 5. Zustand Store

```
Create a Zustand store at packages/client/src/stores/{store-name}.ts.

State:
- {list state fields with types}

Actions:
- {list action methods with descriptions}

API calls:
- {list which endpoints each action calls}
```

### Worked Example

**Prompt:**
```
Create a Zustand store at packages/client/src/stores/feed-store.ts.

State:
- posts: Post[] — current feed posts
- cursor: string | null — pagination cursor
- isLoading: boolean — loading state
- hasMore: boolean — more pages available

Actions:
- fetchGlobalFeed() — GET /api/posts/feed/global, append posts
- fetchLocalFeed() — GET /api/posts/feed/local, append posts
- fetchByLlm(model: LlmModel) — GET /api/posts/by-llm/:model
- reset() — clear posts and cursor

Follow the pattern: set isLoading true → fetch → append to posts → set cursor → set isLoading false.
```

---

## 6. LLM Provider

```
Add a new LLM provider at packages/llm/src/providers/{provider}.ts.

- Implement the LlmProvider interface
- Use {SDK/API}
- transform method: natural language → CLI conversion
- Handle API errors gracefully (throw with descriptive message)
```

---

## 7. Add Page

```
Create a new page at packages/client/src/pages/{page-name}.tsx.

Route: {path}
Feature: {page description}
Components used: {list required components}
Data: {required stores/API calls}
Screen spec: docs/screens/{SCREEN_NAME}.md
```

---

## 8. Full-Stack Feature

```
Implement the {feature name} feature full-stack.

User story: When a user {does X}, then {Y happens}.

Scope:
1. shared: Type definitions in packages/shared/src/types/
2. server: API route + DB query + zod validation
3. client: UI component + store action + page integration
4. test: At least 1 unit test per layer

Follow docs/guides/CONVENTIONS.md and docs/architecture/ARCHITECTURE.md rules.
API spec: docs/specs/API.md (find the relevant endpoint)
DB schema: docs/specs/DATABASE.md
```

### Worked Example

**Prompt:**
```
Implement the post star (toggle) feature full-stack.

User story: When a user clicks the ★ button on a post, it toggles between
starred (yellow, filled ★) and unstarred (gray, empty ☆). The star count updates immediately.

Scope:
1. shared: StarToggleResponse type in packages/shared/src/types/api.ts
2. server: POST /api/posts/:id/star in packages/server/src/routes/posts.ts
   - Check if already starred → delete : insert
   - Return { starred: boolean, starCount: number }
3. client:
   - ActionBar component handles click → calls postStore.toggleStar(postId)
   - postStore.toggleStar() → POST /api/posts/:id/star → update post in store
   - Optimistic update: toggle UI immediately, revert on error
4. test: star toggle route test, postStore.toggleStar test

API spec: docs/specs/API.md section "POST /posts/:id/star"
```

---

## 9. Bug Fix

```
{Symptom description}

Reproduction steps:
1. {step 1}
2. {step 2}
3. {step 3}

Expected behavior: {what should happen}
Actual behavior: {what happens instead}

Identify the root cause and fix it. Add a test to prevent regression.
```

---

## 10. Write Tests

```
Write tests for {target}.

Test tool: Vitest (unit) / Playwright (E2E)
Follow patterns in docs/guides/TESTING.md.

Cases to cover:
- {happy path}
- {edge case}
- {error case}

Use test factories from tests/factories.ts for mock data.
```

---

## 11. Refactor

```
Refactor {target file or component}.

Current issue: {what's wrong — too long, duplicated logic, unclear naming}
Goal: {what it should look like after}

Constraints:
- No functional changes (behavior stays the same)
- Keep all existing tests passing
- Follow docs/guides/CONVENTIONS.md
```

---

## 12. Code Review

```
Review the following code for issues:

{paste code or reference file path}

Check for:
- CONVENTIONS.md violations (any, console.log, default export, etc.)
- Security issues (SQL injection, XSS, missing validation)
- Performance issues (unnecessary re-renders, missing indexes)
- Missing error handling
- Missing types
```

---

## Tips for Effective Vibe Coding

### Do's

1. **Be specific** — "Add a star button to PostCard that toggles yellow on click" ✅
2. **Specify file paths** — AI doesn't waste time deciding where to put code
3. **Reference docs** — "Follow docs/screens/LOGIN.md" gives AI complete context
4. **Reference existing patterns** — "Build it like PostCard" hints at conventions
5. **One thing at a time** — One feature per prompt, iterate in small units
6. **Give concrete feedback** — "It works but the CLI panel font is too small"

### Don'ts

1. **Don't be vague** — "Make a nice UI" gives AI no direction ❌
2. **Don't skip file paths** — AI may create files in wrong locations ❌
3. **Don't batch features** — Multiple features = confusion ❌
4. **Don't ignore errors** — If AI output has issues, say exactly what's wrong ❌

### Iteration Pattern

```
Round 1: Give prompt → AI generates code
Round 2: "The star button works but isn't yellow when active. Use text-yellow-400 for active state."
Round 3: "Good. Now add a test for the toggle behavior."
Round 4: "Ship it." ✅
```

---

## See Also

- [CONVENTIONS.md](./CONVENTIONS.md) — Rules AI must follow when generating code
- [TESTING.md](./TESTING.md) — Testing patterns for test-writing prompts
- [DESIGN_GUIDE.md](./DESIGN_GUIDE.md) — Visual specs for UI component prompts
- [Screen specs](../screens/) — Page-by-page specifications for screen implementation prompts
