import { execSync } from 'node:child_process';
import type { DetectedProvider } from './types.js';

/**
 * Detects locally available LLM runtimes (Ollama).
 * Does NOT check environment variables — API keys are user-provided via settings.
 */
export function detectLocalRuntimes(): DetectedProvider[] {
  const results: DetectedProvider[] = [];

  // Ollama — check if running on localhost
  try {
    const res = execSync('curl -sf http://localhost:11434/api/tags', { stdio: 'pipe', timeout: 2000 });
    if (res) {
      results.push({ provider: 'ollama', source: 'localhost:11434', isAvailable: true });
    }
  } catch {
    // Ollama not running
  }

  return results;
}
