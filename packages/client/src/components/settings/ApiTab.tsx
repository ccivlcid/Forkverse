import { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { toastError } from '../../stores/toastStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import type { ApiResponse } from '@forkverse/shared';

interface ProviderConfig {
  id: string;
  label: string;
  baseUrl: string;
  keyPlaceholder: string;
  noKey?: boolean;
}

const PROVIDERS: ProviderConfig[] = [
  { id: 'openai',      label: 'OpenAI',      baseUrl: 'https://api.openai.com/v1',                       keyPlaceholder: 'sk-...' },
  { id: 'anthropic',   label: 'Anthropic',   baseUrl: 'https://api.anthropic.com',                        keyPlaceholder: 'sk-ant-...' },
  { id: 'gemini',      label: 'Google AI',   baseUrl: 'https://generativelanguage.googleapis.com/v1beta', keyPlaceholder: 'AIza...' },
  { id: 'ollama',      label: 'Ollama',      baseUrl: 'http://localhost:11434/v1',                        keyPlaceholder: 'ollama', noKey: true },
  { id: 'openrouter',  label: 'OpenRouter',  baseUrl: 'https://openrouter.ai/api/v1',                    keyPlaceholder: 'sk-or-...' },
  { id: 'together',    label: 'Together',    baseUrl: 'https://api.together.xyz/v1',                     keyPlaceholder: 'api key...' },
  { id: 'groq',        label: 'Groq',        baseUrl: 'https://api.groq.com/openai/v1',                  keyPlaceholder: 'gsk_...' },
  { id: 'cerebras',    label: 'Cerebras',    baseUrl: 'https://api.cerebras.ai/v1',                      keyPlaceholder: 'csk-...' },
  { id: 'api',         label: 'Custom',      baseUrl: '',                                                 keyPlaceholder: 'api key...' },
];

const defaultProvider = PROVIDERS[0]!;

interface SavedProvider {
  provider: string;
  label: string | null;
  base_url: string | null;
}

export default function ApiTab({ onToast }: { onToast?: (msg: string) => void }) {
  const { t } = useUiStore();
  const [saved, setSaved] = useState<SavedProvider[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  // Form state
  const [selectedType, setSelectedType] = useState<ProviderConfig>(defaultProvider);
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState(defaultProvider.baseUrl);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSaved = () => {
    api.get<ApiResponse<SavedProvider[]>>('/llm/providers/list')
      .then((res) => setSaved(res.data))
      .catch(() => toastError(t('error.serverError')))
      .finally(() => setLoaded(true));
  };

  useEffect(() => { fetchSaved(); }, []);

  const selectType = (p: ProviderConfig) => {
    setSelectedType(p);
    setBaseUrl(p.baseUrl);
    setName(p.label === 'Custom' ? '' : p.label);
    setApiKey('');
  };

  const handleAdd = async () => {
    if (!apiKey.trim() && !selectedType.noKey) return;
    setSaving(true);
    try {
      await api.post('/llm/keys', {
        provider: selectedType.id,
        apiKey: apiKey.trim() || 'local',
        label: name.trim() || selectedType.label,
        baseUrl: baseUrl.trim() || undefined,
      });
      onToast?.('Provider added');
      setApiKey('');
      setName('');
      fetchSaved();
    } catch {
      toastError('Failed to add provider');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (provider: string) => {
    try {
      await api.delete(`/llm/keys/${provider}`);
      setSaved((prev) => prev.filter((p) => p.provider !== provider));
      setConfirmRemove(null);
      onToast?.('Provider removed');
    } catch {
      toastError('Failed to remove provider');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-muted)] font-mono text-xs">// API PROVIDERS</span>
        <button
          onClick={fetchSaved}
          className="text-[var(--text-faint)] hover:text-[var(--text-muted)] font-mono text-xs border border-[var(--border)] hover:border-[var(--border-hover)] px-2 py-1 transition-colors"
        >
          [↺]
        </button>
      </div>

      <p className="text-[var(--text-muted)] font-sans text-sm leading-relaxed">
        {t('settings.api.description')}
      </p>

      {/* Add Provider Form */}
      <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-5 space-y-4">
        <p className="text-[var(--accent-amber)]/80 font-mono text-[10px] uppercase tracking-widest">
          <span className="text-[var(--accent-amber)]">▌</span> // ADD PROVIDER
        </p>

        {/* Provider type buttons */}
        <div className="space-y-1">
          <p className="text-[var(--text-faint)] font-mono text-[10px]">// type</p>
          <div className="flex flex-wrap gap-1.5">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => selectType(p)}
                className={`px-3 py-1.5 sm:py-1 font-mono text-xs border transition-colors ${
                  selectedType.id === p.id
                    ? 'bg-[var(--accent-amber)]/[0.12] text-[var(--accent-amber)] border-[var(--accent-amber)]/40'
                    : 'text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--border-hover)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1">
          <p className="text-[var(--text-faint)] font-mono text-[10px]">// name</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={selectedType.label}
            className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] font-mono text-sm px-3 py-2 placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-hover)]"
          />
        </div>

        {/* Base URL */}
        <div className="space-y-1">
          <p className="text-[var(--text-faint)] font-mono text-[10px]">// BASE URL</p>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
            className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] font-mono text-sm px-3 py-2 placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-hover)]"
          />
        </div>

        {/* API Key */}
        {!selectedType.noKey && (
          <div className="space-y-1">
            <p className="text-[var(--text-faint)] font-mono text-[10px]">// API KEY</p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={selectedType.keyPlaceholder}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] font-mono text-sm px-3 py-2 placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-hover)]"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleAdd}
            disabled={saving || (!selectedType.noKey && !apiKey.trim())}
            title={!selectedType.noKey && !apiKey.trim() ? 'Enter an API key first' : ''}
            className="bg-[var(--accent-amber)]/80 hover:bg-[var(--accent-amber)] text-[var(--bg-surface)] px-5 py-1.5 font-mono text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? t('settings.api.saving') : t('settings.api.add')}
          </button>
          <button
            onClick={() => { setApiKey(''); setName(''); setBaseUrl(selectedType.baseUrl); }}
            className="text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] hover:border-[var(--border-hover)] px-5 py-1.5 font-mono text-sm transition-colors"
          >
            {t('settings.api.cancel')}
          </button>
        </div>
      </div>

      {/* Saved providers list */}
      {loaded && saved.length > 0 && (
        <div className="border border-[var(--border)] bg-[var(--bg-elevated)] p-5 space-y-3">
          <p className="text-[var(--text-faint)] font-mono text-[10px]">// {t('settings.api.registered')}</p>
          <div className="space-y-2">
            {saved.map((p) => (
              <div key={p.provider} className="flex items-center justify-between font-mono text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-[var(--accent-green)] text-[10px]">●</span>
                  <span className="text-[var(--text)]">{p.label ?? p.provider}</span>
                  {p.base_url && (
                    <span className="text-[var(--text-faint)] text-[10px]">{p.base_url}</span>
                  )}
                </div>
                {confirmRemove === p.provider ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRemove(p.provider)}
                      className="text-[var(--color-error)] text-xs font-bold transition-colors"
                    >
                      {t('settings.api.confirmRemove')}
                    </button>
                    <button
                      onClick={() => setConfirmRemove(null)}
                      className="text-[var(--text-muted)] text-xs transition-colors"
                    >
                      {t('settings.api.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRemove(p.provider)}
                    className="text-[var(--text-faint)] hover:text-[var(--color-error)] text-xs transition-colors"
                  >
                    [× {t('settings.api.remove')}]
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loaded && saved.length === 0 && (
        <p className="text-[var(--text-faint)] font-mono text-xs text-center py-4">
          &gt; {t('settings.api.empty')}
        </p>
      )}
    </div>
  );
}
