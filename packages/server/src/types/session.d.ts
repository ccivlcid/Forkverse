import 'express-session';
import type { GitHubProfile } from '@forkverse/shared';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    pendingGithubProfile?: GitHubProfile & { accessToken?: string };
    oauthState?: string;
  }
}
