import type { LlmProviderInterface } from './types.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { OpenAiProvider } from './providers/openai.js';
import { GeminiProvider } from './providers/gemini.js';
import { OllamaProvider } from './providers/ollama.js';
import { CursorProvider } from './providers/cursor.js';
import { GenericApiProvider } from './providers/api.js';
import { ProviderConfigError } from './errors.js';

export interface ProviderCredentials {
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Create an LLM provider using user-supplied credentials.
 * Keys are provided by the user in settings — NOT from environment variables.
 */
export function createProvider(name: string, credentials: ProviderCredentials = {}): LlmProviderInterface {
  switch (name) {
    case 'anthropic': {
      if (!credentials.apiKey) throw new ProviderConfigError('anthropic', 'apiKey');
      return new AnthropicProvider(credentials.apiKey);
    }
    case 'openai': {
      if (!credentials.apiKey) throw new ProviderConfigError('openai', 'apiKey');
      return new OpenAiProvider(credentials.apiKey);
    }
    case 'gemini': {
      if (!credentials.apiKey) throw new ProviderConfigError('gemini', 'apiKey');
      return new GeminiProvider(credentials.apiKey);
    }
    case 'ollama':
      return new OllamaProvider();
    case 'cursor':
      return new CursorProvider();
    case 'api': {
      if (!credentials.baseUrl) throw new ProviderConfigError('api', 'baseUrl');
      return new GenericApiProvider('custom', credentials.baseUrl, credentials.apiKey ?? '');
    }
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}
