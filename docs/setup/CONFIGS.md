# CONFIGS.md -- Project Configuration Reference

> **Owner:** Forkverse Core Team
> **Status:** Source of Truth
> **Purpose:** Complete, copy-paste-ready configuration for every file needed to bootstrap the Forkverse monorepo. AI agents and new contributors start here.

---

## Table of Contents

1. [Root package.json](#1-root-packagejson)
2. [pnpm-workspace.yaml](#2-pnpm-workspaceyaml)
3. [tsconfig.base.json](#3-tsconfigbasejson)
4. [Per-Package package.json Files](#4-per-package-packagejson-files)
5. [packages/client/vite.config.ts](#5-packagesclientviteconfigts)
6. [packages/client/tailwind.config.ts](#6-packagesclienttailwindconfigts)
7. [.eslintrc.cjs](#7-eslintrccjs)
8. [.prettierrc](#8-prettierrc)
9. [.gitignore](#9-gitignore)

---

## 1. Root package.json

Path: `/package.json`

```json
{
  "name": "forkverse",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel -r run dev",
    "dev:client": "pnpm --filter @forkverse/client dev",
    "dev:server": "pnpm --filter @forkverse/server dev",
    "build": "pnpm -r run build",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint packages/",
    "format": "prettier --write packages/"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.0.0",
    "@playwright/test": "^1.50.0",
    "eslint": "^9.0.0",
    "prettier": "^3.4.0"
  }
}
```

---

## 2. pnpm-workspace.yaml

Path: `/pnpm-workspace.yaml`

```yaml
packages:
  - "packages/*"
```

---

## 3. tsconfig.base.json

Path: `/tsconfig.base.json`

All strict options enabled explicitly so that downstream packages inherit them without ambiguity.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": false,

    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true
  },
  "exclude": ["node_modules", "dist"]
}
```

---

## 4. Per-Package package.json Files

### 4a. packages/client/package.json

```json
{
  "name": "@forkverse/client",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0",
    "@forkverse/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "typescript": "^5.7.0"
  }
}
```

### 4b. packages/server/package.json

```json
{
  "name": "@forkverse/server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -b",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^5.0.0",
    "better-sqlite3": "^11.0.0",
    "pino": "^9.0.0",
    "pino-pretty": "^13.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "@forkverse/shared": "workspace:*",
    "@forkverse/llm": "workspace:*"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/better-sqlite3": "^7.6.0",
    "@types/cors": "^2.8.17",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

### 4c. packages/shared/package.json

```json
{
  "name": "@forkverse/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -b"
  },
  "dependencies": {
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

### 4d. packages/llm/package.json

```json
{
  "name": "@forkverse/llm",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc -b"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "openai": "^4.80.0",
    "@forkverse/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

---

## 5. packages/client/vite.config.ts

Path: `packages/client/vite.config.ts`

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
```

---

## 6. packages/client/tailwind.config.ts

Path: `packages/client/tailwind.config.ts`

Terminal-inspired dark theme with JetBrains Mono as the primary font.

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    fontFamily: {
      mono: [
        '"JetBrains Mono"',
        '"Fira Code"',
        '"Cascadia Code"',
        "Menlo",
        "Consolas",
        "monospace",
      ],
      sans: [
        '"Inter"',
        '"Segoe UI"',
        "Roboto",
        "Helvetica",
        "Arial",
        "sans-serif",
      ],
    },
    extend: {
      colors: {
        terminal: {
          bg: "#0d1117",
          surface: "#161b22",
          border: "#30363d",
          text: "#e6edf3",
          muted: "#7d8590",
          green: "#3fb950",
          red: "#f85149",
          yellow: "#d29922",
          blue: "#58a6ff",
          purple: "#bc8cff",
          cyan: "#76e3ea",
          orange: "#f0883e",
          pink: "#f778ba",
          prompt: "#3fb950",
          cursor: "#58a6ff",
          selection: "#264f78",
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        "fade-in": "fadeIn 0.15s ease-in",
        "slide-up": "slideUp 0.2s ease-out",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 7. .eslintrc.cjs

Path: `/.eslintrc.cjs`

```javascript
// @ts-check

/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./packages/*/tsconfig.json"],
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
  ],
  rules: {
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-floating-promises": "error",
  },
  ignorePatterns: ["dist/", "node_modules/", "*.config.*"],
};
```

---

## 8. .prettierrc

Path: `/.prettierrc`

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

## 9. .gitignore

Path: `/.gitignore`

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# Environment variables
.env
.env.local
.env.*.local

# Database
forkverse.db
forkverse.db-journal
forkverse.db-wal
*.sqlite
*.sqlite3

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Test & coverage
coverage/
test-results/
playwright-report/

# Logs
*.log
logs/

# Misc
*.tsbuildinfo
```

---

## See Also

- [docs/specs/PRD.md](../specs/PRD.md) -- Product requirements and project overview
- [docs/specs/PRD.md](../specs/PRD.md) -- Product requirements
- [docs/specs/API.md](../specs/API.md) -- API specification
- [docs/specs/DATABASE.md](../specs/DATABASE.md) -- Database schema
- [docs/llm/LLM_INTEGRATION.md](../llm/LLM_INTEGRATION.md) -- LLM transformation logic
