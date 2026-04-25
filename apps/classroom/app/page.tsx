'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Mic,
  FileText,
  Clock,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Settings,
  Zap,
  AlertCircle,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/utils/database';

// ------- Types -------
interface SetupStatus {
  hasModel: boolean;
  hasApiKey: boolean;
  modelName: string;
}

export default function HomePage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [recentStages, setRecentStages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'live'>('generate');
  const [isFocused, setIsFocused] = useState(false);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [setupChecking, setSetupChecking] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Load recent sessions
  useEffect(() => {
    db.stages.orderBy('updatedAt').reverse().limit(5).toArray()
      .then(setRecentStages)
      .catch(() => {});
  }, []);

  // Check if the app is properly configured (API key + model)
  useEffect(() => {
    const checkSetup = async () => {
      setSetupChecking(true);
      try {
        // Check server-providers endpoint for available models
        const res = await fetch('/api/server-providers');
        if (res.ok) {
          const data = await res.json();
          const providers = data?.data?.providers || [];
          const hasAnyProvider = providers.length > 0;

          if (hasAnyProvider) {
            const firstProvider = providers[0];
            const firstModel = firstProvider?.models?.[0];
            setSetupStatus({
              hasModel: !!firstModel,
              hasApiKey: true, // server-providers means server-side keys are configured
              modelName: firstModel?.name || firstModel?.id || firstProvider?.name || 'Unknown',
            });
          } else {
            // No server providers — check if user has set up local model config
            const settingsRaw = localStorage.getItem('settings-storage');
            if (settingsRaw) {
              try {
                const settings = JSON.parse(settingsRaw);
                const state = settings?.state;
                const hasKey = !!(state?.providers && Object.keys(state.providers).some(
                  (k: string) => state.providers[k]?.apiKey
                ));
                setSetupStatus({
                  hasModel: !!state?.modelId,
                  hasApiKey: hasKey,
                  modelName: state?.modelId || '',
                });
              } catch {
                setSetupStatus({ hasModel: false, hasApiKey: false, modelName: '' });
              }
            } else {
              setSetupStatus({ hasModel: false, hasApiKey: false, modelName: '' });
            }
          }
        } else {
          setSetupStatus({ hasModel: false, hasApiKey: false, modelName: '' });
        }
      } catch {
        // Can't reach server — likely not running
        setSetupStatus({ hasModel: false, hasApiKey: false, modelName: '' });
      } finally {
        setSetupChecking(false);
      }
    };
    checkSetup();
  }, []);

  const isConfigured = setupStatus?.hasModel || setupStatus?.hasApiKey;

  // Handle PDF file selection
  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setErrorBanner(null);
    } else if (file) {
      setErrorBanner('Please select a valid PDF file.');
    }
  };

  // Start a "Generate from Topic" session — goes through generation-preview pipeline
  const startGenerateSession = async () => {
    if (!topic.trim() && !pdfFile) {
      setErrorBanner('Please enter a topic or upload a PDF to generate a classroom.');
      return;
    }

    if (!isConfigured) {
      setErrorBanner('No AI model configured. Open Settings (⚙) to add an API key first.');
      return;
    }

    setIsStarting(true);
    setErrorBanner(null);

    try {
      // Build generation session and store it in sessionStorage
      // Then navigate to /generation-preview which handles the actual API calls
      let pdfStorageKey: string | undefined;
      let pdfFileName: string | undefined;

      if (pdfFile) {
        // Store PDF blob in IndexedDB for generation-preview to pick up
        pdfStorageKey = `pdf_${nanoid(8)}`;
        pdfFileName = pdfFile.name;
        const pdfBlob = new Blob([await pdfFile.arrayBuffer()], { type: 'application/pdf' });
        await db.imageFiles.put({
          id: pdfStorageKey,
          blob: pdfBlob,
          filename: pdfFileName,
          mimeType: 'application/pdf',
          size: pdfBlob.size,
          createdAt: Date.now(),
        });
      }

      const generationSession = {
        requirements: {
          requirement: topic.trim() || `Create a comprehensive lesson from the uploaded PDF: ${pdfFileName}`,
          webSearch: false,
          interactiveMode: false,
        },
        pdfStorageKey,
        pdfFileName,
        pdfText: undefined,
        pdfImages: undefined,
        sceneOutlines: undefined,
      };

      sessionStorage.setItem('generationSession', JSON.stringify(generationSession));
      router.push('/generation-preview');
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to start session.');
      setIsStarting(false);
    }
  };

  // Start a "Live Lecture" session — navigate to the real-time lecture dashboard
  const startLiveSession = () => {
    router.push('/lecture');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden">
      {/* Hidden file input for PDF upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handlePdfSelect}
        className="hidden"
      />

      {/* Nav */}
      <nav className="h-14 flex items-center justify-between px-6 max-w-5xl mx-auto sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/')}>
          <div className="size-7 rounded-lg bg-teal-600 flex items-center justify-center shadow-sm shadow-teal-200">
            <GraduationCap className="size-3.5 text-white" aria-label="Cogmate Logo" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-slate-900">Cogmate</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Setup Status Indicator */}
          {!setupChecking && (
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium",
              isConfigured
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                : "bg-amber-50 text-amber-600 border border-amber-100"
            )}>
              <div className={cn("size-1.5 rounded-full", isConfigured ? "bg-emerald-500" : "bg-amber-500")} />
              {isConfigured ? 'Ready' : 'Setup Required'}
            </div>
          )}
          <button
            onClick={() => router.push('/generation-preview')}
            className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Settings"
          >
            <Settings className="size-3.5" />
          </button>
        </div>
      </nav>

      {/* Error Banner */}
      <AnimatePresence>
        {errorBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="max-w-5xl mx-auto px-6"
          >
            <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
              <AlertCircle className="size-4 shrink-0 text-red-500" />
              <span className="flex-1">{errorBanner}</span>
              <button onClick={() => setErrorBanner(null)} className="shrink-0 text-red-400 hover:text-red-600">
                <X className="size-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 pt-16 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-4 mb-12"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-600 text-xs font-medium">
            <Sparkles className="size-3" />
            AI-Powered Instructional Design
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 leading-tight">
            What are we learning<br />
            <span className="text-slate-300">today?</span>
          </h1>
          <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
            Type a topic, upload a syllabus, or start a live lecture — Cogmate builds the classroom for you.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
            {(['generate', 'live'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setErrorBanner(null); }}
                className={cn(
                  'px-5 py-2 rounded-lg text-xs font-medium transition-all',
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                {tab === 'generate' ? 'Generate from Topic' : 'Live Lecture'}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'generate' ? (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className={cn(
                'relative rounded-2xl border transition-all duration-200',
                isFocused
                  ? 'border-teal-300 shadow-lg shadow-teal-100 bg-white'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
              )}>
                <textarea
                  placeholder="e.g. Intro to Quantum Mechanics for 10th graders..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && (topic.trim() || pdfFile)) {
                      startGenerateSession();
                    }
                  }}
                  className="w-full bg-transparent px-5 pt-5 pb-16 text-sm text-slate-800 placeholder:text-slate-300 resize-none outline-none min-h-[140px] leading-relaxed"
                  disabled={isStarting}
                />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isStarting}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-50"
                    >
                      <FileText className="size-3.5" />
                      {pdfFile ? pdfFile.name.slice(0, 20) + (pdfFile.name.length > 20 ? '...' : '') : 'Upload PDF'}
                    </button>
                    {pdfFile && (
                      <button
                        onClick={() => setPdfFile(null)}
                        className="text-xs text-slate-300 hover:text-red-400 transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-300">⌘↵ to generate</span>
                    <button
                      onClick={startGenerateSession}
                      disabled={(!topic.trim() && !pdfFile) || isStarting}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all',
                        (topic.trim() || pdfFile) && !isStarting
                          ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-200'
                          : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      )}
                    >
                      {isStarting ? (
                        <>
                          <Loader2 className="size-3 animate-spin" />
                          Preparing...
                        </>
                      ) : (
                        <>
                          Generate <ArrowRight className="size-3" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* PDF attached indicator */}
              <AnimatePresence>
                {pdfFile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 border border-teal-100 text-xs text-teal-700"
                  >
                    <CheckCircle2 className="size-3.5 text-teal-500" />
                    <span className="font-medium">{pdfFile.name}</span>
                    <span className="text-teal-400">({(pdfFile.size / 1024).toFixed(0)} KB)</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-12 flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="size-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                    <Mic className="size-7 text-teal-500" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-teal-100 animate-ping opacity-40" />
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-sm font-medium text-slate-800">Ready to listen</p>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    Agents will build the classroom in real-time as you speak.
                  </p>
                </div>
                <button
                  onClick={startLiveSession}
                  disabled={isStarting}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-medium transition-colors shadow-sm",
                    isStarting
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-teal-600 text-white hover:bg-teal-700 shadow-teal-200"
                  )}
                >
                  {isStarting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Zap className="size-3.5" />
                  )}
                  Start Recording
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Sessions */}
        {recentStages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto mt-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="size-3 text-slate-300" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">Recent</span>
            </div>
            <div className="space-y-1.5">
              {recentStages.map((s) => (
                <button
                  key={s.id}
                  onClick={() => router.push(`/classroom/${s.id}`)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all group text-left shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <GraduationCap className="size-3 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 font-medium truncate group-hover:text-slate-900 transition-colors">{s.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(s.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        {s.scenesCount ? ` · ${s.scenesCount} scenes` : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-3.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Setup Guide (if not configured) */}
        <AnimatePresence>
          {!isConfigured && !setupChecking && (
            <motion.div
              key="setup-guide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto mt-12"
            >
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="size-4 text-amber-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-800">Setup Required — Add an API Key to Continue</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Cogmate needs an AI provider to generate classrooms. Get a key from any provider below:
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-11">
                  {[
                    { name: 'Google Gemini', env: 'GOOGLE_API_KEY', url: 'https://aistudio.google.com/apikey', free: true },
                    { name: 'OpenAI', env: 'OPENAI_API_KEY', url: 'https://platform.openai.com/api-keys', free: false },
                    { name: 'Anthropic', env: 'ANTHROPIC_API_KEY', url: 'https://console.anthropic.com/', free: false },
                  ].map((p) => (
                    <a
                      key={p.name}
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm transition-all text-left group"
                    >
                      <div className="size-6 rounded bg-slate-100 group-hover:bg-teal-50 flex items-center justify-center transition-colors">
                        <Sparkles className="size-3 text-slate-400 group-hover:text-teal-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.free ? 'Free tier available' : 'Paid'}</p>
                      </div>
                    </a>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 pl-11 leading-relaxed">
                  Copy the key → create <code className="text-slate-600 bg-white px-1 py-0.5 rounded border border-slate-200">apps/classroom/.env.local</code> → add <code className="text-slate-600 bg-white px-1 py-0.5 rounded border border-slate-200">GOOGLE_API_KEY=your_key</code> → restart dev server.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
