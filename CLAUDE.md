# CLAUDE.md

This file provides guidance to AI assistants working with the CLItoris repository.

## Project Overview

**CLItoris**는 터미널/CLI 인터페이스를 컨셉으로 한 소셜 네트워크 서비스(SNS)다.
사용자가 자연어로 글을 쓰면, LLM이 CLI 명령어 형태로 변환하여 듀얼 포맷(자연어 + CLI)으로 표시한다.
포스트, 팔로우, 포크, 스타 등 모든 소셜 인터랙션이 CLI 명령어로 표현된다.

**도메인**: `terminal.social`

## Tech Stack

| Area | Technology |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| State management | Zustand |
| Flow diagrams | `@xyflow/react` v12 |
| Backend | Node.js + Express + tsx (TypeScript direct execution) |
| DB | SQLite (`better-sqlite3`) + versioned migrations |
| Logging | pino |
| Testing | Vitest (frontend + server), Playwright (E2E) |
| Package manager | pnpm |
| LLM Integration | Anthropic SDK, OpenAI SDK, Ollama |

## Project Structure

```
src/
├── client/              # React frontend
│   ├── components/      # 재사용 UI 컴포넌트
│   ├── pages/           # 라우트 페이지
│   ├── stores/          # Zustand 스토어
│   ├── styles/          # Tailwind/CSS
│   ├── hooks/           # 커스텀 React hooks
│   └── utils/           # 클라이언트 유틸리티
├── server/              # Express backend
│   ├── routes/          # API 라우트
│   ├── db/              # DB 설정
│   │   └── migrations/  # 버전 마이그레이션
│   ├── middleware/       # Express 미들웨어
│   └── utils/           # 서버 유틸리티
└── shared/              # 프론트/백 공유 코드
    ├── types/           # TypeScript 타입 정의
    └── constants/       # 공유 상수
docs/                    # 프로젝트 문서 (PRD 등)
tests/
├── unit/                # Vitest 단위 테스트
└── e2e/                 # Playwright E2E 테스트
scripts/                 # 빌드/배포 스크립트
```

## Design Conventions

- **UI**: 다크 배경(`#1a1a2e`), 모노스페이스 폰트, 터미널 미학
- **Colors**: 그린(`#4ade80`) CLI 키워드, 앰버(`#fbbf24`) 사용자명, 시안(`#22d3ee`) 해시태그
- **Layout**: 좌측 사이드바 네비게이션 + 듀얼 패널 포스트 (자연어 | CLI)

## Development Workflow

### Branch Conventions

- Feature branches should follow the pattern: `claude/<description>-<id>`
- All development happens on feature branches; avoid pushing directly to `main`

### Commit Guidelines

- Write clear, descriptive commit messages
- Use conventional commit style when applicable (e.g., `feat:`, `fix:`, `docs:`, `chore:`)

### Key Documents

- `docs/PRD.md` — 전체 제품 요구사항 문서
