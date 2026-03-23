<p align="center">
  <img src="docs/design/forkverse.png" alt="Forkverse" width="520" />
</p>

<p align="center">
  <a href="https://terminal.social"><strong>terminal.social</strong></a> &middot;
  <a href="./README.md"><strong>English</strong></a> &middot;
  <a href="./docs/PROGRESS.md"><strong>로드맵</strong></a> &middot;
  <a href="https://discord.gg/forkverse"><strong>Discord</strong></a>
</p>

<br/>

<p align="center">
  <strong>AI 레포 분석. 내 에이전트. 개발자 소셜.</strong><br/>
  <sub>terminal.social — 소스 코드를 읽는 사람들을 위한 네트워크.</sub>
</p>

<br/>

---

<br/>

## 철학

대부분의 개발자 도구는 소셜을 부록처럼 붙입니다. 대부분의 소셜 네트워크는 개발자를 창작자가 아닌 사용자로 봅니다.

Forkverse는 다른 전제에서 출발합니다.

**개발자가 공유할 수 있는 가장 가치 있는 것은 의견이 아닙니다. 코드베이스 분석입니다.**

레포를 AI로 분석하면 진짜 유용한 것이 나옵니다 — 아키텍처 맵, 리스크 평가, 스택 명세. 이것이 진짜 신호입니다. 공유할 가치가 있습니다. 피드가 이런 것들로 채워져야 합니다.

나머지는 이 전제에서 따라옵니다:

- **GitHub이 정체성** — 단순한 로그인이 아닙니다. 내 스타, 내 포크, 기여 히스토리, 팔로우 그래프. Forkverse에서 따로 프로필을 만들지 않습니다. GitHub을 가져오면 그게 프로필이 됩니다.
- **내 키, 내 모델** — AI 호출을 프록시하거나 프롬프트를 저장하지 않습니다. 분석에 쓸 API 키를 직접 가져옵니다. 모델을 직접 선택합니다. Ollama로 돌리면 아무것도 PC 밖으로 나가지 않습니다.
- **알고리즘 없음** — 피드는 사람들이 올린 것을 시간순으로 보여줍니다. 참여도 최적화 없음. 표면으로 떠오르는 콘텐츠는 개발자들이 공유할 가치가 있다고 판단한 것들입니다.
- **CLI 어휘 일관성** — `fork` (리트윗 아님). `star` (좋아요 아님). `grep` (검색 아님). `$ post --new` (글쓰기 아님). 이건 미학이 아닙니다. 맞는 언어로 맞는 사람들에게 말하는 것입니다.
- **기본적으로 오픈** — MIT 라이선스. SQLite 셀프 호스팅. 벤더 잠금 없음. 내 인스턴스를 직접 운영하세요.

> *"터미널은 진짜 작업이 일어나는 곳입니다. 피드도 그래야 합니다."*

<br/>

---

<br/>

## Forkverse가 하는 일

```
$ analyze --repo=vercel/next.js     → AI 분석: 아키텍처, 스택, 리스크, 개선 방향
$ chat --agent=openrouter           → 어떤 AI 에이전트나 모델이든 스트리밍 대화
$ post --new                        → 글 작성; CLI 포맷 자동 생성, AI 키 불필요
$ feed --global                     → 개발자들이 분석하고 공유하는 것 발견
$ explore                           → 트렌딩 분석, 레포, 태그
$ gh --status                       → GitHub 전체를 한 곳에서
$ msg --inbox                       → 다이렉트 메시지, 실시간
$ log --activity                    → GitHub 활동을 소셜 타임라인으로
$ grep                              → 포스트, 유저, 레포, 태그 전문 검색
$ rank --board                      → 영향력 리더보드
```

<br/>

---

<br/>

## `$ analyze` — AI 레포 분석

핵심 기능. 아무 공개 GitHub 레포 주소를 입력하세요.

```bash
$ analyze --repo=vercel/next.js --output=report --model=claude-sonnet-4-6
```

```
> Fetching repository metadata...          ✓ done
> Scanning file structure...               ✓ done
> Analyzing architecture patterns...       ✓ done
> Extracting tech stack...                 ✓ done
> Generating insights...                   ░░░░░░░░░░  active
```

**세 가지 출력 형식:**

| 출력 | 결과물 |
|------|--------|
| `--output=report` | 구조화된 마크다운: 요약, 스택, 아키텍처, 강점, 리스크, 개선 방향 |
| `--output=pptx` | 터미널 테마 5장 슬라이드 — 팀 발표용으로 바로 사용 가능 |
| `--output=video` | 애니메이션 HTML 워크스루 — ffmpeg 불필요, 파일로 공유 가능 |

분석 후 결과를 확인하고, 캡션을 편집하고, 피드에 올리세요. 다른 사람들이 발견하고, 토론하고, 스타를 찍고, 포크합니다.

**레포 URL 입력 방법:**
```
--repo=vercel/next.js
--repo=https://github.com/vercel/next.js
```

**커스텀 포커스 프롬프트:**
`.md` 파일을 업로드해서 AI가 집중할 방향을 지정하세요 — 보안, 성능, 확장성, 접근성. 분석이 내 관점에 맞게 조정됩니다.

### 9+ AI 프로바이더 — 내 키, 내 모델

<div align="center">
<table>
  <tr>
    <td align="center">🟣<br/><sub><strong>Anthropic</strong><br/>Claude Sonnet 4.6<br/>Claude Haiku 4.5</sub></td>
    <td align="center">🟢<br/><sub><strong>OpenAI</strong><br/>GPT-4o<br/>GPT-4o-mini</sub></td>
    <td align="center">🔵<br/><sub><strong>Google</strong><br/>Gemini 2.5 Pro<br/>Gemini Flash</sub></td>
    <td align="center">🦙<br/><sub><strong>Ollama</strong><br/>Llama · Mistral<br/>Qwen · 모든 로컬</sub></td>
    <td align="center">🔀<br/><sub><strong>OpenRouter</strong><br/>200+ 모델<br/>하나의 엔드포인트</sub></td>
    <td align="center">⚡<br/><sub><strong>Groq</strong><br/>Together AI<br/>Cerebras</sub></td>
    <td align="center">🔌<br/><sub><strong>커스텀</strong><br/>OpenAI 호환<br/>모든 엔드포인트</sub></td>
  </tr>
</table>
</div>

Ollama로 실행하면 → 데이터가 내 PC 밖으로 나가지 않습니다. 완전한 분석, 완전한 프라이버시.

<br/>

---

<br/>

## `$ chat` — 내 AI 에이전트 통합

이미 여러 AI 도구를 씁니다. Forkverse가 그것들을 하나의 터미널 인터페이스로 통합합니다.

```bash
$ agent --connect
```

**외부 AI 에이전트 연결:**

| 에이전트 | 특징 |
|---------|------|
| **OpenClaw** | Claude 기반 에이전트, 툴 사용, 긴 컨텍스트 지원 |
| **Dify** | 비주얼 워크플로우 에이전트 빌더 — 만든 앱을 그대로 연결 |
| **Coze** | 바이트댄스 에이전트 플랫폼, 플러그인 생태계 |
| **커스텀** | HTTP 엔드포인트가 있는 모든 에이전트 — 내 것, 회사 것 |

**또는 프로바이더에 직접 연결:**
```bash
$ agent --provider=anthropic  --model=claude-opus-4-6
$ agent --provider=openai     --model=gpt-4o
$ agent --provider=gemini     --model=gemini-2.5-pro
$ agent --provider=ollama     --model=llama3.2
$ agent --provider=openrouter --model=<any>
$ agent --provider=groq       --model=<any>
```

**제공되는 것:**
- 스트리밍 응답 — 생성되는 대로 텍스트가 나타납니다
- 에이전트별 대화 기록 유지
- 컨텍스트 손실 없이 에이전트 전환
- 모바일 최적화 채팅 인터페이스

에이전트는 내가 가져옵니다. Forkverse가 집이 되어줍니다.

<br/>

---

<br/>

## `$ post --new` — 글쓰기

Forkverse에서 글 쓰는 것은 다른 소셜 플랫폼과 다릅니다.

```bash
$ post --new
```

**입력하는 동안 CLI 포맷이 실시간으로 만들어집니다:**
```
$ post --user=@나 --repo=vercel/next.js --tags=nextjs,architecture --lang=ko ¶ next.js 분석 완료...
```

텍스트 아래에 프리뷰로 실시간 표시됩니다 — 포스트가 CLI 형식으로 어떻게 보일지 항상 확인할 수 있습니다. AI 키 불필요. 서버가 일반 텍스트에서 이 형식을 자동 생성합니다.

**첨부 가능한 것:**
- **GitHub 레포** — `owner/repo` 또는 `github.com/...` 전체 URL 붙여넣기. 레포가 칩으로 표시되고 CLI 포맷에 자동 포함됩니다.
- **이미지 & 동영상** — 최대 4개 파일. 클립보드에서 바로 붙여넣기. 드래그 앤 드롭.
- **@멘션** — 입력하는 동안 사용자 자동완성. 멘션된 사용자에게 알림이 갑니다.
- **#해시태그** — 인라인 입력. 태그가 자동으로 추출되고 인덱싱됩니다.
- **언어** — `auto`, `en`, `ko`, `zh`, `ja`. 포스트 저장 및 번역 방식을 제어합니다.

**CLI 포맷 작동 방식:**
모든 포스트는 두 가지 표현을 갖습니다 — 일반 언어 텍스트와 자동 생성된 CLI 포맷. 둘 다 저장되고, 둘 다 피드에서 볼 수 있습니다. CLI 문자열은 직접 작성하지 않습니다. 서버가 텍스트, 추출된 태그, 멘션, 첨부 레포에서 자동으로 생성합니다.

<br/>

---

<br/>

## `$ feed` — 개발자들이 만들고 있는 것

피드는 분석 결과, GitHub 활동, 개발자 생각이 모이는 곳입니다.

```bash
$ feed --global     # 모든 사람의 포스트
$ feed --local      # 팔로잉하는 사람들만
```

```
┌─ GitHub이 보여주는 것 ──────────────┐  ┌─ Forkverse가 보여주는 것 ─────────────┐
│  vercel/next.js                    │  │  "next.js 분석 완료 — RSC 구현이     │
│  ★ 127k  🍴 27k  TypeScript        │  │   생각보다 훨씬 깔끔하다. 추상화      │
│                                    │  │   레이어가 놀랍도록 얇음. 읽을 가치   │
│  (이게 전부)                        │  │   있음. #nextjs #architecture"       │
└────────────────────────────────────┘  └────────────────────────────────────┘
```

**듀얼 포맷 포스트** — 모든 포스트가 일반 언어 버전과 CLI 버전 모두 표시됩니다. 전환 가능.

**소셜 액션 — 전부 Git 어휘로:**

| 액션 | 설명 |
|------|------|
| **스타** `s` | 포스트 북마크. 작성자에게 알림. 내 starred 탭에 표시. |
| **포크** | 내 의견을 담아 리포스트. 연결된 포크 포스트 생성. |
| **인용** | 포스트를 인용하고 내 코멘터리 추가. |
| **답글** `r` | 스레드 방식 답글. 중첩 대화. |
| **리액션** | 코드 리뷰 스타일 8가지: `lgtm` `ship_it` `fire` `bug` `thinking` `rocket` `eyes` `heart` |

**키보드 단축키:**
```
j / k      위아래 탐색
s          포커스된 포스트 스타
r          답글
o          포스트 상세 열기
g g        글로벌 피드로
g l        로컬 피드로
g a        분석 페이지로
?          전체 단축키 보기
```

<br/>

---

<br/>

## `$ explore` — 발견

```bash
$ explore
```

- **트렌딩 분석** — 이번 주 가장 많이 스타/토론된 분석 포스트
- **트렌딩 레포** — Forkverse에서 가장 많이 분석된 레포
- **트렌딩 태그** — 가장 활발한 해시태그
- **추천 사용자** — 팔로우할 개발자 추천
- **GitHub 트렌딩** — GitHub 트렌딩 레포 직접 가져오기, 원클릭 분석

<br/>

---

<br/>

## `$ gh --status` — GitHub 깊은 연동

Forkverse는 GitHub을 단순한 인증 제공자가 아닌 인프라로 다룹니다.

```bash
$ gh --status
```

**웹훅 자동 포스팅:**
GitHub 웹훅을 한 번 설정하면 끝. main에 push, PR 머지, 릴리스 배포 — 자동으로 Forkverse 포스트가 됩니다. 해시태그를 붙이고, 팀원을 멘션하고, 컨텍스트를 써두세요. 수동 노력 없이 코딩 생활이 피드가 됩니다.

```
push → main @ vercel/next.js            → post --type=push --repo=vercel/next.js ¶ ...
PR merged: "RSC 스트리밍 지원 추가"       → post --type=pr_merge --pr=12847 ¶ ...
Release: v15.0.0                        → post --type=release --tag=v15.0.0 ¶ ...
```

**활동 임포트:**
웹훅 설정 없이도 "GitHub 동기화" 클릭 한 번으로 최근 이벤트 — push, PR, 릴리스, 스타, 포크 — 전부 포스트로 임포트됩니다.

**`$ gh --status` 안에 있는 것:**

<div align="center">
<table>
<tr>
<td align="center"><strong>🌱 기여 그래프</strong><br/><sub>전체 히트맵이 프로필에.<br/>날짜별 hover로 뭘 만들었는지 확인.</sub></td>
<td align="center"><strong>👥 팔로우 동기화</strong><br/><sub>GitHub 네트워크 자동 팔로우.<br/>GitHub 팔로잉이 여기서도 팔로잉.</sub></td>
<td align="center"><strong>🔔 알림</strong><br/><sub>GitHub 알림 앱 내에서.<br/>읽음 처리, 스레드 이동.</sub></td>
<td align="center"><strong>⭐ 스타</strong><br/><sub>GitHub 스타 레포 브라우징.<br/>원클릭으로 분석.</sub></td>
</tr>
<tr>
<td align="center"><strong>📋 이슈</strong><br/><sub>나에게 할당된 이슈.<br/>레포별 필터.</sub></td>
<td align="center"><strong>🔍 PR 리뷰</strong><br/><sub>내 리뷰를 기다리는<br/>풀 리퀘스트.</sub></td>
<td align="center"><strong>🔍 레포 검색</strong><br/><sub>GitHub 레포 검색.<br/>원클릭 분석.</sub></td>
<td align="center"><strong>📈 트렌딩</strong><br/><sub>언어별 GitHub 트렌딩 레포.<br/>지금 뜨는 것 분석.</sub></td>
</tr>
</table>
</div>

<br/>

---

<br/>

## `$ msg --inbox` — 다이렉트 메시지

```bash
$ msg --inbox
$ msg --to=@username
```

- 아무 사용자와 비공개 1대1 대화
- 실시간 메시지 전달
- 네비게이션에 읽지 않은 수 배지
- 모바일 최적화 인박스 및 스레드 뷰
- 대화 기록 유지

<br/>

---

<br/>

## `$ log --activity` — 내 타임라인

```bash
$ log --activity
```

GitHub 활동을 소셜 타임라인으로 — 날것의 이벤트 덤프가 아닙니다.

- **일별 그룹** — 오늘 / 어제 / 이번 주 / 이전
- **스마트 축소** — 같은 레포에 연속 push 7회 → 개수 표시 한 줄로
- **필터 탭** — 전체 / 소셜 (Forkverse 포스트) / GitHub (원본 이벤트)
- **아바타 + 색상 배지** — `push` `pr_merge` `release` `star` `fork` 각각 고유한 시각적 처리
- **펼치기** — 축소된 그룹 클릭으로 개별 이벤트 확인

<br/>

---

<br/>

## `$ grep` — 검색

```bash
$ grep "next.js 아키텍처"
$ grep --tag=rustlang
$ grep --user=@username
```

전문 검색 범위:
- 포스트 내용 (일반 언어 및 CLI 포맷 모두)
- 사용자 이름 및 표시 이름
- 첨부 레포 이름
- 해시태그

SQLite FTS5 기반 — 즉각 결과, 외부 검색 서비스 불필요.

<br/>

---

<br/>

## `$ rank --board` — 영향력

```bash
$ rank --board
```

**영향력 점수** 산출 기준:
- 작성한 포스트 수
- 받은 스타 수
- 내 포스트 포크 수
- 팔로워 수
- GitHub 기여 활동

리더보드는 실시간 업데이트. 프로필에 표시. 참여도 게임화가 아닌 — 실제 개발자 기여와 공유를 반영합니다.

<br/>

---

<br/>

## 사용자 프로필 — `/@username`

```bash
$ profile --user=@username
```

모든 프로필은 GitHub 정체성:
- **Posts 탭** — 공유한 모든 것
- **Starred 탭** — 스타 찍은 포스트 (공개)
- **Repos 탭** — GitHub 레포 목록과 통계
- **API 탭** (본인만) — LLM 프로바이더 키 관리
- **기여 그래프** — 전체 GitHub 히트맵
- **영향력 점수** — 프로필에 표시
- **팔로우 / 메시지** — 프로필 헤더에서
- **GitHub 링크** — GitHub 프로필 바로가기

<br/>

---

<br/>

## 설정

- **프로필** — 표시 이름, 소개, 아바타
- **API 키** — Claude, GPT-4o, Gemini, Ollama, OpenRouter, 커스텀 엔드포인트 키 추가/제거
- **GitHub** — 웹훅 설정 가이드, 동기화 컨트롤
- **AI 에이전트** — OpenClaw, Dify, Coze, 커스텀 에이전트 엔드포인트 연결
- **언어** — UI 언어: en / ko / zh / ja

<br/>

---

<br/>

## 전체 기능 목록

| 명령어 | 기능 | 비고 |
|--------|------|------|
| `$ analyze` | AI 레포 분석 | report / pptx / video 출력 |
| | 9+ LLM 프로바이더 | Claude, GPT-4o, Gemini, Ollama, OpenRouter, Groq, Together, Cerebras, 커스텀 |
| | 커스텀 포커스 프롬프트 | .md 파일 업로드로 분석 방향 지정 |
| | 공유 전 캡션 검수 | 피드 올리기 전 편집 단계 |
| `$ chat` | AI 에이전트 챗 | OpenClaw, Dify, Coze, 커스텀 HTTP 에이전트 |
| | 직접 프로바이더 연결 | Claude, GPT-4o, Gemini, Ollama, OpenRouter, Groq |
| | 스트리밍 응답 | SSE 스트리밍, 실시간 텍스트 출력 |
| `$ post --new` | 포스트 작성 | 일반 언어 + 자동 CLI 포맷 |
| | CLI 실시간 프리뷰 | 입력하는 동안 `post --user=@x ¶ ...` 실시간 표시 |
| | GitHub 레포 첨부 | `owner/repo` 또는 GitHub 전체 URL |
| | 미디어 업로드 | 이미지+동영상, 최대 4개, 클립보드 붙여넣기 |
| | @멘션 자동완성 | `@` 입력 → 사용자 검색 드롭다운 |
| | #해시태그 인덱싱 | 자동 추출, 자동 인덱싱 |
| | 언어 선택 | auto / en / ko / zh / ja |
| `$ feed` | 글로벌 피드 | 모든 사용자 포스트 |
| | 로컬 피드 | 팔로잉만 |
| | 듀얼 포맷 포스트 | 일반 언어 + CLI 표현, 전환 가능 |
| | 스타 `s` | 북마크, 작성자 알림 |
| | 포크 | 내 의견을 담아 리포스트 |
| | 인용 | 포스트 인용 + 코멘터리 |
| | 답글 `r` | 스레드 방식 답글 |
| | 리액션 | 8가지: lgtm ship_it fire bug thinking rocket eyes heart |
| | 키보드 탐색 | j/k 이동, s 스타, r 답글, o 열기, g-코드 라우팅, ? 도움말 |
| `$ explore` | 트렌딩 분석 | 가장 많이 스타된 분석 포스트 |
| | 트렌딩 레포 | 가장 많이 분석된 레포 |
| | 트렌딩 태그 | 가장 활발한 해시태그 |
| | GitHub 트렌딩 | GitHub 트렌딩 가져오기, 원클릭 분석 |
| | 추천 사용자 | 팔로우 추천 |
| `$ gh --status` | 웹훅 자동 포스팅 | push / PR 머지 / 릴리스 → 즉시 포스트 |
| | 활동 임포트 | 최근 GitHub 이벤트 원클릭 동기화 |
| | 기여 그래프 | 전체 히트맵이 프로필에 |
| | 팔로우 동기화 | GitHub 네트워크 자동 팔로우 |
| | 알림 | GitHub 알림 앱 내에서 |
| | 스타 브라우저 | 스타 레포 탐색, 원클릭 분석 |
| | 이슈 | 할당된 이슈 목록 |
| | PR 리뷰 | 대기 중인 리뷰 요청 |
| | 레포 검색 | GitHub 검색 + 트렌딩 |
| `$ msg --inbox` | 다이렉트 메시지 | 실시간, 비공개, 스레드 |
| `$ log --activity` | 활동 피드 | 일별 그룹, 스마트 축소, all/social/github 필터 |
| `$ grep` | 전문 검색 | 포스트, 유저, 레포, 태그 — SQLite FTS5 |
| `$ rank --board` | 영향력 점수 + 리더보드 | 포스트+스타+포크+팔로워 |
| `/@username` | 사용자 프로필 | Posts / Starred / Repos / API 탭 |
| | 기여 그래프 | 전체 GitHub 히트맵 |
| `/settings` | API 키 관리 | 프로바이더별 키 저장 |
| | 에이전트 관리 | 외부 에이전트 연결 |
| | 웹훅 설정 | GitHub 웹훅 가이드 |
| 공통 | GitHub OAuth 정체성 | 별도 계정 불필요 |
| | UI 4개 언어 | en / ko / zh / ja |
| | 모바일 하단 네비 | PWA 지원, 앱스토어 출시 예정 |
| | 데스크톱 사이드바 | 키보드 우선 |
| | 다크 터미널 미학 | JetBrains Mono, #0d1117 베이스 |
| | 셀프 호스팅 | SQLite, 외부 DB 불필요 |
| | 오픈 소스 | MIT 라이선스 |

<br/>

---

<br/>

## 데모 영상

<video src="docs/screens/녹음 2026-03-21 132654.mp4" controls width="100%"></video>

> 영상이 보이지 않나요? [GitHub에서 보기](docs/screens/녹음%202026-03-21%20132654.mp4)

<br/>

---

<br/>

## 모바일 스크린샷

<p align="center"><em>터치·하단 네비·작은 화면에 맞춘 동일한 terminal.social 경험입니다.</em></p>

<table>
<tr>
<td align="center" width="50%">
<p><strong>프로필</strong><br/><sub>기여 그래프, 영향력 점수, 에이전트 챗, 메시지, GitHub.</sub></p>
<img src="docs/screens/모바일1.png" width="300" alt="Forkverse 모바일: 프로필" />
</td>
<td align="center" width="50%">
<p><strong>에이전트 연결</strong><br/><sub><code>$ agent --connect</code> — OpenClaw, Dify, Coze, OpenAI, Anthropic, Ollama, 커스텀.</sub></p>
<img src="docs/screens/모바일2.png" width="300" alt="Forkverse 모바일: 에이전트 설정" />
</td>
</tr>
<tr>
<td align="center" width="50%">
<p><strong>레포 분석</strong><br/><sub><code>$ analyze</code> — report, PPTX, video 선택. 올리기 전 캡션 검수.</sub></p>
<img src="docs/screens/모바일3.png" width="300" alt="Forkverse 모바일: 분석" />
</td>
<td align="center" width="50%">
<p><strong>글로벌 피드</strong><br/><sub>grep 검색, 듀얼 포맷 포스트, 스타, 포크, 리액션.</sub></p>
<img src="docs/screens/모바일4.png" width="300" alt="Forkverse 모바일: 피드" />
</td>
</tr>
<tr>
<td align="center" width="50%">
<p><strong>글쓰기</strong><br/><sub><code>$ post --new</code> — 작성, 레포 첨부, CLI 프리뷰 실시간 빌드. AI 키 불필요.</sub></p>
<img src="docs/screens/모바일5.png" width="300" alt="Forkverse 모바일: 글쓰기" />
</td>
<td align="center" width="50%">
<p><strong>GitHub 탐색</strong><br/><sub>트렌딩 레포, 원클릭 분석, 스타, 알림.</sub></p>
<img src="docs/screens/모바일6.png" width="300" alt="Forkverse 모바일: GitHub" />
</td>
</tr>
<tr>
<td align="center" width="50%">
<p><strong>피드 & 멘션</strong><br/><sub><code>@</code> 자동완성, 답글 스레드, 리액션.</sub></p>
<img src="docs/screens/모바일7.png" width="300" alt="Forkverse 모바일: 멘션" />
</td>
<td align="center" width="50%">
<p><strong>사용자 프로필</strong><br/><sub>posts / starred / repos — 팔로우, 메시지, GitHub 정체성.</sub></p>
<img src="docs/screens/모바일8.png" width="300" alt="Forkverse 모바일: 프로필" />
</td>
</tr>
</table>

<br/>

---

<br/>

## 이런 분에게 맞습니다

- ✅ 아무 레포나 **몇 분 안에 이해**하고 싶은 분
- ✅ AI 분석 결과를 **관심 있는 개발자들과 공유하고 토론**하고 싶은 분
- ✅ 여러 AI 도구를 쓰는데 **한 곳에서 모든 에이전트와 대화**하고 싶은 분
- ✅ **Ollama로 완전 로컬**에서 분석하고 싶은 분 — 데이터가 PC 밖으로 안 나감
- ✅ 매일 코딩하지만 **GitHub 활동이 자동으로 소셜 콘텐츠**가 되길 원하는 분
- ✅ **포크**가 포크이고, **스타**가 스타이고, **정체성**이 GitHub인 네트워크를 원하는 분
- ✅ 마우스를 싫어하는 분 — **키보드 우선** 네비게이션
- ✅ **오픈 소스**로 직접 운영하고 싶은 분

## Forkverse가 아닌 것

| | |
|--|--|
| **또 다른 트위터 클론이 아닙니다** | 알고리즘 없음. 광고 없음. 어그로 없음. 레포 분석과 GitHub 활동이 콘텐츠입니다. |
| **코드 에디터가 아닙니다** | 소셜 네트워크입니다. IDE가 아닙니다. |
| **클라우드 전용이 아닙니다** | Ollama로 로컬 LLM. 전체 플랫폼 셀프 호스팅. SQLite — 외부 DB 불필요. |
| **영어 전용이 아닙니다** | 아무 언어로든 작성. UI는 en / ko / zh / ja 지원. |
| **폐쇄 플랫폼이 아닙니다** | MIT 라이선스. 오픈 소스. 포크해서 내 인스턴스 운영 가능. |

<br/>

---

<br/>

## 빠른 시작

```bash
git clone https://github.com/ccivlcid/Forkverse.git
cd Forkverse
cp .env.example .env     # GitHub OAuth 자격증명 추가
pnpm install
pnpm dev
```

**http://localhost:7878** 열고 GitHub으로 접속.

> **요구사항:** Node.js 18+, pnpm 8+, [GitHub OAuth 앱](https://github.com/settings/developers)
> 콜백 URL: `http://localhost:3771/api/auth/github/callback`

<br/>

## FAQ

**AI 키가 필요한가요?**
**글 작성**에는 불필요합니다. CLI 포맷은 서버가 자동 생성합니다. **레포 분석**에는 필요합니다 — `/@username?tab=api`에서 키를 추가하세요 (Claude, GPT-4o, Gemini, 또는 로컬 Ollama). **에이전트 챗**에는 프로바이더 키 또는 외부 에이전트 엔드포인트를 연결하면 됩니다.

**GitHub 활동이 어떻게 포스트가 되나요?**
(1) GitHub 웹훅 설정 — push, PR 머지, 릴리스가 자동 포스팅. (2) "GitHub 동기화" 클릭으로 최근 이벤트 수동 임포트. 두 방법 모두 편집 가능한 실제 포스트를 생성합니다.

**어떤 AI 에이전트를 연결할 수 있나요?**
OpenClaw, Dify, Coze, 또는 HTTP API가 있는 모든 서비스. Claude, GPT-4o, Gemini, Ollama에 직접 연결도 가능합니다. 여러 에이전트를 동시에 등록하고 채팅에서 전환할 수 있습니다.

**비공개 레포 분석이 가능한가요?**
현재 버전에서는 공개 레포만 가능합니다. 비공개 레포 분석(확장 OAuth 스코프)은 향후 릴리스에 예정되어 있습니다.

**셀프 호스팅 가능한가요?**
네. 클론, `.env` 설정, `pnpm dev`. SQLite라 GitHub OAuth 외 외부 서비스 불필요. 전체 개발 가이드는 [CLAUDE.md](./CLAUDE.md)를 참고하세요.

<br/>

## 개발

```bash
pnpm dev        # 클라이언트 + 서버 (워치 모드)
pnpm build      # 전체 패키지 빌드
pnpm test       # Vitest 유닛 테스트
pnpm test:e2e   # Playwright E2E
pnpm seed       # 샘플 데이터 로드
```

## 기여하기

[CLAUDE.md](./CLAUDE.md)와 [CONVENTIONS.md](./docs/guides/CONVENTIONS.md)를 먼저 읽어주세요.

## 커뮤니티

- [Discord](https://discord.gg/forkverse) — 커뮤니티 참여
- [GitHub Issues](https://github.com/ccivlcid/Forkverse/issues) — 버그 및 기능 요청

## 라이선스

MIT

<br/>

---

<p align="center">
  <sub>아무 레포나 이해하세요. 에이전트를 가져오세요. 발견한 것을 공유하세요.</sub>
</p>

<p align="center">
  <strong>⑂Fork</strong>verse &nbsp;&middot;&nbsp; terminal.social
</p>
