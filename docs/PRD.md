# CLItoris — Product Requirements Document

## 1. 제품 개요

**CLItoris**는 터미널/CLI 인터페이스를 컨셉으로 한 소셜 네트워크 서비스(SNS)다.
사용자는 자연어로 글을 작성하면, LLM이 이를 CLI 명령어 형태로 변환하여 듀얼 포맷으로 표시한다.
모든 소셜 인터랙션(포스트, 팔로우, 포크, 스타)이 CLI 명령어로 표현된다.

**도메인**: `terminal.social`

## 2. 핵심 컨셉

- **"하고 싶은 말을 그냥 쓰세요. LLM이 CLI로 번역하고, 둘 다 올라갑니다."**
- 자연어 입력 → LLM 변환 → CLI 명령어 + 원문 동시 노출 (듀얼 포맷)
- 모든 콘텐츠는 오픈소스이며 포크 가능

## 3. 사용자 페르소나

| 페르소나 | 설명 |
|---------|------|
| 개발자 | CLI에 익숙하고, 터미널 미학을 즐기는 사용자 |
| AI/LLM 사용자 | 다양한 LLM 모델을 통해 콘텐츠를 생성하는 사용자 |
| 오픈소스 커뮤니티 | 포크/스타 개념에 친숙한 GitHub 사용자 |

## 4. 주요 기능

### 4.1 피드 시스템

- **글로벌 피드** (`feed --global`): 전체 공개 게시물
- **로컬 피드** (`feed --local`): 팔로잉 기반 게시물
- **팔로잉** (`following`): 팔로우한 사용자의 게시물
- **탐색** (`explore`): 트렌딩/추천 게시물

### 4.2 포스트 (듀얼 포맷)

각 포스트는 두 가지 형태로 동시 표시:

```
┌─ 자연어 ─────────────────────┐  ┌─ CLI — open source ─────────┐
│ 바이브코딩하다가 느낀건데,     │  │ post --user=jiyeon.kim \    │
│ 우리가 AI한테 맞춰가는 거     │  │   --lang=ko \               │
│ 아닐까요?                     │  │   --message="observing AI   │
│ #vibe-coding #thoughts       │  │   language convergence..." \ │
│                               │  │   --tags=vibe-coding \      │
│                               │  │   --visibility=public       │
└───────────────────────────────┘  └─────────────────────────────┘
```

**포스트 속성:**
- `--user`: 작성자
- `--lang`: 언어 코드 (ko, en, hi 등)
- `--message`: 본문 내용
- `--tags`: 해시태그 (쉼표 구분)
- `--visibility`: 공개 범위 (public, private, unlisted)
- `--mention`: 멘션

### 4.3 인터랙션

| 액션 | CLI 표현 | 설명 |
|------|---------|------|
| 답글 | `reply` | 게시물에 답글 |
| 포크 | `fork` | 게시물을 복제하여 자신의 타임라인에 재작성 |
| 스타 | `star` | 좋아요/북마크 |

### 4.4 LLM 통합

사용자는 포스트 작성 시 LLM 모델을 선택하여 자연어 → CLI 변환 수행:

- **claude-sonnet** (기본값)
- **gpt-4o**
- **llama-3**
- **connect LLM** (커스텀 LLM 연결)

**변환 플로우:**
```
자연어 입력 → [Cmd+Enter] → LLM 선택 → CLI 포맷 변환 → 듀얼 포맷 저장
```

### 4.5 다국어 지원

- 각 포스트에 `--lang` 태그로 언어 표시
- `--translate=auto` 옵션으로 자동 번역
- `--dual-format` 옵션으로 원문 + 번역 동시 표시

### 4.6 사용자 프로필

- `@username` 형식 (예: `@jiyeon_dev`, `@0xmitsuki`)
- 도메인 연결 지원 (예: `jiyeon.kim`, `mitsuki.sh`, `arjun.io`, `lena.dev`)
- 내 포스트 보기 (`my posts`, `my posts --raw`)
- 스타한 포스트 (`starred`)

### 4.7 "by LLM" 필터

LLM 모델별로 생성된 콘텐츠를 필터링하여 탐색 가능:
- claude-sonnet
- gpt-4o
- llama-3

## 5. UI/UX 디자인

### 5.1 디자인 원칙

- **터미널 미학**: 다크 배경, 모노스페이스 폰트, 녹색/앰버/시안 텍스트
- **듀얼 패널**: 좌측 자연어, 우측 CLI 명령어
- **최소 크롬**: 불필요한 UI 장식 제거, 콘텐츠 중심

### 5.2 색상 팔레트

| 요소 | 색상 |
|------|------|
| 배경 | `#1a1a2e` (다크 네이비) |
| 기본 텍스트 | `#e0e0e0` (라이트 그레이) |
| CLI 키워드 | `#4ade80` (그린) |
| 사용자명 | `#fbbf24` (앰버) |
| 해시태그 | `#22d3ee` (시안) |
| 언어 태그 | `#a78bfa` (퍼플) |
| 명령어 프롬프트 | `#f97316` (오렌지) |

### 5.3 레이아웃 구조

```
┌─────────────────────────────────────────────────────┐
│ terminal.social / 네비게이션 경로                      │
├──────────┬──────────────────────────────────────────┤
│ 사이드바  │  메인 피드                                 │
│          │  ┌─ 입력 바 ─────────────────────────┐    │
│ // nav   │  │ 자연어 + CLI 프롬프트 저장 [LLM→CLI] │    │
│ $ feed   │  └───────────────────────────────────┘    │
│ following│  ┌─ 포스트 ──────────────────────────┐    │
│ explore  │  │ [자연어 패널]  │  [CLI 패널]        │    │
│          │  │               │                    │    │
│ // by LLM│  │ reply · fork · star               │    │
│ · claude │  └───────────────────────────────────┘    │
│ · gpt-4o │                                           │
│ · llama  │  ┌─ 포스트 ──────────────────────────┐    │
│          │  │ ...                                │    │
│ // me    │  └───────────────────────────────────┘    │
│ @you     │                                           │
│ my posts │                                           │
│ starred  │                                           │
└──────────┴──────────────────────────────────────────┘
```

### 5.4 폰트

- **본문**: `JetBrains Mono`, `Fira Code`, 또는 시스템 모노스페이스
- **자연어 섹션**: 읽기 편한 sans-serif 허용 (선택적)

## 6. 정보 아키텍처

### 6.1 네비게이션

```
/                       → 글로벌 피드 (기본)
/feed/local             → 로컬 피드
/following              → 팔로잉 피드
/explore                → 탐색
/by-llm/:model          → LLM별 필터
/@:username             → 사용자 프로필
/@:username/posts       → 사용자 게시물
/@:username/starred     → 스타한 게시물
/post/:id               → 단일 포스트 + 스레드
```

### 6.2 데이터 모델

```
User {
  id, username, domain, display_name,
  bio, avatar_url, created_at
}

Post {
  id, user_id, message_raw, message_cli,
  lang, tags[], mentions[], visibility,
  llm_model, parent_id (reply),
  forked_from_id, created_at
}

Follow { follower_id, following_id }
Star   { user_id, post_id }
Fork   { user_id, original_post_id, forked_post_id }
```

## 7. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| State management | Zustand |
| Flow diagrams | `@xyflow/react` v12 |
| Backend | Node.js + Express + tsx (TypeScript 직접 실행) |
| DB | SQLite (`better-sqlite3`) + versioned migrations |
| Logging | pino |
| Testing | Vitest (frontend + server), Playwright (E2E) |
| Package manager | pnpm |
| LLM 통합 | Anthropic SDK, OpenAI SDK, Ollama (llama) |

## 8. API 설계 (초안)

```
POST   /api/posts              → 포스트 작성
GET    /api/posts/feed/global   → 글로벌 피드
GET    /api/posts/feed/local    → 로컬 피드
GET    /api/posts/:id           → 단일 포스트
POST   /api/posts/:id/reply     → 답글
POST   /api/posts/:id/fork      → 포크
POST   /api/posts/:id/star      → 스타 토글
DELETE /api/posts/:id           → 포스트 삭제

GET    /api/users/@:username    → 사용자 프로필
POST   /api/users/@:username/follow → 팔로우 토글
GET    /api/users/@:username/posts  → 사용자 게시물

POST   /api/llm/transform      → 자연어 → CLI 변환
GET    /api/posts/by-llm/:model → LLM별 필터
```

## 9. MVP 범위

### Phase 1 — 코어
- [ ] 사용자 등록/로그인
- [ ] 포스트 작성 (듀얼 포맷)
- [ ] LLM 변환 (claude-sonnet 우선)
- [ ] 글로벌 피드
- [ ] 스타/답글

### Phase 2 — 소셜
- [ ] 팔로우/팔로잉
- [ ] 로컬 피드
- [ ] 포크 기능
- [ ] 사용자 프로필 페이지

### Phase 3 — 확장
- [ ] 다중 LLM 지원 (gpt-4o, llama-3)
- [ ] 다국어 자동 번역
- [ ] 탐색/트렌딩
- [ ] 커스텀 LLM 연결

## 10. 비기능 요구사항

- **성능**: 피드 로딩 < 500ms
- **접근성**: 키보드 네비게이션 완전 지원 (터미널 UX)
- **반응형**: 모바일에서도 듀얼 포맷 표시 (세로 스택)
- **보안**: XSS 방지, SQL injection 방지, rate limiting
- **오픈소스**: 모든 포스트 데이터는 포크 가능한 구조
