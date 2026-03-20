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
      aria-label="Connect to terminal.social via GitHub"
      className="w-full max-w-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-8"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Title */}
      <p className="text-gray-600 text-sm font-mono mb-4">{t('auth.connect.title')}</p>

      {/* SSH prompt */}
      <p className="text-green-400 font-mono text-sm mb-4">{t('auth.connect.ssh')}</p>

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
        className={`w-full border px-4 py-3 font-mono text-sm text-left transition-colors ${
          isConnecting
            ? 'border-gray-600 text-gray-500 opacity-40 cursor-not-allowed'
            : 'border-gray-600 text-gray-300 hover:border-green-400 hover:text-green-400'
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
