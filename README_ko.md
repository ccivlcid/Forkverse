<p align="center">
  <img src="docs/design/clitoris.png" alt="CLItoris" width="520" />
</p>

<p align="center">
  <a href="https://terminal.social"><strong>terminal.social</strong></a> &middot;
  <a href="./README.md"><strong>English</strong></a> &middot;
  <a href="./docs/PROGRESS.md"><strong>로드맵</strong></a> &middot;
  <a href="https://discord.gg/clitoris"><strong>Discord</strong></a>
</p>

<br/>

## CLItoris란?

# GitHub이 만들지 않은 소셜 레이어.

GitHub은 당신이 무엇을 코딩하는지 알고 있습니다. 하지만 그것에 대해 **이야기하게** 해주지 않습니다.

47개의 커밋을 푸시합니다. 새벽 3시에 PR을 머지합니다. 모든 걸 고치는 릴리스를 배포합니다. 그런데 팀 밖의 아무도 모릅니다 — 기여 그래프를 스토킹하지 않는 한.

**CLItoris는 GitHub 활동을 소셜 피드로 바꾸고 — 거기에 당신의 목소리를 얹습니다.**

푸시, PR, 릴리스, 스타가 자동으로 포스트가 됩니다. 그 위에 맥락, 생각, 코멘터리를 자연어로 추가합니다. AI가 모든 것을 구조화된 CLI 명령어로 변환합니다. 두 버전이 나란히 표시됩니다.

**이게 GitHub에 없는 것입니다. 이게 우리 SNS입니다.**

<br/>

<div align="center">
<table>
  <tr>
    <td align="center"><strong>연동<br/>서비스</strong></td>
    <td align="center">🐙<br/><sub><strong>GitHub</strong><br/>OAuth · 스타<br/>이슈 · PR<br/>웹훅</sub></td>
    <td align="center">🟣<br/><sub><strong>Anthropic</strong><br/>Claude Sonnet<br/>Claude Haiku</sub></td>
    <td align="center">🟢<br/><sub><strong>OpenAI</strong><br/>GPT-4o<br/>GPT-4o-mini</sub></td>
    <td align="center">🔵<br/><sub><strong>Google</strong><br/>Gemini 2.5 Pro<br/>Gemini Flash</sub></td>
    <td align="center">🦙<br/><sub><strong>Ollama</strong><br/>Llama · Mistral<br/>모든 로컬 모델</sub></td>
    <td align="center">⌨️<br/><sub><strong>CLI 도구</strong><br/>Claude Code<br/>Codex · Gemini</sub></td>
    <td align="center">🔗<br/><sub><strong>범용 API</strong><br/>OpenAI 호환<br/>엔드포인트</sub></td>
  </tr>
</table>

<em>API가 있으면 연결됩니다. 로컬로 돌아가면 더 좋습니다.</em>

</div>

<br/>

---

<br/>

## 당신의 코드는 이미 이야기를 하고 있습니다. 이제 목소리를 주세요.

```
┌─ GitHub이 아는 것 ─────────────────┐  ┌─ CLItoris가 보여주는 것 ────────────┐
│                                    │  │                                    │
│  ✓ main에 3개 커밋 푸시            │  │  "2주 동안 괴롭히던 메모리 릭을     │
│  ✓ mass-refactoring.patch          │  │   드디어 잡았다. 이벤트 리스너가    │
│  ✓ 847 추가, 1,203 삭제           │  │   구독 해제가 안 되고 있었다.       │
│                                    │  │   #debugging #relief"              │
│  (아무도 이걸 안 봅니다)            │  │                                    │
│                                    │  │                                    │
└────────────────────────────────────┘  └────────────────────────────────────┘
```

GitHub은 **무엇을** 했는지 보여줍니다. CLItoris는 **왜** 중요한지 보여줍니다.

<br/>

---

<br/>

## 작동 방식

|        | 무슨 일이 일어나는지 | 예시 |
|--------|-------------------|------|
| **01** | GitHub 활동이 자동 포스팅 | Push, PR 머지, 릴리스, 스타 → CLItoris에 즉시 포스트 |
| **02** | 당신의 목소리를 얹으세요 | 무슨 생각을 했는지, 뭘 배웠는지, 뭐가 망가졌는지 |
| **03** | AI가 변환 | 자연어가 의도, 감정, 태그가 포함된 구조화 CLI 명령어가 됩니다 |
| **04** | 둘 다 게시 | 당신의 말 + CLI 포맷, 피드에 나란히 |

```
┌─ 당신의 목소리 ────────────────────┐  ┌─ AI가 생성한 CLI ───────────────────┐
│                                    │  │                                     │
│  바이브 코딩하다가 우리가           │  │  post --user=jiyeon.kim \           │
│  AI에 적응하고 있는 건 아닌지      │  │    --lang=ko \                      │
│  생각이 들었다.                    │  │    --message="AI 언어 수렴           │
│                                    │  │    현상 관찰..." \                   │
│  #vibe-coding #thoughts            │  │    --tags=vibe-coding,thoughts \    │
│                                    │  │    --intent=casual \                │
│                                    │  │    --emotion=surprised              │
└────────────────────────────────────┘  └─────────────────────────────────────┘
```

<br/>

---

<br/>

## 이런 분에게 맞습니다

- ✅ **매일 코딩하지만** 팀 밖의 아무도 내 작업을 모르는 분
- ✅ GitHub 활동에 **소셜 레이어**가 있으면 좋겠다고 생각한 분 — 초록 격자만 말고
- ✅ 코드 뒤의 **이야기를 공유**하고 싶은 분 — diff만 말고
- ✅ 같은 생각을 **다른 AI 모델**이 어떻게 해석하는지 궁금한 분
- ✅ **포크**가 진짜 포크이고, **스타**가 진짜 스타이고, **정체성**이 GitHub인 SNS를 원하는 분
- ✅ **AI로 레포를 분석**하고 결과를 공유하고 싶은 분
- ✅ 마우스를 싫어하는 분 — **키보드 우선 네비게이션** (`j`/`k`/`s`/`r`/`?`)
- ✅ **Ollama로 로컬 LLM**을 돌려서 완전한 프라이버시를 원하는 분

<br/>

## GitHub이 안 하는 것 — CLItoris가 합니다

| GitHub | CLItoris |
|--------|----------|
| 초록 기여 그래프를 보여줌. 그 네모가 뭔지 아무도 모름. | 모든 push, PR, 릴리스가 당신의 코멘터리가 담긴 **소셜 포스트**가 됨. |
| PR은 코드 리뷰용. 배운 것을 공유하는 곳이 아님. | **당신의 목소리**를 얹으세요 — 무슨 생각을 했는지, 뭐가 망가졌는지, 뭐가 자랑스러운지. |
| 스타는 조용함. 레포에 스타를 찍어도 소셜하게 아무 일도 안 일어남. | 포스트에 스타를 찍으면 작성자에게 알림이 감. 스타가 소셜 프로필의 일부가 됨. |
| 팔로워에게 콘텐츠가 없음. GitHub에서 누군가를 팔로우하면... 아무것도 안 옴. | 팔로우하면 **포스트, 활동, GitHub 이벤트**가 내 피드에 표시됨. |
| 이슈 밖에서 레포를 논의할 방법이 없음. | 포스트에 **레포를 첨부**하세요. AI로 분석하세요. 리포트를 소셜 콘텐츠로 공유하세요. |
| GitHub 생활은 세상에 보이지 않음. | GitHub 생활이 곧 **소셜 생활**. 기여 그래프, 레포, 활동 — 프로필에 전부 표시. |

<br/>

---

<br/>

## GitHub 활동 → 소셜 콘텐츠

코딩 생활이 자동으로 소셜 콘텐츠가 됩니다. 복붙 없음, 수동 포스팅 없음.

<div align="center">
<table>
<tr>
<td align="center" width="33%">
<h3>⚡ 자동 포스팅</h3>
main에 push, PR 머지, 릴리스 배포 — CLItoris가 자동으로 피드에 포스팅합니다. 웹훅 한 번 설정하면 끝.
</td>
<td align="center" width="33%">
<h3>📥 활동 임포트</h3>
한 번의 클릭으로 최근 GitHub 이벤트를 동기화하세요. Push, PR, 릴리스, 스타, 포크 — 전부 포스트가 됩니다.
</td>
<td align="center" width="33%">
<h3>💬 목소리를 얹으세요</h3>
GitHub은 diff를 보여줍니다. 당신은 이야기를 추가하세요 — 뭘 배웠는지, 뭐가 답답했는지, 뭐가 자랑스러운지.
</td>
</tr>
</table>
</div>

### 전체 GitHub 연동

<div align="center">
<table>
<tr>
<td align="center"><strong>🌱 기여<br/>그래프</strong><br/><sub>프로필에<br/>잔디 히트맵</sub></td>
<td align="center"><strong>👥 팔로우<br/>동기화</strong><br/><sub>GitHub 친구<br/>자동 팔로우</sub></td>
<td align="center"><strong>📊 활동<br/>임포트</strong><br/><sub>Push · PR · 릴리스<br/>→ 포스트</sub></td>
<td align="center"><strong>🔔 알림</strong><br/><sub>GitHub 알림<br/>앱 내에서</sub></td>
</tr>
<tr>
<td align="center"><strong>🪝 웹훅<br/>자동 포스팅</strong><br/><sub>Push, 머지, 릴리스<br/>→ 즉시 포스트</sub></td>
<td align="center"><strong>⭐ 스타</strong><br/><sub>GitHub 스타<br/>레포 브라우징</sub></td>
<td align="center"><strong>📋 이슈 &<br/>PR 리뷰</strong><br/><sub>할당된 이슈와<br/>리뷰 요청 추적</sub></td>
<td align="center"><strong>🔑 아이덴티티</strong><br/><sub>GitHub = CLItoris<br/>별도 계정 불필요</sub></td>
</tr>
</table>
</div>

<br/>

---

<br/>

## 활동 그 이상 — 완전한 소셜 네트워크

<table>
<tr>
<td align="center" width="33%">
<h3>🖥️ 듀얼 포맷 포스트</h3>
모든 포스트가 원문과 CLI 표현을 나란히 보여줍니다. AI가 의도, 감정, 해시태그를 자동 추출.
</td>
<td align="center" width="33%">
<h3>🤖 7개 AI 프로바이더</h3>
Claude, GPT-4o, Gemini, Ollama, Cursor, CLI 도구, OpenAI 호환 엔드포인트. 해석 차이를 비교하세요.
</td>
<td align="center" width="33%">
<h3>📊 레포 분석</h3>
AI로 GitHub 레포 분석. 아키텍처 리포트, PPTX 슬라이드, 애니메이션 비디오 워크스루.
</td>
</tr>
<tr>
<td align="center">
<h3>🔍 전문 검색</h3>
포스트, 유저, 태그 즉시 검색. 지난주에 본 Rust async 포스트를 찾으세요.
</td>
<td align="center">
<h3>⌨️ 키보드 우선</h3>
<code>j</code>/<code>k</code> 탐색, <code>s</code> 스타, <code>r</code> 답글, <code>/</code> 작성. 마우스 불필요.
</td>
<td align="center">
<h3>🌍 4개 언어</h3>
영어, 한국어, 중국어, 일본어 전체 UI. 어떤 언어로든 작성 가능 — AI가 나머지를 처리.
</td>
</tr>
</table>

<br/>

## 개발자 방식의 소셜

| ~하는 대신... | ~을 합니다 | 마치... |
|-------------|----------|--------|
| 리트윗 | **포크** | 레포 포크하기 |
| 좋아요 | **스타** | 레포에 스타 찍기 |
| 인용 트윗 | **인용** | 커밋 메시지 인용하기 |
| 리액션 | `lgtm` `ship_it` `fire` `bug` `thinking` `rocket` `eyes` `heart`로 **리액션** | 코드 리뷰 리액션 |

<br/>

## 레포 분석

AI로 아무 GitHub 레포나 분석하세요. 출력 형식을 선택하세요.

```bash
$ analyze --repo=vercel/next.js --output=report   # 아키텍처 분석
$ analyze --repo=owner/name --output=pptx          # 터미널 테마 5장 슬라이드
$ analyze --repo=owner/name --output=video          # 애니메이션 HTML 워크스루
```

결과를 포스트로 공유하세요. 다른 사람들이 피드에서 발견합니다.

<br/>

---

<br/>

## CLItoris가 아닌 것

|  |  |
|--|--|
| **또 다른 트위터 클론이 아닙니다.** | 알고리즘 피드 없음. 광고 없음. 어그로 없음. GitHub 활동이 콘텐츠입니다. |
| **코드 에디터가 아닙니다.** | CLItoris는 소셜 네트워크입니다. IDE가 아닙니다. |
| **클라우드 전용이 아닙니다.** | Ollama로 로컬 LLM을 실행하세요. 데이터가 내 PC에 머무릅니다. |
| **영어만 되는 건 아닙니다.** | 한국어, 일본어, 중국어, 아무 언어로든 작성하세요. |
| **폐쇄 플랫폼이 아닙니다.** | 오픈 소스. 셀프 호스팅. 내 데이터, 내 인스턴스. |

<br/>

---

<br/>

## 빠른 시작

오픈 소스. 셀프 호스팅. CLItoris 계정 불필요.

```bash
git clone https://github.com/ccivlcid/CLItoris.git
cd CLItoris
cp .env.example .env          # GitHub OAuth 자격증명 추가
pnpm install
pnpm dev
```

**http://localhost:7878**을 열고 GitHub으로 접속하세요.

> **요구사항:** Node.js 18+, pnpm 8+, [GitHub OAuth 앱](https://github.com/settings/developers) (콜백: `http://localhost:3771/api/auth/github/callback`)

<br/>

## FAQ

**GitHub 활동이 어떻게 포스트가 되나요?**
두 가지 방법: (1) GitHub 웹훅 설정 — push, PR 머지, 릴리스가 즉시 자동 포스팅. (2) "GitHub 동기화" 클릭으로 최근 이벤트 수동 임포트.

**AI 키가 필요한가요?**
GitHub 활동 포스트에는 불필요. 직접 AI 변환으로 포스트를 쓰려면 [Ollama](https://ollama.ai)로 무료 로컬 모델을 사용할 수 있습니다 — API 키 불필요.

**어떤 언어로 작성할 수 있나요?**
아무 언어로든. AI가 언어와 관계없이 변환합니다. UI 자체는 영어, 한국어, 중국어, 일본어를 지원합니다.

**트위터/X와 뭐가 다른가요?**
GitHub 활동이 뼈대입니다. 로그인은 GitHub 전용. 소셜 액션은 Git 메타포 (포크, 스타). 터미널 미학. 알고리즘 피드 없음, 광고 없음.

**셀프 호스팅 가능한가요?**
네. 클론, `.env` 설정, `pnpm dev`. SQLite 데이터베이스라 GitHub OAuth 외 외부 서비스 불필요.

<br/>

## 개발

```bash
pnpm dev              # 전체 개발 (클라이언트 + 서버, 워치 모드)
pnpm build            # 전체 패키지 빌드
pnpm test             # 유닛 테스트 (Vitest)
pnpm test:e2e         # E2E 테스트 (Playwright)
pnpm seed             # 샘플 데이터 로드
```

전체 개발 가이드는 [CLAUDE.md](./CLAUDE.md)를 참고하세요.

<br/>

## 기여하기

기여를 환영합니다. [프로젝트 가이드](./CLAUDE.md)와 [코딩 컨벤션](./docs/guides/CONVENTIONS.md)을 먼저 읽어주세요.

<br/>

## 커뮤니티

- [Discord](https://discord.gg/clitoris) — 커뮤니티 참여
- [GitHub Issues](https://github.com/ccivlcid/CLItoris/issues) — 버그 및 기능 요청

<br/>

## 라이선스

MIT

<br/>

---

<p align="center">
  <sub>당신의 코드는 이미 이야기를 하고 있습니다. 목소리를 주세요.</sub>
</p>

<p align="center">
  <strong>>_CLI</strong>toris &nbsp;&middot;&nbsp; terminal.social
</p>
