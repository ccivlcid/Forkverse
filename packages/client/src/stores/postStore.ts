import { create } from 'zustand';
import { api, ApiError } from '../api/client.js';
import type { Post, ApiResponse, LlmModel } from '@clitoris/shared';

interface AttachedRepo {
  owner: string;
  name: string;
}

interface PostState {
  draft: string;
  cliPreview: string | null;
  selectedModel: LlmModel;
  selectedLang: string;
  isTransforming: boolean;
  isSubmitting: boolean;
  transformError: string | null;
  attachedRepo: AttachedRepo | null;
  transformedIntent: string | null;
  transformedEmotion: string | null;
  transformedTags: string[] | null;
  transformedLang: string | null;

  setDraft: (text: string) => void;
  setLang: (lang: string) => void;
  selectModel: (model: string) => void;
  attachRepo: (owner: string, name: string) => void;
  removeRepo: () => void;
  transformToCli: () => Promise<void>;
  submitPost: () => Promise<Post | null>;
  resetDraft: () => void;
}


interface TransformResult {
  messageCli: string;
  model: string;
  tokensUsed: number;
  lang?: string;
  tags?: string[];
  intent?: string;
  emotion?: string;
}

export const usePostStore = create<PostState>((set, get) => ({
  draft: '',
  cliPreview: null,
  selectedModel: '',
  selectedLang: 'auto',
  isTransforming: false,
  isSubmitting: false,
  transformError: null,
  attachedRepo: null,
  transformedIntent: null,
  transformedEmotion: null,
  transformedTags: null,
  transformedLang: null,

  setDraft: (text) => set({ draft: text, cliPreview: null }),
  setLang: (lang) => set({ selectedLang: lang }),
  selectModel: (model) => set({ selectedModel: model }),
  attachRepo: (owner, name) => set({ attachedRepo: { owner, name } }),
  removeRepo: () => set({ attachedRepo: null }),

  transformToCli: async () => {
    const { draft, selectedModel, selectedLang } = get();
    if (!draft.trim()) return;
    if (!selectedModel.trim()) {
      set({ transformError: 'Select a model (sidebar or Settings → API).' });
      return;
    }

    set({ isTransforming: true, transformError: null });
    try {
      const res = await api.post<ApiResponse<TransformResult>>('/llm/transform', {
        message: draft,
        model: selectedModel,
        lang: selectedLang === 'auto' ? 'en' : selectedLang,
      });
      set({
        cliPreview: res.data.messageCli,
        isTransforming: false,
        transformedIntent: res.data.intent ?? null,
        transformedEmotion: res.data.emotion ?? null,
        transformedTags: res.data.tags ?? null,
        transformedLang: res.data.lang ?? null,
      });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Transform failed.';
      set({ isTransforming: false, transformError: msg });
    }
  },

  submitPost: async () => {
    const { draft, cliPreview, selectedModel, selectedLang, attachedRepo } = get();
    if (!draft.trim()) return null;
    if (!selectedModel.trim()) return null;

    let cli = cliPreview;
    if (!cli) {
      await get().transformToCli();
      const s = get();
      cli = s.cliPreview;
      if (!cli) return null;
    }

    set({ isSubmitting: true });
    try {
      const finalState = get();
      const body: Record<string, unknown> = {
        messageRaw: draft,
        messageCli: cli,
        lang: finalState.transformedLang ?? (selectedLang === 'auto' ? 'en' : selectedLang),
        llmModel: selectedModel,
        tags: finalState.transformedTags ?? [],
        intent: finalState.transformedIntent ?? 'casual',
        emotion: finalState.transformedEmotion ?? 'neutral',
      };
      if (attachedRepo) {
        body.repoOwner = attachedRepo.owner;
        body.repoName = attachedRepo.name;
      }
      const res = await api.post<ApiResponse<Post>>('/posts', body);
      set({ isSubmitting: false });
      get().resetDraft();
      return res.data;
    } catch {
      set({ isSubmitting: false });
      return null;
    }
  },

  resetDraft: () =>
    set({ draft: '', cliPreview: null, transformError: null, attachedRepo: null,
      transformedIntent: null, transformedEmotion: null, transformedTags: null, transformedLang: null }),
}));
