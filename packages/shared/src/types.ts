// Forkverse Shared Types

// ============================================
// User
// ============================================
export interface User {
  id: string;
  username: string;
  domain: string | null;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  githubId: string;
  githubUsername: string;
  githubAvatarUrl: string | null;
  githubProfileUrl: string | null;
  githubReposCount: number;
  githubConnectedAt: string;
  createdAt: string;
}

export interface UserProfile extends User {
  followerCount: number;
  followingCount: number;
  postCount: number;
  isFollowing: boolean;
  topLanguages: string[];
}

// ============================================
// Post
// ============================================
export type PostIntent = 'casual' | 'formal' | 'question' | 'announcement' | 'reaction';
export type PostEmotion = 'neutral' | 'happy' | 'surprised' | 'frustrated' | 'excited' | 'sad' | 'angry';

export interface Post {
  id: string;
  userId: string;
  messageRaw: string;
  messageCli: string;
  lang: string;
  tags: string[];
  mentions: string[];
  visibility: 'public' | 'private' | 'unlisted';
  llmModel: LlmModel;
  parentId: string | null;
  forkedFromId: string | null;
  createdAt: string;
  user: PostUser;
  starCount: number;
  replyCount: number;
  forkCount: number;
  isStarred: boolean;
  repoAttachment: RepoAttachment | null;
  media: MediaAttachment[];
  intent: PostIntent;
  emotion: PostEmotion;
  reactions: PostReactions;
  quotedPostId: string | null;
  quotedPost: { id: string; messageRaw: string; messageCli: string; user: PostUser } | null;
  updatedAt: string | null;
}

export interface PostUser {
  username: string;
  domain: string | null;
  displayName: string;
  avatarUrl: string | null;
}

// ============================================
// Media Attachment
// ============================================
export interface MediaAttachment {
  id: string;
  url: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
}

// ============================================
// Repo Attachment
// ============================================
export interface RepoAttachment {
  repoOwner: string;
  repoName: string;
  repoStars: number;
  repoForks: number;
  repoLanguage: string | null;
}

// ============================================
// Analysis
// ============================================
export interface Analysis {
  id: string;
  userId: string;
  repoOwner: string;
  repoName: string;
  outputType: AnalysisOutputType;
  llmModel: string;
  lang: string;
  optionsJson: Record<string, unknown>;
  resultUrl: string | null;
  resultSummary: string | null;
  status: AnalysisStatus;
  durationMs: number | null;
  createdAt: string;
}

export type AnalysisOutputType = 'report' | 'pptx' | 'video';
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AnalysisProgress {
  name: string;
  status: 'pending' | 'active' | 'done' | 'failed';
  detail?: string;
}

export type AnalysisSectionKey = 'summary' | 'techStack' | 'architecture' | 'strengths' | 'risks' | 'improvements' | 'cliView';

export interface AnalysisSections {
  summary: string;
  techStack: string;
  architecture: string;
  strengths: string;
  risks: string;
  improvements: string;
  cliView: string;
}

export interface AnalysisWithSections extends Analysis {
  progress: AnalysisProgress[];
  sections: AnalysisSections | null;
  user: PostUser;
  starCount: number;
  isStarred: boolean;
}

export interface AnalysisStar {
  userId: string;
  analysisId: string;
  createdAt: string;
}

// ============================================
// Collections (Bookmarks)
// ============================================
export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  itemCount: number;
}

// ============================================
// Comparison Analysis
// ============================================
export interface ComparisonResult {
  id: string;
  repoA: string;
  repoB: string;
  llmModel: string;
  lang: string;
  result: {
    summary: string;
    repoAStrengths: string;
    repoBStrengths: string;
    recommendation: string;
  } | null;
  status: string;
  durationMs: number | null;
  createdAt: string;
}

// ============================================
// LLM
// ============================================
/** Model or CLI tool id returned by providers — values come from live APIs, not a fixed enum */
export type LlmModel = string;

export type LlmProvider = 'anthropic' | 'openai' | 'gemini' | 'ollama' | 'openrouter' | 'together' | 'groq' | 'cerebras' | 'api' | 'custom';

export interface TransformRequest {
  message: string;
  lang: string;
  provider: LlmProvider;
  model: string;
  username: string;
  tags?: string[];
  mentions?: string[];
  visibility?: 'public' | 'private' | 'unlisted';
}

export interface TransformResponse {
  messageCli: string;
  model: string;
  tokensUsed: number;
  lang: string;
  tags: string[];
  intent: PostIntent;
  emotion: PostEmotion;
}

export interface TranslateRequest {
  postId: string;
  targetLang: string;
}

export interface TranslateResponse {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  cached: boolean;
}

export interface Translation {
  id: string;
  postId: string;
  lang: string;
  text: string;
  createdAt: string;
}

export interface LocalModel {
  name: string;
  size: string;
  quantization: string;
  provider: string;
}

// ============================================
// Auth
// ============================================
export interface GitHubProfile {
  githubId: string;
  githubUsername: string;
  avatarUrl: string;
  displayName: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
}

export interface SetupRequest {
  username: string;
  displayName?: string;
  bio?: string;
}

// ============================================
// API Response Envelope
// ============================================
export interface ApiResponse<T> {
  data: T;
  meta?: {
    cursor?: string;
    hasMore?: boolean;
    total?: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    status: number;
  };
}

// ============================================
// Session
// ============================================
export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

// ============================================
// Follow / Star
// ============================================
export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Star {
  userId: string;
  postId: string;
  createdAt: string;
}

// ============================================
// Feed / Pagination
// ============================================
export interface FeedParams {
  cursor?: string;
  limit?: number;
  sort?: 'created_at' | 'stars';
  tag?: string;
  model?: LlmModel | 'all';
}

export interface TrendingTag {
  tag: string;
  count: number;
}

export interface TrendingRepo {
  owner: string;
  name: string;
  mentionCount: number;
  topTags: string[];
  stars: number;
  forks: number;
  language: string | null;
}

// ============================================
// Activity Feed
// ============================================
export type ActivityEventType =
  | 'github_push' | 'github_pr_merge' | 'github_pr_open'
  | 'github_release' | 'github_star' | 'github_fork' | 'github_create'
  | 'follow' | 'star_post' | 'fork_post' | 'reply';

export interface ActivityEvent {
  id: string;
  actorId: string;
  actor: PostUser;
  eventType: ActivityEventType;
  targetUserId: string | null;
  targetUser: PostUser | null;
  targetPostId: string | null;
  targetPost: { messageRaw: string; messageCli: string } | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ============================================
// Notifications
// ============================================
export type NotificationType = 'star' | 'reply' | 'follow' | 'mention' | 'fork' | 'reaction' | 'quote';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string;
  actor: PostUser;
  postId: string | null;
  message: string | null;
  read: boolean;
  createdAt: string;
}

// ============================================
// Reactions
// ============================================
export const REACTION_EMOJIS = ['lgtm', 'ship_it', 'fire', 'bug', 'thinking', 'rocket', 'eyes', 'heart'] as const;
export type ReactionEmoji = typeof REACTION_EMOJIS[number];

export const REACTION_DISPLAY: Record<ReactionEmoji, string> = {
  lgtm: 'lgtm',
  ship_it: 'ship',
  fire: 'fire',
  bug: 'bug',
  thinking: 'hmm',
  rocket: 'rocket',
  eyes: 'eyes',
  heart: 'heart',
};

export interface PostReactions {
  counts: Partial<Record<ReactionEmoji, number>>;
  mine: ReactionEmoji[];
}

// ============================================
// Search
// ============================================
export interface SearchResult {
  posts: Post[];
  users: Array<{ username: string; displayName: string; avatarUrl: string | null; githubUsername: string; bio: string | null }>;
  tags: Array<{ tag: string; count: number }>;
}

// ============================================
// Suggested User
// ============================================
export interface SuggestedUser {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  githubUsername: string;
  reason: string;
  topLanguages: string[];
}

// ============================================
// Influence Score
// ============================================
export interface InfluenceBreakdown {
  ghRepos: number;
  ghStars: number;
  ghFollowers: number;
  cliPosts: number;
  cliFollowers: number;
  cliStars: number;
  cliForks: number;
}

export interface InfluenceScore {
  userId: string;
  score: number;
  tier: number;
  tierLabel: string;
  breakdown: InfluenceBreakdown;
  ghTotalStars: number;
  ghFollowers: number;
  calculatedAt: string;
  stale?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  githubUsername: string;
  score: number;
  tier: number;
  tierLabel: string;
}

// ============================================
// Direct Messages
// ============================================
export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  read: boolean;
  createdAt: string;
  sender: PostUser;
}

export interface Conversation {
  otherUser: PostUser & { username: string };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export const INFLUENCE_TIERS = [
  { min: 0,  tier: 1, label: 'guest',       color: '#6b7280' },
  { min: 10, tier: 2, label: 'user',        color: '#d1d5db' },
  { min: 25, tier: 3, label: 'contributor',  color: '#3fb950' },
  { min: 40, tier: 4, label: 'maintainer',   color: '#76e3ea' },
  { min: 60, tier: 5, label: 'admin',        color: '#d29922' },
  { min: 80, tier: 6, label: 'root',         color: '#f85149' },
] as const;
