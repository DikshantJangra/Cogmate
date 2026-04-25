import { useSettingsStore } from '@/lib/store/settings';
import { PROVIDERS } from '@/lib/ai/providers';
import type { ProviderId } from '@/lib/types/provider';

/**
 * Get current model configuration from settings store
 */
export function getCurrentModelConfig() {
  const { providerId, modelId, providersConfig } = useSettingsStore.getState();
  const modelString = `${providerId}:${modelId}`;

  const providerConfig = providersConfig[providerId];
  // Use stored baseUrl if set, otherwise fall back to the provider's defaultBaseUrl
  const defaultBaseUrl = PROVIDERS[providerId as ProviderId]?.defaultBaseUrl || '';
  const baseUrl = providerConfig?.baseUrl || defaultBaseUrl;

  return {
    providerId,
    modelId,
    modelString,
    apiKey: providerConfig?.apiKey || '',
    baseUrl,
    providerType: providerConfig?.type,
    requiresApiKey: providerConfig?.requiresApiKey,
    isServerConfigured: providerConfig?.isServerConfigured,
  };
}
