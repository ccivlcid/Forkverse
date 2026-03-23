import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore, type UiLang } from '../../stores/uiStore.js';
import { api } from '../../api/client.js';
import { toastError } from '../../stores/toastStore.js';
import type { ApiResponse } from '@forkverse/shared';

interface LlmProviderRow { provider: string; source: string }
interface LlmEntry { id: string; model: string }

function shortModel(model: string): string {
  return model
    .replace(/^claude-/, '')
    .replace(/-\d{8,}$/, '');
}

const COMMANDS = [
  { to: '/analyze',     cmd: 'analyze' },
  { to: '/new',         cmd: 'post --new' },
  { to: '/feed',        cmd: 'feed --global' },
  { to: '/feed/local',  cmd: 'feed --local' },
  { to: '/explore',     cmd: 'explore' },
  { to: '/leaderboard', cmd: 'rank --board' },
  { to: '/github',      cmd: 'gh --status' },
  { to: '/messages',    cmd: 'msg --inbox' },
  { to: '/activity',    cmd: 'log --activity' },
  { to: '/chat',        cmd: 'chat' },
  { to: '/search',      cmd: 'grep' },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { lang, setLang, t } = useUiStore();
  const [llmEntries, setLlmEntries] = useState<LlmEntry[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    api
      .get<ApiResponse<LlmProviderRow[]>>('/llm/providers')
      .then(async (res) => {
        const apiKeys = res.data.filter((p) => p.source === 'user-settings');
        const entries: LlmEntry[] = [];
        await Promise.all(
          apiKeys.map(async ({ provider }) => {
            try {
              const m = await api.get<ApiResponse<string[]>>(`/llm/models/${provider}`);
              const first = m.data[0];
              if (first) entries.push({ id: provider, model: first });
            } catch { /* */ }
          }),
        );
        if (!cancelled) setLlmEntries(entries);
      })
      .catch(() => {
        if (!cancelled) toastError('Failed to load LLM providers');
      });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-[220px] bg-[var(--bg-cli)] border-r border-[var(--border)]/40 flex-col shrink-0 overflow-y-auto hidden sm:flex font-mono text-[12px]">

      {/* Terminal header */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]/30">
        <span className="text-[var(--text-faint)] text-[10px]">{t('sidebar.terminalBash')}</span>
      </div>

      {/* Command history — navigation */}
      <nav className="flex flex-col py-2">
        {COMMANDS.map(({ to, cmd }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              className={`py-1.5 transition-colors border-l-2 ${
                active
                  ? 'pl-[14px] text-[var(--text)] bg-white/[0.03] border-[var(--accent-green)]'
                  : 'pl-[14px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.04] border-transparent'
              }`}
            >
              <span className={active ? 'text-[var(--accent-green)]' : 'text-[var(--text-faint)]'}>$</span>{' '}
              {cmd}
              {active && <span className="text-[var(--accent-green)] animate-blink ml-0.5">_</span>}
            </Link>
          );
        })}
      </nav>

      {/* LLM providers (info only — used by Analyze) */}
      {isAuthenticated && llmEntries.length > 0 && (
        <div className="border-t border-[var(--border)]/30 py-2">
          <div className="px-4 py-1 text-[var(--text-faint)] text-[10px]">
            {t('sidebar.exportLlm')}
          </div>
          {llmEntries.map(({ id, model }) => (
            <div
              key={id}
              title={`${id} — ${model}`}
              className="py-1 px-4 text-[var(--text-muted)] font-mono text-[11px]"
            >
              ▸ {id}<span className="text-[var(--text-faint)] ml-1">{shortModel(model)}</span>
            </div>
          ))}
        </div>
      )}

      {isAuthenticated && llmEntries.length === 0 && (
        <div className="border-t border-[var(--border)]/30 py-2">
          <Link
            to={user ? `/@${user.username}?tab=api` : '/login'}
            className="block py-1 px-4 text-[var(--text-faint)] hover:text-[var(--accent-green)] transition-colors"
          >
            {t('sidebar.exportLlmKey')}<span className="text-[var(--text-faint)]/50">...</span>
          </Link>
        </div>
      )}

      {/* Bottom — user session */}
      <div className="mt-auto border-t border-[var(--border)]/30 py-3 px-4 space-y-2">
        {isAuthenticated && user ? (
          <>
            <Link
              to={`/@${user.username}`}
              className="text-[var(--accent-amber)] hover:text-amber-300 transition-colors block"
            >
              {user.username}<span className="text-[var(--text-faint)]">@terminal.social</span>
            </Link>
          </>
        ) : (
          <Link
            to="/login"
            className="text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors block"
          >
            {t('sidebar.sshConnect')}
          </Link>
        )}

        {/* Lang */}
        <div className="flex items-center gap-0.5">
          <span className="text-[var(--text-faint)] mr-1">{t('sidebar.lang')}</span>
          {(['en', 'ko', 'zh', 'ja'] as UiLang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-1 py-0.5 text-[10px] transition-colors ${
                lang === l
                  ? 'text-[var(--accent-green)]'
                  : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
