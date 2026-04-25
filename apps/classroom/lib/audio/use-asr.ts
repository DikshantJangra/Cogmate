import { useState, useRef, useCallback, useEffect } from 'react';
import { useSettingsStore } from '@/lib/store/settings';
import { createLogger } from '@/lib/logger';
import { getCurrentASRConfig } from './asr-providers';

const log = createLogger('UseASR');

export interface ASRResult {
  text: string;
  isFinal: boolean;
}

export interface UseASROptions {
  onResult?: (result: ASRResult) => void;
  onError?: (error: Error) => void;
  onEnd?: () => void;
  language?: string;
}

export function useASR(options: UseASROptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isFallingBack, setIsFallingBack] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<any>(null);
  const isFallingBackRef = useRef(false);

  const { asrProviderId } = useSettingsStore();

  // ── Server-side ASR (Whisper/Qwen via MediaRecorder) ──────────────────────

  const transcribeChunk = useCallback(async (blob: Blob, forceProvider?: string) => {
    try {
      const config = await getCurrentASRConfig();
      const formData = new FormData();
      formData.append('audio', blob);
      
      // Use forced provider (e.g. on fallback) or the one from settings
      const providerId = forceProvider || config.providerId;
      formData.append('providerId', providerId);
      
      // Only append other config if not forcing (forcing uses server defaults)
      if (config.modelId && !forceProvider) formData.append('modelId', config.modelId);
      if (config.apiKey && !forceProvider) formData.append('apiKey', config.apiKey);
      if (config.baseUrl && !forceProvider) formData.append('baseUrl', config.baseUrl);
      
      formData.append('language', options.language || config.language || 'auto');

      const res = await fetch('/api/transcription', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Transcription failed: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.success && data.text?.trim()) {
        options.onResult?.({
          text: data.text.trim(),
          isFinal: true
        });
      }
    } catch (err) {
      log.error('Chunk transcription failed:', err);
    }
  }, [options]);

  const startHybrid = useCallback(async (forceProvider?: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstart = () => {
        setIsListening(true);
        setError(null);
        // Clear fallback banner once hybrid recording is actually running
        setIsFallingBack(false);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        setIsListening(false);
        isFallingBackRef.current = false;
        setIsFallingBack(false);
        options.onEnd?.();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // Send data chunks every second

      // Transcribe every 4 seconds
      intervalRef.current = setInterval(() => {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = []; // Clear for next chunk
          transcribeChunk(blob, forceProvider);
        }
      }, 4000);

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsFallingBack(false);
      options.onError?.(error);
    }
  }, [options, transcribeChunk]);

  // ── Web Speech API (Native) ────────────────────────────────────────────────

  const startNative = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const err = new Error('Speech recognition not supported in this browser.');
      setError(err);
      options.onError?.(err);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = options.language || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onerror = (event: any) => {
      log.warn('Native ASR error:', event.error);

      // AUTO-FALLBACK: If network error in browser, switch to MediaRecorder + server transcription
      if (event.error === 'network' && !isFallingBackRef.current) {
        log.info('Network error detected in Browser Native ASR. Falling back to server transcription...');
        isFallingBackRef.current = true;
        setIsFallingBack(true);
        recognition.stop();
        startHybrid();
        return;
      }

      const err = new Error(`Native ASR error: ${event.error}`);
      setError(err);
      options.onError?.(err);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (!isFallingBackRef.current) {
        setIsListening(false);
        options.onEnd?.();
      }
    };

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      if (text.trim()) {
        options.onResult?.({
          text: text.trim(),
          isFinal: result.isFinal
        });
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [options, startHybrid]);

  // ── Public API ─────────────────────────────────────────────────────────────

  const start = useCallback(() => {
    isFallingBackRef.current = false;
    setIsFallingBack(false);
    if (asrProviderId === 'browser-native') {
      startNative();
    } else {
      startHybrid();
    }
  }, [asrProviderId, startNative, startHybrid]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsListening(false);
    isFallingBackRef.current = false;
    setIsFallingBack(false);
  }, []);

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    start,
    stop,
    isListening,
    isFallingBack,
    error,
    asrProviderId
  };
}
