import { create } from 'zustand';
import { api } from '../api/client.js';
import type { ApiResponse } from '@forkverse/shared';

export interface ChatAgent {
  id: string;
  name: string;
  endpointUrl: string;
  protocol: string;
  model: string | null;
  systemPrompt: string | null;
  icon: string | null;
}

export interface ChatAgentInput {
  name: string;
  endpointUrl: string;
  protocol: string;
  apiKey?: string | null;
  model?: string | null;
  systemPrompt?: string | null;
  icon?: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatState {
  agents: ChatAgent[];
  activeAgentId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  agentsLoading: boolean;

  fetchAgents: () => Promise<void>;
  addAgent: (agent: ChatAgentInput) => Promise<ChatAgent | null>;
  removeAgent: (id: string) => Promise<void>;
  setActiveAgent: (id: string | null) => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  stopStreaming: () => void;
}

let abortController: AbortController | null = null;
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export const useChatStore = create<ChatState>((set, get) => ({
  agents: [],
  activeAgentId: null,
  messages: [],
  isStreaming: false,
  error: null,
  agentsLoading: false,

  fetchAgents: async () => {
    set({ agentsLoading: true });
    try {
      const res = await api.get<ApiResponse<ChatAgent[]>>('/llm/agents');
      set({ agents: res.data, agentsLoading: false });
      // Auto-select first agent if none selected
      if (!get().activeAgentId && res.data.length > 0) {
        set({ activeAgentId: res.data[0]!.id });
      }
    } catch {
      set({ agentsLoading: false });
    }
  },

  addAgent: async (agent) => {
    try {
      const res = await api.post<ApiResponse<ChatAgent>>('/llm/agents', agent);
      set((s) => ({ agents: [res.data, ...s.agents], activeAgentId: res.data.id }));
      return res.data;
    } catch {
      return null;
    }
  },

  removeAgent: async (id) => {
    try {
      await api.delete(`/llm/agents/${id}`);
      set((s) => ({
        agents: s.agents.filter(a => a.id !== id),
        activeAgentId: s.activeAgentId === id ? (s.agents.find(a => a.id !== id)?.id ?? null) : s.activeAgentId,
        messages: s.activeAgentId === id ? [] : s.messages,
      }));
    } catch { /* */ }
  },

  setActiveAgent: (id) => set({ activeAgentId: id, messages: [], error: null }),

  sendMessage: async (content) => {
    const { activeAgentId, messages } = get();
    if (!activeAgentId || !content.trim()) return;

    const userMsg: ChatMessage = { id: genId(), role: 'user', content };
    const assistantId = genId();
    set((s) => ({
      messages: [...s.messages, userMsg, { id: assistantId, role: 'assistant', content: '' }],
      isStreaming: true,
      error: null,
    }));

    abortController = new AbortController();

    const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${API_BASE}/llm/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agentId: activeAgentId, messages: apiMessages }),
        signal: abortController.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: { message: 'Failed' } })) as { error?: { message?: string } };
        set({ isStreaming: false, error: err.error?.message ?? `Error ${res.status}` });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data) as { text?: string; error?: string };
            if (parsed.error) { set({ error: parsed.error, isStreaming: false }); return; }
            if (parsed.text) {
              set((s) => ({
                messages: s.messages.map(m =>
                  m.id === assistantId ? { ...m, content: m.content + parsed.text } : m
                ),
              }));
            }
          } catch { /* skip */ }
        }
      }
      set({ isStreaming: false });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        set({ isStreaming: false, error: (err as Error).message });
      } else {
        set({ isStreaming: false });
      }
    }
  },

  clearChat: () => { abortController?.abort(); set({ messages: [], error: null, isStreaming: false }); },
  stopStreaming: () => { abortController?.abort(); set({ isStreaming: false }); },
}));
