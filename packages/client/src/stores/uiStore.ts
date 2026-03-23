import { create } from 'zustand';
import en from '../i18n/en.js';
import ko from '../i18n/ko.js';
import zh from '../i18n/zh.js';
import ja from '../i18n/ja.js';

export type UiLang = 'en' | 'ko' | 'zh' | 'ja';

const LANG_STORAGE_KEY = 'forkverse:ui-lang';
const VALID_LANGS: UiLang[] = ['en', 'ko', 'zh', 'ja'];

function loadLang(): UiLang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && (VALID_LANGS as string[]).includes(stored)) return stored as UiLang;
  } catch { /* ignore */ }
  return 'en';
}

const translations: Record<UiLang, Record<string, string>> = { en, ko, zh, ja };

interface UiState {
  lang: UiLang;
  t: (key: string, vars?: Record<string, string>) => string;
  setLang: (lang: UiLang) => void;
}

function translate(lang: UiLang, key: string, vars?: Record<string, string>): string {
  const dict = translations[lang];
  let str = dict[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}

export const useUiStore = create<UiState>((set, get) => ({
  lang: loadLang(),
  t: (key, vars) => translate(get().lang, key, vars),
  setLang: (lang) => {
    try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch { /* ignore */ }
    set({ lang });
  },
}));
