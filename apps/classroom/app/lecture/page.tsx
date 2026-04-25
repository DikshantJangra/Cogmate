'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic, MicOff, RotateCcw, Radio, Brain, Tag, AlertTriangle,
  ChevronDown, ChevronUp, Loader2, Wifi, WifiOff, ArrowLeft,
  Send, Download, GraduationCap, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import { useASR } from '@/lib/audio/use-asr';
import { getCurrentModelConfig } from '@/lib/utils/model-config';

const log = createLogger('LiveLecture');

interface LessonSection {
  title: string;
  gagne_event: string;
  bloom_level: string;
  content: string;
}

interface TranscriptChunk {
  text: string;
  timestamp: string | null;
}

interface LectureState {
  transcript: string[];
  outline: LessonSection[];
  tags: string[];
  confusion: string[];
  eval_score: number;
  topic: string;
  final_summary?: string;
}

const WS_URL = process.env.NEXT_PUBLIC_COGMATE_WS_URL ?? 'ws://127.0.0.1:8000/ws/ui';
const API_URL = process.env.NEXT_PUBLIC_COGMATE_API_URL ?? 'http://127.0.0.1:8000';

const BLOOM_COLORS: Record<string, string> = {
  Remember: 'bg-slate-100 text-slate-600',
  Understand: 'bg-blue-50 text-blue-600',
  Apply: 'bg-teal-50 text-teal-600',
  Analyze: 'bg-violet-50 text-violet-600',
  Evaluate: 'bg-amber-50 text-amber-600',
  Create: 'bg-rose-50 text-rose-600',
};

export default function LiveLecturePage() {
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [connected, setConnected] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [chunks, setChunks] = useState<TranscriptChunk[]>([]);
  const [interimText, setInterimText] = useState('');
  const [state, setState] = useState<LectureState>({
    transcript: [], outline: [], tags: [], confusion: [], eval_score: 1, topic: 'Live Lecture',
  });
  const [topic, setTopic] = useState('Live Lecture');
  const [outlineOpen, setOutlineOpen] = useState(true);

  // STT hook
  const { start: startSTT, stop: stopSTT, isListening: isRecording, isFallingBack, asrProviderId, isHybrid } = useASR({
    onResult: (result) => {
      if (result.isFinal) {
        setInterimText('');
        if (result.text.trim()) {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const modelConfig = getCurrentModelConfig();
            wsRef.current.send(JSON.stringify({
              type: 'transcript_chunk',
              text: result.text.trim(),
              timestamp: new Date().toISOString(),
              model_config: modelConfig,
            }));
          }
        }
      } else {
        setInterimText(result.text);
      }
    },
    onError: (err) => {
      log.warn('STT Error:', err.message);
      setSttError(err.message);
    }
  });

  const startRecording = useCallback(() => {
    setSttError(null);
    startSTT();
  }, [startSTT]);

  const [sttError, setSttError] = useState<string | null>(null);

  const toggleRecording = () => {
    if (isRecording) stopSTT();
    else {
      startRecording();
    }
  };

  const handleSummarize = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const modelConfig = getCurrentModelConfig();
      wsRef.current.send(JSON.stringify({
        type: 'summarize',
        model_config: modelConfig,
      }));
      setProcessing(true);
    }
  };

  // Manual inject
  const [injectText, setInjectText] = useState('');
  const [injecting, setInjecting] = useState(false);

  // ── WebSocket ──────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'transcript_chunk') {
          setChunks((prev) => [...prev, { text: msg.text, timestamp: msg.timestamp }]);
          setProcessing(true);
        } else if (msg.type === 'snapshot') {
          setState({
            transcript: msg.transcript ?? [],
            outline: msg.outline ?? [],
            tags: msg.tags ?? [],
            confusion: msg.confusion ?? [],
            eval_score: msg.eval_score ?? 1,
            topic: msg.topic ?? 'Live Lecture',
            final_summary: msg.final_summary,
          });
          setProcessing(false);
        } else if (msg.type === 'error') {
          setProcessing(false);
        }
      } catch { /* ignore malformed */ }
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chunks]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const sendReset = () => {
    wsRef.current?.send(JSON.stringify({ type: 'reset' }));
    setChunks([]);
    setSttError(null);
    setState({ transcript: [], outline: [], tags: [], confusion: [], eval_score: 1, topic });
  };

  const sendTopicChange = (t: string) => {
    const modelConfig = getCurrentModelConfig();
    wsRef.current?.send(JSON.stringify({ 
      type: 'set_topic', 
      topic: t,
      model_config: modelConfig,
    }));
  };

  const handleInject = async () => {
    if (!injectText.trim()) return;
    setInjecting(true);
    try {
      await fetch(`${API_URL}/api/lecture/inject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: injectText.trim(), topic }),
      });
      setInjectText('');
    } finally {
      setInjecting(false);
    }
  };

  const handleExport = () => {
    const lines: string[] = [
      `# ${state.topic || topic}`,
      `*Clarity Score: ${Math.round(state.eval_score * 100)}%*`,
      '',
    ];

    if (state.tags.length > 0) {
      lines.push('## Key Concepts');
      lines.push(state.tags.map((t) => `- ${t}`).join('\n'));
      lines.push('');
    }

    if (state.confusion.length > 0) {
      lines.push('## Confusion Points');
      lines.push(state.confusion.map((c) => `- ${c}`).join('\n'));
      lines.push('');
    }

    if (state.outline.length > 0) {
      lines.push('## Lesson Outline');
      state.outline.forEach((s, i) => {
        lines.push(`### ${i + 1}. ${s.title}`);
        lines.push(`*${s.gagne_event}${s.bloom_level ? ` · ${s.bloom_level}` : ''}*`);
        lines.push(s.content);
        lines.push('');
      });
    }

    if (chunks.length > 0) {
      lines.push('## Transcript');
      chunks.forEach((c) => {
        const ts = c.timestamp
          ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : '';
        lines.push(`${ts ? `[${ts}] ` : ''}${c.text}`);
      });
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(state.topic || topic).replace(/\s+/g, '-').toLowerCase()}-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateCourse = () => {
    if (chunks.length === 0) return;

    const fullTranscript = chunks.map((c) => c.text).join('\n');
    const summaryHint = state.final_summary ? `\n\nLecture Summary:\n${state.final_summary}` : '';
    
    const generationSession = {
      requirements: {
        requirement: `Build a course based on this live lecture transcript for topic "${state.topic || topic}":\n\n${fullTranscript}${summaryHint}`,
        webSearch: false,
        interactiveMode: false,
      },
      // Pass existing outline as a hint if it exists
      sceneOutlines: state.outline.length > 0 ? state.outline.map(s => ({
        id: `hint_${Math.random().toString(36).slice(2, 9)}`,
        type: 'slide',
        title: s.title,
        description: s.content,
        keyPoints: [],
        order: 0 // Will be re-ordered
      })) : undefined
    };

    sessionStorage.setItem('generationSession', JSON.stringify(generationSession));
    router.push('/generation-preview');
  };

  const evalColor = state.eval_score >= 0.8
    ? 'text-emerald-600' : state.eval_score >= 0.6
    ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden">

      {/* ── Header ── */}
      <header className="h-12 shrink-0 flex items-center justify-between px-5 bg-white border-b border-slate-100 z-10">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push('/')}
            className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Back to home"
          >
            <ArrowLeft className="size-3.5" />
          </button>
          <div className="size-6 rounded-lg bg-teal-600 flex items-center justify-center">
            <GraduationCap className="size-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-800">Cogmate</span>
          <div className="w-px h-3 bg-slate-200 mx-0.5" />
          <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
            <Radio className="size-3 text-teal-500" />
            Live Lecture
          </div>
          {processing && (
            <span className="flex items-center gap-1 text-[10px] text-teal-500 font-medium">
              <Loader2 className="size-2.5 animate-spin" /> Analyzing…
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onBlur={() => sendTopicChange(topic)}
            onKeyDown={(e) => e.key === 'Enter' && sendTopicChange(topic)}
            className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 w-44 outline-none focus:border-teal-300"
            placeholder="Lecture topic…"
          />

          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium',
            connected ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
          )}>
            {connected ? <Wifi className="size-2.5" /> : <WifiOff className="size-2.5" />}
            {connected ? 'Connected' : 'Reconnecting…'}
          </div>

          {(chunks.length > 0 || state.outline.length > 0) && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExport}
                className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Export notes as Markdown"
              >
                <Download className="size-3.5" />
              </button>
              <button
                onClick={handleGenerateCourse}
                className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors text-[10px] font-semibold border border-teal-100"
                title="Generate a full classroom from this lecture"
              >
                <Sparkles className="size-3" />
                Generate Classroom
              </button>
            </div>
          )}

          <button
            onClick={sendReset}
            className="size-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Reset session"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left: Transcript Feed ── */}
        <div className="w-[42%] flex flex-col border-r border-slate-100 bg-white">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
            <Mic className={cn("size-3", isRecording ? "text-red-500 animate-pulse" : "text-slate-400")} />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Transcript</span>
            <span className="text-[9px] text-slate-400 font-normal lowercase tracking-normal bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
              via {isHybrid ? 'server' : asrProviderId === 'browser-native' ? 'browser' : 'server'}
            </span>
            <span className="ml-auto text-[10px] text-slate-300">{chunks.length} chunks</span>
            <button
              onClick={toggleRecording}
              className={cn(
                "ml-2 size-6 rounded-full flex items-center justify-center transition-all",
                isRecording ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
              )}
              title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              {isRecording ? <MicOff className="size-3" /> : <Mic className="size-3" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            <AnimatePresence initial={false}>
              {chunks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                  <div className={cn(
                    "size-16 rounded-3xl flex items-center justify-center transition-all duration-500",
                    isRecording ? "bg-red-50 text-red-500 scale-110 shadow-lg shadow-red-100" : "bg-slate-50 text-slate-200"
                  )}>
                    {isRecording ? <Mic className="size-8 animate-pulse" /> : <MicOff className="size-8" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">
                      {isRecording ? 'Listening to your lecture...' : 'Waiting for audio...'}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {sttError
                        ? sttError
                        : isRecording
                          ? 'Speak clearly. Your transcript and outline will appear here in real-time.'
                          : 'Using server transcription (MediaRecorder + Whisper). Reliable for all environments.'}
                    </p>
                  </div>
                  {!isRecording && (
                    <button
                      onClick={startRecording}
                      className={cn(
                        "px-6 py-2 rounded-xl text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-2",
                        sttError ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200" : "bg-teal-600 hover:bg-teal-700 shadow-teal-200"
                      )}
                    >
                      <Mic className="size-3.5" />
                      {sttError ? "Try Recording Again" : "Start Mic Recording"}
                    </button>
                  )}
                </div>
              ) : (
                chunks.map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group"
                  >
                    <div className="flex items-start gap-2">
                      {c.timestamp && (
                        <span className="text-[9px] text-slate-300 mt-0.5 shrink-0 font-mono">
                          {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      )}
                      <p className="text-xs text-slate-700 leading-relaxed">{c.text}</p>
                    </div>
                  </motion.div>
                ))
              )}
              
              {/* ── Live Interim Text ── */}
              {interimText && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-1"
                >
                  <div className="flex items-start gap-2">
                    <span className={cn(
                      "text-[8px] px-1 rounded uppercase font-bold mt-1 tracking-tighter",
                      interimText === '...' ? "bg-slate-100 text-slate-400" : "bg-red-100 text-red-500"
                    )}>
                      {interimText === '...' ? 'Processing' : 'Live'}
                    </span>
                    <p className={cn(
                      "text-xs leading-relaxed animate-in fade-in duration-500",
                      interimText === '...' ? "text-slate-300 italic" : "text-slate-400 italic"
                    )}>
                      {interimText === '...' ? 'Transcribing audio chunk...' : `${interimText}…`}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={transcriptEndRef} />
          </div>

          {/* ── Manual Inject ── */}
          <div className="border-t border-slate-100 p-3">
            <div className="flex gap-2">
              <input
                value={injectText}
                onChange={(e) => setInjectText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleInject()}
                placeholder="Type transcript to inject…"
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:border-teal-300 placeholder:text-slate-300"
                disabled={injecting}
              />
              <button
                onClick={handleInject}
                disabled={!injectText.trim() || injecting}
                className={cn(
                  'size-8 rounded-lg flex items-center justify-center transition-colors shrink-0',
                  injectText.trim() && !injecting
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                )}
                title="Inject transcript chunk"
              >
                {injecting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: AI Summary Panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Tags row */}
          <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex items-center gap-2 flex-wrap min-h-[44px]">
            <Tag className="size-3 text-slate-400 shrink-0" />
            {state.tags.length === 0 ? (
              <span className="text-[10px] text-slate-300">Key concepts will appear here…</span>
            ) : (
              state.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-[10px] text-teal-600 font-medium">
                  {tag}
                </span>
              ))
            )}
            {state.eval_score < 1 && (
              <span className={cn('ml-auto text-[10px] font-semibold', evalColor)}>
                Clarity {Math.round(state.eval_score * 100)}%
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

            {/* Confusion points */}
            <AnimatePresence>
              {state.confusion.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-1.5"
                >
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <AlertTriangle className="size-3" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest">Confusion Points</span>
                  </div>
                  {state.confusion.map((c, i) => (
                    <p key={i} className="text-xs text-amber-700 leading-relaxed pl-4">• {c}</p>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Final Summary */}
            <AnimatePresence>
              {state.final_summary && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-teal-100 bg-teal-50/30 p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-teal-700">
                      <Sparkles className="size-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Lecture Insights</span>
                    </div>
                  </div>
                  <div className="prose prose-slate prose-xs max-w-none text-slate-600 text-[11px] leading-relaxed">
                    {state.final_summary.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Summarize Action */}
            {!state.final_summary && chunks.length > 5 && (
              <button
                onClick={handleSummarize}
                disabled={processing}
                className="w-full py-3 rounded-xl border border-dashed border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all group flex flex-col items-center justify-center gap-2"
              >
                <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                  <Brain className="size-4 text-slate-400 group-hover:text-teal-500" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Generate Insights</p>
                  <p className="text-[9px] text-slate-300">Summarize the key takeaways using your AI settings</p>
                </div>
              </button>
            )}

            {/* Lesson Outline */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => setOutlineOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Brain className="size-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700">Lesson Outline</span>
                  {state.outline.length > 0 && (
                    <span className="text-[10px] text-slate-400">({state.outline.length} sections)</span>
                  )}
                </div>
                {outlineOpen ? <ChevronUp className="size-3.5 text-slate-400" /> : <ChevronDown className="size-3.5 text-slate-400" />}
              </button>

              <AnimatePresence initial={false}>
                {outlineOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    {state.outline.length === 0 ? (
                      <div className="px-4 pb-4 text-xs text-slate-300 text-center py-6">
                        Outline will be structured as the lecture progresses…
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {state.outline.map((section, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 space-y-1.5"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest w-4 shrink-0">{i + 1}</span>
                              <span className="text-xs font-semibold text-slate-800">{section.title}</span>
                              <span className="text-[9px] text-slate-400 italic">{section.gagne_event}</span>
                              {section.bloom_level && (
                                <span className={cn(
                                  'px-1.5 py-0.5 rounded text-[9px] font-medium',
                                  BLOOM_COLORS[section.bloom_level] ?? 'bg-slate-100 text-slate-500'
                                )}>
                                  {section.bloom_level}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed pl-6">{section.content}</p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
