# PROMPTS.md — Vibe Coding Prompt Guide

A collection of prompt templates for instructing AI during development.

## Usage

Copy each prompt and pass it to the AI. Replace `{variables}` as needed.
All prompts reference CONVENTIONS.md and ARCHITECTURE.md as context.

---

## 1. Create Component

```
Create a {ComponentName} component under packages/client/src/components/{folder}/.

Requirements:
- {Feature description}
- Props: {list required props}
- Style with Tailwind CSS (dark theme, terminal aesthetic)
- Follow CONVENTIONS.md rules
```

### Example
```
Create a DualPanel component under packages/client/src/components/post/.

Requirements:
- Display natural language text on the left, CLI output on the right, side by side
- Props: messageRaw, messageCli, lang
- Stack vertically on mobile
- CLI panel uses green text, monospace font
```

---

## 2. Add API Route

```
Add a {HTTP_METHOD} {path} route to packages/server/src/routes/{filename}.ts.

Requirements:
- {Feature description}
- Input: {request body/params}
- Output: ApiResponse<{Type}>
- DB query: {describe needed query}
```

---

## 3. DB Migration

```
Create a new migration file under packages/server/src/db/migrations/.

Filename: {number}_{description}.sql
Content: {describe table/column changes}
```

---

## 4. Zustand Store

```
Create a Zustand store at packages/client/src/stores/{store-name}.ts.

State:
- {list state fields}

Actions:
- {list action methods}
```

---

## 5. LLM Provider

```
Add a new LLM provider at packages/llm/src/providers/{provider}.ts.

- Implement the LlmProvider interface
- Use {SDK/API}
- transform method: natural language → CLI conversion
```

---

## 6. Add Page

```
Create a new page at packages/client/src/pages/{page-name}.tsx.

Route: {path}
Feature: {page description}
Components used: {list required components}
Data: {required stores/API calls}
```

---

## 7. Full-Stack Feature

```
Implement the {feature name} feature full-stack.

User story: When a user {does X}, then {Y happens}.

Scope:
1. shared: Type definitions
2. server: API route + DB query
3. client: UI component + store + page integration

Follow CONVENTIONS.md and ARCHITECTURE.md rules.
```

### Example
```
Implement the post fork feature full-stack.

User story: When a user clicks the "fork" button on another user's post,
the post is cloned to their own timeline. The link to the original post is preserved.

Scope:
1. shared: Fork type, ForkPostRequest/Response
2. server: POST /api/posts/:id/fork + DB insert
3. client: ForkButton component + postStore.forkPost() + feed update
```

---

## 8. Bug Fix

```
{Symptom description}

Reproduction steps: {steps}
Expected behavior: {correct behavior}
Actual behavior: {current buggy behavior}

Identify the root cause and fix it.
```

---

## 9. Write Tests

```
Write tests for {target}.

Test tool: Vitest (unit) / Playwright (E2E)
Cases to cover:
- {case 1}
- {case 2}
- {edge case}
```

---

## Tips for Effective Vibe Coding

1. **Be specific** — "Make a nice UI" ❌ → "Add a star button to PostCard that toggles yellow on click" ✅
2. **Specify file paths** — So the AI doesn't waste time deciding where to put code
3. **Reference existing patterns** — Hints like "build it like PostCard"
4. **One thing at a time** — Don't stuff multiple features into one prompt
5. **Review and give concrete feedback** — "It works but the CLI panel font is too small"
