import 'express-session';
import type { GitHubProfile } from '@clitoris/shared';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    pendingGithubProfile?: GitHubProfile & { accessToken?: string };
    oauthState?: string;
  }
}
