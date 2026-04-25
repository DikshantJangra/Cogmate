/**
 * Shared model resolution utilities for API routes.
 *
 * Extracts the repeated parseModelString → resolveApiKey → resolveBaseUrl →
 * resolveProxy → getModel boilerplate into a single call.
 */

import type { NextRequest } from 'next/server';
import { getModel, parseModelString, type ModelWithInfo } from '@/lib/ai/providers';
import { resolveApiKey, resolveBaseUrl, resolveProxy } from '@/lib/server/provider-config';
import { validateUrlForSSRF } from '@/lib/server/ssrf-guard';
import { createLogger } from '@/lib/logger';

const log = createLogger('ResolveModel');

export interface ResolvedModel extends ModelWithInfo {
  /** Original model string (e.g. "openai/gpt-4o-mini") */
  modelString: string;
  /** Resolved provider ID (e.g. "openai", "ollama") */
  providerId: string;
  /** Effective API key after server-side fallback resolution */
  apiKey: string;
}

/**
 * Resolve a language model from explicit parameters.
 *
 * Use this when model config comes from the request body.
 */
const GROQ_FALLBACK = 'groq:llama-3.3-70b-versatile';

export async function resolveModel(params: {
  modelString?: string;
  apiKey?: string;
  baseUrl?: string;
  providerType?: string;
  /** When true, skip server-side provider overrides (e.g. Groq fallback). Used by verify-model. */
  isVerifyRequest?: boolean;
}): Promise<ResolvedModel> {
  const rawModelString = params.modelString || process.env.DEFAULT_MODEL || GROQ_FALLBACK;
  // Guard: if modelId portion is empty (e.g. "google:"), fall back to DEFAULT_MODEL then Groq
  let modelString = rawModelString.includes(':') && rawModelString.endsWith(':')
    ? (process.env.DEFAULT_MODEL || GROQ_FALLBACK)
    : rawModelString;

  // Server-side override: use Groq when GROQ_API_KEY is set AND the client
  // hasn't supplied explicit credentials AND this isn't a direct test connection.
  const { providerId: clientProvider } = parseModelString(modelString);
  const hasClientCredentials = !!(params.baseUrl || params.apiKey);
  if (clientProvider === 'google' && process.env.GROQ_API_KEY && !hasClientCredentials && !params.isVerifyRequest) {
    modelString = process.env.DEFAULT_MODEL?.startsWith('groq:') ? process.env.DEFAULT_MODEL : GROQ_FALLBACK;
  }
  const { providerId, modelId } = parseModelString(modelString);

  // SSRF validation applies only to client-supplied base URLs.
  // Server-configured URLs (e.g. OLLAMA_BASE_URL from env/YAML) flow through
  // resolveBaseUrl() and bypass this check — they're trusted by the operator.
  const clientBaseUrl = params.baseUrl || undefined;
  if (clientBaseUrl && process.env.NODE_ENV === 'production') {
    const ssrfError = await validateUrlForSSRF(clientBaseUrl);
    if (ssrfError) {
      throw new Error(ssrfError);
    }
  }

  const apiKey = params.isVerifyRequest
    // For verify: client key takes priority, then server fallback
    ? (params.apiKey || resolveApiKey(providerId, ''))
    : (clientBaseUrl
      ? params.apiKey || ''
      : resolveApiKey(providerId, params.apiKey || ''));
  const baseUrl = params.isVerifyRequest
    ? (clientBaseUrl || resolveBaseUrl(providerId, undefined))
    : (clientBaseUrl ? clientBaseUrl : resolveBaseUrl(providerId, params.baseUrl));

  log.info(`[resolveModel] provider=${providerId} model=${modelId} verify=${!!params.isVerifyRequest} hasKey=${!!apiKey} baseUrl=${baseUrl ?? 'default'}`);

  const proxy = resolveProxy(providerId);
  const { model, modelInfo } = getModel({
    providerId,
    modelId,
    apiKey,
    baseUrl,
    proxy,
    providerType: params.providerType as 'openai' | 'anthropic' | 'google' | undefined,
  });

  return { model, modelInfo, modelString, providerId, apiKey };
}

/**
 * Resolve a language model from standard request headers.
 *
 * Reads: x-model, x-api-key, x-base-url, x-provider-type
 * Note: requiresApiKey is derived server-side from the provider registry,
 * never from client headers, to prevent auth bypass.
 */
export async function resolveModelFromHeaders(req: NextRequest): Promise<ResolvedModel> {
  return resolveModel({
    modelString: req.headers.get('x-model') || undefined,
    apiKey: req.headers.get('x-api-key') || undefined,
    baseUrl: req.headers.get('x-base-url') || undefined,
    providerType: req.headers.get('x-provider-type') || undefined,
  });
}
