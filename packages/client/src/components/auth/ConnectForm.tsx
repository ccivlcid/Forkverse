import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';

interface ConnectFormProps {
  errorFromCallback?: string | null;
}

export default function ConnectForm({ errorFromCallback }: ConnectFormProps) {
  const { connectionStatus, error, initiateGitHubOAuth } = useAuthStore();
  const { t } = useUiStore();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const displayError = errorFromCallback ?? error;
  const isConnecting = isRedirecting || connectionStatus === 'redirecting' || connectionStatus === 'callback';

  // Handle callback state from URL
  useEffect(() => {
    if (connectionStatus === 'callback') {
      setIsRedirecting(true);
    }
  }, [connectionStatus]);

  const handleConnect = () => {
    setIsRedirecting(true);
    initiateGitHubOAuth();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConnect();
    }
  };

  return (
    <div
      data-testid="connect-form"
      role="form"
      aria-label="Connect to CLItoris via GitHub"
      className="w-full max-w-md border border-[var(--border)] bg-[var(--bg-elevated)] p-10"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Logo */}
      <div className="mb-10 text-center">
        <p className="font-mono text-3xl font-bold tracking-tight">
          <span className="text-white/90">{'>'}_</span>
          <span className="text-[var(--accent-green)]">CLI</span>
          <span className="text-white/90">toris</span>
        </p>
        <p className="text-[var(--text-faint)] font-mono text-[11px] mt-2 tracking-wider">terminal.social</p>
      </div>

      {/* SSH prompt */}
      <p className="text-[var(--accent-green)]/70 font-mono text-sm mb-6">{t('auth.connect.ssh')}</p>

      {/* Status / Error */}
      {displayError ? (
        <div role="alert" aria-live="assertive" className="mb-4">
          <p data-testid="login-error" className="text-red-400 font-mono text-sm">
            {displayError}
          </p>
          <p data-testid="login-hint" className="text-yellow-400/70 font-mono text-sm">
            hint: click connect to try again.
          </p>
        </div>
      ) : isConnecting ? (
        <div role="status" aria-live="polite" className="mb-4" data-testid="connection-status">
          <p className="text-gray-400 font-mono text-sm">{t('auth.connect.redirecting')}</p>
          <p className="text-gray-400 font-mono text-sm animate-pulse">{t('auth.connect.waiting')}</p>
        </div>
      ) : (
        <p
          role="status"
          aria-live="polite"
          data-testid="connection-status"
          className="text-gray-400 font-mono text-sm mb-4"
        >
          {t('auth.connect.keyNotFound')}
        </p>
      )}

      {/* Connect button */}
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        aria-label="Connect with GitHub"
        aria-busy={isConnecting}
        aria-disabled={isConnecting}
        className={`w-full border px-4 py-3.5 font-mono text-sm text-center transition-all duration-200 ${
          isConnecting
            ? 'border-[var(--border)] text-[var(--text-faint)] opacity-50 cursor-not-allowed'
            : 'border-[var(--accent-green)]/30 text-[var(--accent-green)] bg-[var(--accent-green)]/[0.06] hover:bg-[var(--accent-green)]/[0.12] hover:border-[var(--accent-green)]/50'
        }`}
      >
        {isConnecting ? t('auth.connect.connecting') : t('auth.connect.button')}
      </button>

      {/* Scope info */}
      {!isConnecting && (
        <div
          data-testid="scope-info"
          className="mt-6"
          aria-label="OAuth permissions: read-only profile access"
        >
          <p className="text-gray-600 text-xs font-mono">{t('auth.connect.scope.label')}</p>
          <p className="text-gray-500 text-xs font-mono">{t('auth.connect.scope.value')}</p>
          <p className="text-gray-500 text-xs font-mono mt-2">{t('auth.connect.info1')}</p>
          <p className="text-gray-500 text-xs font-mono">{t('auth.connect.info2')}</p>
        </div>
      )}
    </div>
  );
}
