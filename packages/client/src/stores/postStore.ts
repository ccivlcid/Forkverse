import { create } from 'zustand';
import { api, ApiError } from '../api/client.js';
import type { Post, ApiResponse, MediaAttachment } from '@forkverse/shared';

interface AttachedRepo {
  owner: string;
  name: string;
}

interface MediaPreview {
  id: string;
  url: string;
  mimeType: string;
  fileSize: number;
}

interface PostState {
  draft: string;
  selectedLang: string;
  isSubmitting: boolean;
  isUploading: boolean;
  uploadError: string | null;
  attachedRepo: AttachedRepo | null;
  attachedMedia: MediaPreview[];

  setDraft: (text: string) => void;
  setLang: (lang: string) => void;
  attachRepo: (owner: string, name: string) => void;
  removeRepo: () => void;
  uploadMedia: (files: File[]) => Promise<void>;
  removeMedia: (id: string) => void;
  submitPost: (parentId?: string) => Promise<Post | null>;
  resetDraft: () => void;
}

export const usePostStore = create<PostState>((set, get) => ({
  draft: '',
  selectedLang: 'auto',
  isSubmitting: false,
  isUploading: false,
  uploadError: null,
  attachedRepo: null,
  attachedMedia: [],

  setDraft: (text) => set({ draft: text }),
  setLang: (lang) => set({ selectedLang: lang }),
  attachRepo: (owner, name) => set({ attachedRepo: { owner, name } }),
  removeRepo: () => set({ attachedRepo: null }),

  uploadMedia: async (files) => {
    const current = get().attachedMedia;
    if (current.length + files.length > 4) {
      set({ uploadError: 'Maximum 4 files allowed.' });
      return;
    }
    set({ isUploading: true, uploadError: null });
    try {
      const formData = new FormData();
      for (const file of files) formData.append('files', file);
      const res = await api.upload<ApiResponse<MediaAttachment[]>>('/media/upload', formData);
      const newMedia: MediaPreview[] = res.data.map((m) => ({
        id: m.id,
        url: m.url,
        mimeType: m.mimeType,
        fileSize: m.fileSize,
      }));
      set({ attachedMedia: [...get().attachedMedia, ...newMedia], isUploading: false });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Upload failed.';
      set({ isUploading: false, uploadError: msg });
    }
  },

  removeMedia: (id) => {
    set({ attachedMedia: get().attachedMedia.filter((m) => m.id !== id) });
  },

  submitPost: async (parentId?: string) => {
    const { draft, selectedLang, attachedRepo, attachedMedia } = get();
    if (!draft.trim() && attachedMedia.length === 0) return null;

    // Extract mentions and tags from text
    const mentions = [...draft.matchAll(/@([a-zA-Z0-9_]+)/g)].map((m) => m[1]);
    const tags = [...draft.matchAll(/#([a-zA-Z0-9_]+)/g)].map((m) => m[1]);

    set({ isSubmitting: true });
    try {
      const body: Record<string, unknown> = {
        messageRaw: draft,
        lang: selectedLang === 'auto' ? 'en' : selectedLang,
        tags,
        mentions,
      };
      if (parentId) body.parentId = parentId;
      if (attachedRepo) {
        body.repoOwner = attachedRepo.owner;
        body.repoName = attachedRepo.name;
      }
      if (attachedMedia.length > 0) {
        body.mediaIds = attachedMedia.map((m) => m.id);
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
    set({ draft: '', uploadError: null, attachedRepo: null, attachedMedia: [] }),
}));
