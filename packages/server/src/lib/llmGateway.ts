/**
 * LLM Gateway — centralized LLM call routing with logging.
 * Wraps @forkverse/llm providers with cost/latency tracking.
 *
 * MVP: Logs to pino. Production: writes to llm_requests table + metrics.
 */
import type { Logger } from 'pino';
import { createProvider } from '@forkverse/llm';

interface GatewayRequest {
  provider: string;
  model: string;
  credentials: { apiKey?: string; baseUrl?: string };
  message: string;
  sourceLang?: string;
  targetLang?: string;
  intent?: string;
  emotion?: string;
}

interface GatewayResponse {
  text: string;
  latencyMs: number;
  provider: string;
  model: string;
}

export function createLlmGateway(logger: Logger) {
  return {
    async translate(req: GatewayRequest): Promise<GatewayResponse> {
      const start = Date.now();
      const { provider: providerName, model, credentials, message, sourceLang, targetLang, intent, emotion } = req;

      try {
        const provider = createProvider(providerName, credentials);
        const text = await provider.translate({
          message,
          sourceLang: sourceLang ?? 'en',
          targetLang: targetLang ?? 'en',
          intent: intent ?? 'formal',
          emotion: emotion ?? 'neutral',
          model,
        });

        const latencyMs = Date.now() - start;

        logger.info({
          llm: { provider: providerName, model, latencyMs, promptLen: message.length, responseLen: text.length },
        }, 'LLM request completed');

        return { text, latencyMs, provider: providerName, model };
      } catch (err) {
        const latencyMs = Date.now() - start;

        logger.error({
          llm: { provider: providerName, model, latencyMs, error: err instanceof Error ? err.message : 'unknown' },
        }, 'LLM request failed');

        throw err;
      }
    },
  };
}
