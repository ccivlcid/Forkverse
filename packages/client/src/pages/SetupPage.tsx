import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout.js';
import { useAuthStore } from '../stores/authStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { api, ApiError } from '../api/client.js';
import type { ApiResponse, User } from '@forkverse/shared';

interface PendingProfile {
  githubUsername: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  publicRepos: number;
}

export default function SetupPage() {
  const navigate = useNavigate();
  const { checkSession } = useAuthStore();
  const { t } = useUiStore();

  const [pending, setPending] = useState<PendingProfile | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Fetch pending profile from server
      try {
        const res = await api.get<ApiResponse<PendingProfile & { alreadySetup?: boolean }>>('/auth/me/pending');
        if (res.data.alreadySetup) {
          navigate('/', { replace: true });
          return;
        }
        setPending(res.data);
        setUsername(res.data.githubUsername.replace(/[^a-zA-Z0-9_-]/g, '_'));
        setDisplayName(res.data.displayName);
        setBio(res.data.bio ?? '');
      } catch {
        // If no pending session, redirect to login
        navigate('/login', { replace: true });
      } finally {
        setPageLoading(false);
      }
    };

    // First check if user is already fully set up
    checkSession().then(() => {
      if (useAuthStore.getState().isAuthenticated) {
        navigate('/', { replace: true });
      } else {
        init();
      }
    });
  }, [checkSession, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post<ApiResponse<User>>('/auth/setup', {
        username: username.trim(),
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      // Update auth store
      useAuthStore.setState({ user: res.data, isAuthenticated: true });
      // Auto-sync GitHub follows in background
      api.post('/github/sync-follows').catch(() => { /* silent */ });
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError(`error: username already taken (409)`);
        } else if (err.status === 400) {
          setError(`error: ${err.message}`);
        } else {
          setError(`error: ${err.message}`);
        }
      } else {
        setError('error: setup failed. please try again.');
      }
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  if (pageLoading) {
    return (
      <AuthLayout>
        <div className="text-[var(--text-muted)] font-mono text-sm animate-pulse">
          $ connecting...
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-8" onKeyDown={handleKeyDown}>
        {/* Title */}
        <p className="text-[var(--text-faint)] text-sm font-mono mb-4">{t('setup.title')}</p>

        {/* GitHub import info */}
        {pending && (
          <div className="mb-6 font-mono text-sm">
            <p className="text-[var(--text-muted)]">{t('setup.imported')}</p>
            <p className="text-[var(--text-muted)] ml-2">{t('setup.avatar')}</p>
            <p className="text-[var(--text-muted)] ml-2">
              {t('setup.name')}{' '}
              <span className="text-amber-400">"{pending.displayName}"</span>
            </p>
            {pending.bio && (
              <p className="text-[var(--text-muted)] ml-2">
                {t('setup.bio')}{' '}
                <span className="text-[var(--text)]">"{pending.bio.slice(0, 40)}{pending.bio.length > 40 ? '…' : ''}"</span>
              </p>
            )}
            <p className="text-[var(--text-muted)] ml-2">
              {t('setup.repos')}{' '}
              <span className="text-[var(--accent-green)]">{pending.publicRepos}</span>{' '}
              {t('setup.repos.public')}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="font-mono text-sm text-[var(--accent-green)] block mb-1">
              {t('setup.username.label')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(null); }}
              placeholder={t('setup.username.placeholder')}
              pattern="[a-zA-Z0-9_-]+"
              minLength={2}
              maxLength={32}
              required
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] font-mono text-sm px-3 py-2 outline-none focus:border-[var(--accent-green)]/50 placeholder:text-[var(--text-faint)]"
            />
            {pending && (
              <p className="text-[var(--text-faint)] font-mono text-xs mt-1">
                {t('setup.username.suggested', { github: pending.githubUsername })}
              </p>
            )}
            {error && (
              <p className="text-red-400 font-mono text-sm mt-1">{error}</p>
            )}
          </div>

          {/* Display name */}
          <div>
            <label className="font-mono text-xs text-[var(--accent-cyan)] block mb-1">
              {t('setup.displayName.label')}
              <span className="text-[var(--text-faint)] ml-2">{t('setup.displayName.hint')}</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={80}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] font-mono text-sm px-3 py-2 outline-none focus:border-[var(--text-muted)]"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="font-mono text-xs text-[var(--accent-cyan)] block mb-1">
              {t('setup.bio.label')}
              <span className="text-[var(--text-faint)] ml-2">{t('setup.bio.hint')}</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={2}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] font-mono text-sm px-3 py-2 outline-none focus:border-[var(--text-muted)] resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !username.trim()}
            className="w-full border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] px-4 py-3 font-mono text-sm text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('setup.submitting') : t('setup.submit')}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
