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

const router = createBrowserRouter([
  { path: '/', element: <GlobalFeedPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/setup', element: <SetupPage /> },
  { path: '/post/:id', element: <PostDetailPage /> },
  // '/@:username' handled via /:atUsername pattern
  { path: '/:atUsername', element: <UserProfilePage /> },
  { path: '/feed/local', element: <LocalFeedPage /> },
  { path: '/explore', element: <ExplorePage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/analyze', element: <AnalyzePage /> },
  { path: '/github', element: <GitHubFeedPage /> },
  { path: '/activity', element: <ActivityFeedPage /> },
  { path: '/search', element: <SearchPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
