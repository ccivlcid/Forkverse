import { Component, type ReactNode } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import GlobalFeedPage from './pages/GlobalFeedPage.js';
import LoginPage from './pages/LoginPage.js';
import SetupPage from './pages/SetupPage.js';
import PostDetailPage from './pages/PostDetailPage.js';
import UserProfilePage from './pages/UserProfilePage.js';
import LocalFeedPage from './pages/LocalFeedPage.js';
import ExplorePage from './pages/ExplorePage.js';
import SettingsPage from './pages/SettingsPage.js';
import AnalyzePage from './pages/AnalyzePage.js';
import GitHubFeedPage from './pages/GitHubFeedPage.js';
import ActivityFeedPage from './pages/ActivityFeedPage.js';
import SearchPage from './pages/SearchPage.js';
import LeaderboardPage from './pages/LeaderboardPage.js';
import MessagesPage from './pages/MessagesPage.js';
import CreatePostPage from './pages/CreatePostPage.js';
import ChatPage from './pages/ChatPage.js';
import AnalysisResultPage from './pages/AnalysisResultPage.js';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center p-8">
          <div className="font-mono text-center max-w-md">
            <div className="font-mono text-xl font-bold mb-4">
              <span className="text-[#3fb950]">⑂</span>
              <span className="text-white">Fork</span>
              <span className="text-[#3fb950]">verse</span>
            </div>
            <div className="text-[var(--accent-red,#f87171)] text-lg mb-2">$ error --fatal</div>
            <div className="text-[var(--text-muted)] text-sm mb-6">
              Something went wrong. The process has crashed.
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
              className="font-mono text-sm text-[var(--accent-green)] hover:text-green-300 transition-colors"
            >
              $ restart --force
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/feed" replace /> },
  { path: '/feed', element: <GlobalFeedPage /> },
  { path: '/new', element: <CreatePostPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/setup', element: <SetupPage /> },
  { path: '/post/:id', element: <PostDetailPage /> },
  { path: '/feed/local', element: <LocalFeedPage /> },
  { path: '/explore', element: <ExplorePage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/analyze', element: <AnalyzePage /> },
  { path: '/analysis/:id', element: <AnalysisResultPage /> },
  { path: '/github', element: <GitHubFeedPage /> },
  { path: '/activity', element: <ActivityFeedPage /> },
  { path: '/search', element: <SearchPage /> },
  { path: '/leaderboard', element: <LeaderboardPage /> },
  { path: '/chat', element: <ChatPage /> },
  { path: '/messages', element: <MessagesPage /> },
  { path: '/messages/:username', element: <MessagesPage /> },
  // Dynamic /:atUsername must be LAST — catches /@username paths
  { path: '/:atUsername', element: <UserProfilePage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
