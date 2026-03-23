import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { api, ApiError } from '../../api/client.js';
import type { ApiResponse, User } from '@forkverse/shared';

function Field({
  flag, value, onChange, placeholder, type = 'text',
}: {
  flag: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[var(--text-muted)] font-mono text-xs">$ set {flag}=</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] font-mono text-sm px-3 py-2 placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--text-muted)]"
      />
    </div>
  );
}

export default function ProfileTab({ onToast }: { onToast: (msg: string) => void }) {
  const { user, updateProfile, logout } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [domain, setDomain] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? '');
      setDomain(user.domain ?? '');
      setBio(user.bio ?? '');
      setAvatarUrl(user.avatarUrl ?? '');
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ displayName, bio });
      await api.put<ApiResponse<User>>('/auth/me', {
        displayName, domain: domain || null, bio: bio || null, avatarUrl: avatarUrl || null,
      });
      onToast('Settings updated');
    } catch (err) {
      onToast(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/auth/me');
      await logout();
      window.location.href = '/';
    } catch (err) {
      onToast(err instanceof ApiError ? err.message : 'Delete failed');
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Profile fields */}
      <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-6 space-y-4">
        <p className="text-[var(--text-faint)] text-xs font-mono">// profile</p>
        <Field flag="--display-name" value={displayName} onChange={setDisplayName} placeholder={user.displayName} />
        <Field flag="--domain" value={domain} onChange={setDomain} placeholder="yourdomain.dev" />
        <Field flag="--bio" value={bio} onChange={setBio} placeholder="Write something about yourself..." />
        <Field flag="--avatar-url" value={avatarUrl} onChange={setAvatarUrl} placeholder="https://..." type="url" />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/30 px-4 py-1.5 font-mono text-sm hover:bg-[var(--accent-green)]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? '$ applying...' : '[Apply changes]'}
        </button>
      </div>

      {/* Danger zone — 3-step confirmation */}
      <div className="border border-red-900/40 bg-[var(--bg-elevated)] p-6 space-y-3">
        <p className="text-[var(--text-faint)] text-xs font-mono">// danger</p>
        <p className="text-[var(--text-muted)] font-mono text-sm">$ delete --account</p>
        <p className="text-[var(--text-muted)] font-sans text-sm">
          This action is irreversible. All posts, stars, and followers will be permanently deleted.
        </p>

        {deleteStep === 0 && (
          <button
            onClick={() => setDeleteStep(1)}
            className="text-[var(--color-error)]/60 hover:text-[var(--color-error)] border border-[var(--color-error)]/30 px-4 py-1.5 font-mono text-sm hover:border-[var(--color-error)]/60 transition-colors"
          >
            $ delete --confirm
          </button>
        )}

        {deleteStep === 1 && (
          <div className="space-y-3 border border-[var(--color-error)]/20 p-4">
            <p className="text-[var(--color-error)] font-mono text-sm">
              Type <span className="font-bold">delete {user.username}</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={`delete ${user.username}`}
              className="w-full bg-[var(--bg-input)] border border-[var(--color-error)]/30 text-[var(--text)] font-mono text-sm px-3 py-2 placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--color-error)]/60"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteStep(2)}
                disabled={deleteConfirmText !== `delete ${user.username}`}
                className="bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/30 px-4 py-1.5 font-mono text-sm hover:bg-[var(--color-error)]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                confirm
              </button>
              <button
                onClick={() => { setDeleteStep(0); setDeleteConfirmText(''); }}
                className="text-[var(--text-muted)] hover:text-[var(--text)] font-mono text-sm transition-colors"
              >
                cancel
              </button>
            </div>
          </div>
        )}

        {deleteStep === 2 && (
          <div className="flex items-center gap-3 border border-[var(--color-error)]/40 bg-[var(--color-error)]/5 p-4">
            <span className="text-[var(--color-error)] font-mono text-sm font-bold">Final step — this cannot be undone.</span>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-[var(--color-error)] text-white px-4 py-1.5 font-mono text-sm hover:bg-red-500 disabled:opacity-50 transition-colors"
            >
              {isDeleting ? 'deleting...' : 'DELETE ACCOUNT'}
            </button>
            <button
              onClick={() => { setDeleteStep(0); setDeleteConfirmText(''); }}
              className="text-[var(--text-muted)] hover:text-[var(--text)] font-mono text-sm transition-colors"
            >
              cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
