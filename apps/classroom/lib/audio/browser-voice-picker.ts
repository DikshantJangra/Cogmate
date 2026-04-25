/**
 * Browser Voice Picker
 *
 * Selects the best available browser-native TTS voice based on quality
 * heuristics. Prefers premium/natural voices over robotic defaults.
 *
 * Shared across: PlaybackEngine, browser-tts-preview, use-browser-tts.
 */

const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g;
const CJK_LANG_THRESHOLD = 0.3;

/**
 * Premium voice name patterns ranked by quality.
 * Higher index = higher quality.
 */
const QUALITY_KEYWORDS: readonly string[] = [
  // Tier 1: basic enhanced
  'enhanced',
  'premium',
  // Tier 2: platform defaults that sound decent
  'samantha', // macOS
  'karen',    // macOS
  'daniel',   // macOS
  'tessa',    // macOS
  'moira',    // macOS
  'rishi',    // macOS
  'fiona',    // macOS
  // Tier 3: Google high-quality voices (Chrome)
  'google',
  // Tier 4: Microsoft neural voices (Edge)
  'microsoft',
  'natural',
  'online',
];

/** Score a voice — higher = better quality */
function scoreVoice(voice: SpeechSynthesisVoice): number {
  let score = 0;
  const nameLower = voice.name.toLowerCase();
  const uriLower = voice.voiceURI.toLowerCase();

  // Match quality keywords
  for (let i = 0; i < QUALITY_KEYWORDS.length; i++) {
    if (nameLower.includes(QUALITY_KEYWORDS[i]) || uriLower.includes(QUALITY_KEYWORDS[i])) {
      score += (i + 1) * 10; // higher-indexed keywords = better
    }
  }

  // Penalize voices with "compact" or "espeak" (robotic)
  if (nameLower.includes('compact') || nameLower.includes('espeak')) {
    score -= 100;
  }

  // Slight preference for local voices (lower latency)
  if (voice.localService) {
    score += 5;
  }

  return score;
}

/**
 * Detect language from text content.
 * Returns 'zh-CN' for CJK-heavy text, 'en-US' otherwise.
 */
export function detectLangFromText(text: string): string {
  if (text.length === 0) return 'en-US';
  const cjkCount = (text.match(CJK_REGEX) || []).length;
  return cjkCount / text.length > CJK_LANG_THRESHOLD ? 'zh-CN' : 'en-US';
}

/**
 * Pick the best voice for a given language from available voices.
 * Filters by language prefix match, then ranks by quality score.
 *
 * @param voices - All available SpeechSynthesisVoice objects
 * @param lang - Target language code (e.g. 'en-US', 'zh-CN')
 * @returns Best voice or null if no voices match
 */
export function pickBestVoiceForLang(
  voices: SpeechSynthesisVoice[],
  lang: string,
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const langPrefix = lang.split('-')[0].toLowerCase(); // 'en', 'zh', etc.

  // Filter voices matching the language
  const langVoices = voices.filter(
    (v) => v.lang.toLowerCase().startsWith(langPrefix),
  );

  // If no language-specific voices, fall back to all voices
  const candidates = langVoices.length > 0 ? langVoices : voices;

  // Sort by score descending
  const sorted = [...candidates].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return sorted[0] || null;
}

/**
 * Pick the best browser voice for given text.
 * Combines language detection + quality ranking.
 *
 * @param voices - Available SpeechSynthesisVoice objects
 * @param text - Text to speak (used for language detection)
 * @returns { voice, lang } — best voice + detected language
 */
export function pickBestBrowserVoice(
  voices: SpeechSynthesisVoice[],
  text: string,
): { voice: SpeechSynthesisVoice | null; lang: string } {
  const lang = detectLangFromText(text);
  const voice = pickBestVoiceForLang(voices, lang);
  return { voice, lang: voice?.lang || lang };
}
