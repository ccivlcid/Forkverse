/**
 * Seed script — populates Forkverse DB with mock data for UI preview.
 * Run: pnpm seed
 */
import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../packages/server/forkverse.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Run migrations first ─────────────────────────────────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS _migrations (filename TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))`);
const migrationsDir = path.join(__dirname, '../packages/server/src/db/migrations');
const applied = new Set(db.prepare('SELECT filename FROM _migrations').all().map((r) => (r as { filename: string }).filename));
for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
  if (applied.has(file)) continue;
  db.exec(readFileSync(path.join(migrationsDir, file), 'utf-8'));
  db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(file);
  console.log(`  migration: ${file}`);
}

// ── ID generator ─────────────────────────────────────────────────────────
let seq = 0;
function makeId(): string {
  seq++;
  const ts = Date.now() - seq * 100;
  const ms = BigInt(ts);
  const buf = new Uint8Array(16);
  buf[0] = Number((ms >> 40n) & 0xffn);
  buf[1] = Number((ms >> 32n) & 0xffn);
  buf[2] = Number((ms >> 24n) & 0xffn);
  buf[3] = Number((ms >> 16n) & 0xffn);
  buf[4] = Number((ms >> 8n) & 0xffn);
  buf[5] = Number(ms & 0xffn);
  buf[6] = (seq & 0x0f) | 0x70;
  buf[8] = ((seq >> 4) & 0x3f) | 0x80;
  for (let i = 9; i < 16; i++) buf[i] = (seq * (i + 1)) & 0xff;
  const hex = Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ── Clear existing seed data ─────────────────────────────────────────────
console.log('Clearing existing seed data...');
db.exec(`DELETE FROM stars; DELETE FROM follows; DELETE FROM posts; DELETE FROM users;`);

// ── Users ────────────────────────────────────────────────────────────────
const USERS = [
  {
    username: 'jiyeon_kim',
    domain: 'jiyeon.kim',
    display_name: 'Jiyeon Kim',
    bio: 'Full-stack dev obsessed with terminal UX and vibe coding 🖤',
    github_username: 'torvalds',
    github_avatar_url: 'https://avatars.githubusercontent.com/u/1024025?v=4',
    github_repos_count: 87,
  },
  {
    username: '0xmitsuki',
    domain: 'mitsuki.sh',
    display_name: 'Mitsuki',
    bio: 'Rustacean by day, TypeScript sinner by night',
    github_username: 'gaearon',
    github_avatar_url: 'https://avatars.githubusercontent.com/u/810438?v=4',
    github_repos_count: 124,
  },
  {
    username: 'arjun_io',
    domain: 'arjun.io',
    display_name: 'Arjun Mehta',
    bio: 'Building in public. Fan of open source and strong opinions.',
    github_username: 'sindresorhus',
    github_avatar_url: 'https://avatars.githubusercontent.com/u/170270?v=4',
    github_repos_count: 312,
  },
  {
    username: 'lena_dev',
    domain: 'lena.dev',
    display_name: 'Lena Hoffmann',
    bio: 'Platform engineer · Berlin · she/her',
    github_username: 'addyosmani',
    github_avatar_url: 'https://avatars.githubusercontent.com/u/110953?v=4',
    github_repos_count: 201,
  },
  {
    username: 'hex_cowboy',
    domain: null,
    display_name: 'hex cowboy',
    bio: 'i write code in the dark',
    github_username: 'tj',
    github_avatar_url: 'https://avatars.githubusercontent.com/u/25254?v=4',
    github_repos_count: 448,
  },
];

const userIds: Record<string, string> = {};
for (const [i, u] of USERS.entries()) {
  const uid = makeId();
  userIds[u.username] = uid;
  db.prepare(`
    INSERT INTO users (id, username, domain, display_name, bio, github_id, github_username, github_avatar_url, github_profile_url, github_repos_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uid, u.username, u.domain, u.display_name, u.bio, String(1000 + i), u.github_username, u.github_avatar_url, `https://github.com/${u.github_username}`, u.github_repos_count);
}
console.log(`Created ${USERS.length} users`);

// ── Posts ────────────────────────────────────────────────────────────────
interface PostDef {
  author: string;
  messageRaw: string;
  messageCli: string;
  lang: string;
  tags: string[];
  intent: string;
  emotion: string;
  model: string;
  minsAgo: number;
  repo?: { owner: string; name: string; stars: number; forks: number; lang: string | null };
}

const POSTS: PostDef[] = [
  {
    author: 'jiyeon_kim',
    messageRaw: 'vibe coding하다가 문득 깨달았어 — 우리가 AI에 적응하는 게 아니라 AI가 우리 언어 패턴에 적응하는 거 아닐까? 내가 "좀 더 터미널스럽게"라고 하면 claude가 이해함 ㄷㄷ #vibe-coding #thoughts',
    messageCli: `post --user=@jiyeon_kim \\\n  --lang=ko \\\n  --message="observing AI language convergence pattern" \\\n  --tags=vibe-coding,thoughts \\\n  --intent=casual \\\n  --emotion=surprised \\\n  --visibility=public`,
    lang: 'ko',
    tags: ['vibe-coding', 'thoughts'],
    intent: 'casual',
    emotion: 'surprised',
    model: 'claude-sonnet',
    minsAgo: 5,
  },
  {
    author: '0xmitsuki',
    messageRaw: 'Just rewrote our hot path in Rust. 340ms → 2ms. The Borrow Checker is simultaneously my greatest enemy and best friend. #rust #performance',
    messageCli: `post --user=@0xmitsuki \\\n  --lang=en \\\n  --message="hot path rewrite complete" \\\n  --tags=rust,performance \\\n  --intent=announcement \\\n  --emotion=excited \\\n  --visibility=public`,
    lang: 'en',
    tags: ['rust', 'performance'],
    intent: 'announcement',
    emotion: 'excited',
    model: 'gpt-4o',
    minsAgo: 18,
    repo: { owner: 'rust-lang', name: 'rust', stars: 98200, forks: 12700, lang: 'Rust' },
  },
  {
    author: 'arjun_io',
    messageRaw: 'Hot take: TypeScript\'s `satisfies` operator is the most underrated feature of the last 3 years. Stops you from widening inferred types while still getting inference. Why isn\'t everyone using this? #typescript #devtips',
    messageCli: `post --user=@arjun_io \\\n  --lang=en \\\n  --message="advocating for satisfies operator" \\\n  --tags=typescript,devtips \\\n  --intent=question \\\n  --emotion=frustrated \\\n  --visibility=public`,
    lang: 'en',
    tags: ['typescript', 'devtips'],
    intent: 'question',
    emotion: 'frustrated',
    model: 'claude-sonnet',
    minsAgo: 34,
  },
  {
    author: 'lena_dev',
    messageRaw: 'We shipped zero-downtime deploys for our Postgres cluster today. 6 months of work, 200+ PRs, and way too much coffee. The secret? Logical replication + pgbouncer + very, very careful migration scripts. #postgres #platform #devops',
    messageCli: `post --user=@lena_dev \\\n  --lang=en \\\n  --message="zero-downtime postgres deploys shipped" \\\n  --tags=postgres,platform,devops \\\n  --intent=announcement \\\n  --emotion=happy \\\n  --visibility=public`,
    lang: 'en',
    tags: ['postgres', 'platform', 'devops'],
    intent: 'announcement',
    emotion: 'happy',
    model: 'gemini-2.5-pro',
    minsAgo: 52,
  },
  {
    author: 'hex_cowboy',
    messageRaw: 'stop adding abstractions. your codebase is not a framework. it is a product. ship it.',
    messageCli: `post --user=@hex_cowboy \\\n  --lang=en \\\n  --message="anti-abstraction manifesto" \\\n  --tags=rant \\\n  --intent=reaction \\\n  --emotion=frustrated \\\n  --visibility=public`,
    lang: 'en',
    tags: ['rant'],
    intent: 'reaction',
    emotion: 'frustrated',
    model: 'llama-3',
    minsAgo: 67,
  },
  {
    author: 'jiyeon_kim',
    messageRaw: 'Claude Code로 처음으로 진짜 프로덕션 기능 혼자 구현했다. 무서울 줄 알았는데 오히려 짜릿함. AI pair programming이 이런 거구나. 코드 리뷰 요청하면 진짜 리뷰해줌 ㅋㅋ #claude-code #ai #vibe-coding',
    messageCli: `post --user=@jiyeon_kim \\\n  --lang=ko \\\n  --message="first production feature with claude code" \\\n  --tags=claude-code,ai,vibe-coding \\\n  --intent=casual \\\n  --emotion=excited \\\n  --visibility=public`,
    lang: 'ko',
    tags: ['claude-code', 'ai', 'vibe-coding'],
    intent: 'casual',
    emotion: 'excited',
    model: 'claude-code',
    minsAgo: 89,
  },
  {
    author: '0xmitsuki',
    messageRaw: 'After 2 years of dogmatic "no JavaScript in the backend" stance, I am officially converting. Bun + TypeScript is genuinely fast and the DX is incredible. I was wrong. #bun #typescript #javascript',
    messageCli: `post --user=@0xmitsuki \\\n  --lang=en \\\n  --message="converting to bun + typescript backend" \\\n  --tags=bun,typescript,javascript \\\n  --intent=announcement \\\n  --emotion=surprised \\\n  --visibility=public`,
    lang: 'en',
    tags: ['bun', 'typescript', 'javascript'],
    intent: 'announcement',
    emotion: 'surprised',
    model: 'claude-sonnet',
    minsAgo: 120,
    repo: { owner: 'oven-sh', name: 'bun', stars: 74100, forks: 2800, lang: 'C++' },
  },
  {
    author: 'arjun_io',
    messageRaw: 'Reminder that "move fast and break things" was always terrible advice and the engineers who actually built Meta\'s infrastructure were quietly doing the opposite. The slogan was for VCs, not developers.',
    messageCli: `post --user=@arjun_io \\\n  --lang=en \\\n  --message="debunking move fast and break things" \\\n  --tags=engineering,culture \\\n  --intent=reaction \\\n  --emotion=angry \\\n  --visibility=public`,
    lang: 'en',
    tags: ['engineering', 'culture'],
    intent: 'reaction',
    emotion: 'angry',
    model: 'gpt-4o',
    minsAgo: 145,
  },
  {
    author: 'lena_dev',
    messageRaw: 'Our incident post-mortem template now has a mandatory section: "What did the monitoring NOT tell us?" It\'s been the most valuable addition in 2 years of running this team. Observability gaps are usually where the real problems hide. #sre #observability #postmortem',
    messageCli: `post --user=@lena_dev \\\n  --lang=en \\\n  --message="postmortem template: monitoring gaps section" \\\n  --tags=sre,observability,postmortem \\\n  --intent=formal \\\n  --emotion=neutral \\\n  --visibility=public`,
    lang: 'en',
    tags: ['sre', 'observability', 'postmortem'],
    intent: 'formal',
    emotion: 'neutral',
    model: 'claude-sonnet',
    minsAgo: 180,
  },
  {
    author: 'hex_cowboy',
    messageRaw: 'ok fine i tried cursor. it\'s good. i hate that it\'s good.',
    messageCli: `post --user=@hex_cowboy \\\n  --lang=en \\\n  --message="reluctant cursor endorsement" \\\n  --tags=cursor,ai,tools \\\n  --intent=reaction \\\n  --emotion=surprised \\\n  --visibility=public`,
    lang: 'en',
    tags: ['cursor', 'ai', 'tools'],
    intent: 'reaction',
    emotion: 'surprised',
    model: 'codex',
    minsAgo: 210,
  },
  {
    author: 'arjun_io',
    messageRaw: 'Released v3.0.0 of my open source CLI toolkit. Major rewrite in Go, 10x faster, zero deps. Been dogfooding it for 6 months and it finally feels right. Link in bio. #oss #golang #cli',
    messageCli: `gh release create v3.0.0 --repo=arjun_io/cli-toolkit \\\n  --title="v3.0.0 — Go rewrite" \\\n  --notes="10x faster, zero deps, 6 months of dogfooding"`,
    lang: 'en',
    tags: ['oss', 'golang', 'cli'],
    intent: 'announcement',
    emotion: 'excited',
    model: 'gemini-cli',
    minsAgo: 260,
    repo: { owner: 'cli', name: 'cli', stars: 37200, forks: 5400, lang: 'Go' },
  },
  {
    author: 'jiyeon_kim',
    messageRaw: '오픈소스 첫 PR 머지됐다!! 🎉 vercel/next.js에 아주 작은 문서 수정이지만 그래도 기분은 엄청남. 처음엔 코드 무서워서 못 봤는데 Claude한테 읽어달라고 하니까 되더라고 ㅋㅋ #opensource #nextjs #milestone',
    messageCli: `gh pr merge 71234 --repo=vercel/next.js --squash \\\n  # First OSS contribution merged!`,
    lang: 'ko',
    tags: ['opensource', 'nextjs', 'milestone'],
    intent: 'announcement',
    emotion: 'happy',
    model: 'claude-code',
    minsAgo: 300,
    repo: { owner: 'vercel', name: 'next.js', stars: 128000, forks: 27100, lang: 'TypeScript' },
  },
];

const postIds: string[] = [];
const insertPost = db.prepare(`
  INSERT INTO posts (id, user_id, message_raw, message_cli, lang, tags, mentions, visibility, llm_model, intent, emotion, created_at)
  VALUES (?, ?, ?, ?, ?, ?, '[]', 'public', ?, ?, ?, datetime('now', ? || ' minutes'))
`);
const insertRepo = db.prepare(`
  INSERT OR REPLACE INTO repo_attachments (post_id, repo_owner, repo_name, repo_stars, repo_forks, repo_language)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const p of POSTS) {
  const pid = makeId();
  postIds.push(pid);
  insertPost.run(pid, userIds[p.author], p.messageRaw, p.messageCli, p.lang, JSON.stringify(p.tags), p.model, p.intent, p.emotion, `-${p.minsAgo}`);
  if (p.repo) {
    insertRepo.run(pid, p.repo.owner, p.repo.name, p.repo.stars, p.repo.forks, p.repo.lang);
  }
}
console.log(`Created ${POSTS.length} posts`);

// ── Stars ────────────────────────────────────────────────────────────────
const starPairs: [string, string][] = [
  ['0xmitsuki',  postIds[0]!],
  ['arjun_io',   postIds[0]!],
  ['lena_dev',   postIds[0]!],
  ['hex_cowboy', postIds[0]!],
  ['jiyeon_kim', postIds[1]!],
  ['lena_dev',   postIds[1]!],
  ['hex_cowboy', postIds[1]!],
  ['arjun_io',   postIds[2]!],
  ['0xmitsuki',  postIds[2]!],
  ['jiyeon_kim', postIds[3]!],
  ['arjun_io',   postIds[3]!],
  ['0xmitsuki',  postIds[3]!],
  ['hex_cowboy', postIds[3]!],
  ['jiyeon_kim', postIds[4]!],
  ['0xmitsuki',  postIds[4]!],
  ['arjun_io',   postIds[4]!],
  ['lena_dev',   postIds[4]!],
  ['0xmitsuki',  postIds[5]!],
  ['arjun_io',   postIds[5]!],
  ['arjun_io',   postIds[6]!],
  ['lena_dev',   postIds[6]!],
  ['jiyeon_kim', postIds[7]!],
  ['0xmitsuki',  postIds[7]!],
  ['hex_cowboy', postIds[8]!],
  ['jiyeon_kim', postIds[8]!],
  ['arjun_io',   postIds[9]!],
  ['lena_dev',   postIds[9]!],
  ['jiyeon_kim', postIds[10]!],
  ['0xmitsuki',  postIds[11]!],
  ['lena_dev',   postIds[11]!],
  ['hex_cowboy', postIds[11]!],
];
const insertStar = db.prepare(`INSERT OR IGNORE INTO stars (user_id, post_id) VALUES (?, ?)`);
for (const [username, pid] of starPairs) {
  if (userIds[username] && pid) insertStar.run(userIds[username], pid);
}
console.log(`Created ${starPairs.length} stars`);

// ── Follows ──────────────────────────────────────────────────────────────
const followPairs: [string, string][] = [
  ['jiyeon_kim', '0xmitsuki'],
  ['jiyeon_kim', 'arjun_io'],
  ['jiyeon_kim', 'lena_dev'],
  ['0xmitsuki',  'jiyeon_kim'],
  ['0xmitsuki',  'arjun_io'],
  ['arjun_io',   '0xmitsuki'],
  ['arjun_io',   'lena_dev'],
  ['arjun_io',   'hex_cowboy'],
  ['lena_dev',   'jiyeon_kim'],
  ['lena_dev',   'arjun_io'],
  ['hex_cowboy', 'arjun_io'],
  ['hex_cowboy', '0xmitsuki'],
];
const insertFollow = db.prepare(`INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)`);
for (const [follower, following] of followPairs) {
  if (userIds[follower] && userIds[following]) insertFollow.run(userIds[follower], userIds[following]);
}
console.log(`Created ${followPairs.length} follows`);

// ── Reply ────────────────────────────────────────────────────────────────
const replyId = makeId();
db.prepare(`
  INSERT INTO posts (id, user_id, message_raw, message_cli, lang, tags, mentions, visibility, llm_model, intent, emotion, parent_id, created_at)
  VALUES (?, ?, ?, ?, 'en', '["rust"]', '["0xmitsuki"]', 'public', 'claude-sonnet', 'reaction', 'happy', ?, datetime('now', '-15 minutes'))
`).run(
  replyId,
  userIds['lena_dev'],
  '340ms → 2ms is insane. What was the hot path doing before? Serialization bottleneck?',
  `reply --to=@0xmitsuki --post=${postIds[1]} \\\n  --message="340ms to 2ms is insane — serialization bottleneck?"`,
  postIds[1],
);
console.log(`Created 1 reply`);

db.close();
console.log('\n✓ Seed complete! Run: pnpm dev');
