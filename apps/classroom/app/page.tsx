'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Mic, 
  ArrowRight, 
  Zap, 
  GraduationCap, 
  Database, 
  CheckCircle2,
  GitBranch,
  Network,
  Activity,
  BarChart3,
  Layers,
  LayoutList,
  Plus,
  FileText,
  Video,
  Settings2,
  Clock,
  ChevronRight,
  HelpCircle,
  Terminal,
  Search
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useStageStore } from '@/lib/store';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/lib/utils/database';

export default function HomePage() {
  const router = useRouter();
  const [requirements, setRequirements] = useState('');
  const [recentStages, setRecentStages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'live'>('generate');

  // Load recent sessions
  useEffect(() => {
    const loadRecent = async () => {
      try {
        const stages = await db.stages.orderBy('updatedAt').reverse().limit(4).toArray();
        setRecentStages(stages);
      } catch (e) {
        console.error('Failed to load recent sessions:', e);
      }
    };
    loadRecent();
  }, []);

  const startSession = (type: 'blank' | 'live' | 'requirements') => {
    const sessionId = nanoid(10);
    
    // Initialize stage
    useStageStore.getState().setStage({
      id: sessionId,
      name: requirements.slice(0, 30) || (type === 'live' ? 'Live Lecture' : 'New Session'),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      agentIds: ['default-1', 'default-2', 'default-3'],
      languageDirective: 'Deliver the entire course in English (en-US).',
    });

    // Add default welcome scene
    useStageStore.getState().setScenes([
      {
        id: 'welcome-scene',
        stageId: sessionId,
        type: 'slide',
        title: 'Welcome to Cogmate',
        order: 0,
        content: {
          type: 'slide',
          canvas: {
            id: 'welcome-slide',
            viewportSize: 1000,
            viewportRatio: 0.5625,
            theme: {
              backgroundColor: '#ffffff',
              themeColors: ['#0f172a', '#3b82f6'],
              fontColor: '#0f172a',
              fontName: 'Inter',
            },
            elements: [
              {
                id: 'welcome-text',
                type: 'text',
                left: 100,
                top: 200,
                width: 800,
                height: 200,
                rotate: 0,
                content: `<h1 style="text-align: center; color: #0f172a; font-family: Inter, sans-serif; font-size: 64px; font-weight: 900;">${type === 'live' ? 'Live Stream Started' : 'Classroom Initialized'}</h1>`,
                defaultFontName: 'Inter',
                defaultColor: '#0f172a',
              }
            ],
          }
        },
        actions: [
          {
            id: 'welcome-speech',
            type: 'speech',
            text: type === 'live' 
              ? 'I am now listening to your live stream. Speak clearly and I will synthesize the content.' 
              : 'Classroom is ready. You can start by defining your first topic or letting me generate content based on your requirements.'
          }
        ]
      }
    ]);

    router.push(`/classroom/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-900 selection:text-white overflow-x-hidden pb-20">
      {/* Premium Navigation */}
      <nav className="h-16 flex items-center justify-between px-8 max-w-7xl mx-auto w-full sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-50">
        <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => router.push('/')}>
          <div className="size-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200 group-hover:rotate-12 transition-transform">
            <GraduationCap className="size-4.5" />
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="font-black text-[15px] tracking-tight text-slate-900 uppercase">Cogmate</span>
            <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">Workspace v1.0</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          <a href="#how-it-works" className="hover:text-slate-900 transition-colors flex items-center gap-2">
            <HelpCircle className="size-3" /> Help
          </a>
          <a href="#agents" className="hover:text-slate-900 transition-colors flex items-center gap-2">
            <Layers className="size-3" /> Agents
          </a>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 px-4 h-9">Settings</Button>
          <div className="size-8 rounded-full bg-slate-100 border border-slate-200" />
        </div>
      </nav>

      {/* Main Workspace Hub */}
      <main className="max-w-7xl mx-auto px-8 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Column: Creation Controls */}
          <div className="lg:col-span-8 space-y-12">
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest"
              >
                <Zap className="size-3" /> Let's build something
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-black tracking-tighter text-slate-900"
              >
                What are we <br />
                <span className="text-slate-200 italic underline decoration-blue-500/20 underline-offset-8">learning today?</span>
              </motion.h1>
            </div>

            {/* Creation Tabs */}
            <div className="bg-slate-50/50 p-2 rounded-[32px] border border-slate-100 flex gap-2 w-fit">
              <button 
                onClick={() => setActiveTab('generate')}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'generate' ? "bg-white text-slate-900 shadow-xl shadow-slate-200 border border-slate-100" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Synthesize from Topic
              </button>
              <button 
                onClick={() => setActiveTab('live')}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'live' ? "bg-white text-slate-900 shadow-xl shadow-slate-200 border border-slate-100" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Live Lecture Stream
              </button>
            </div>

            {/* Creation Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'generate' ? (
                <motion.div 
                  key="generate"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-[32px] blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <Textarea 
                      placeholder="Enter a topic, upload a syllabus, or paste a list of requirements... (e.g. 'Intro to Quantum Mechanics for 10th graders')"
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      className="min-h-[220px] rounded-[32px] border-slate-100 bg-white p-10 text-lg font-bold placeholder:text-slate-200 focus-visible:ring-0 focus-visible:border-slate-900 transition-all resize-none shadow-2xl shadow-slate-200/40 relative z-10"
                    />
                    <div className="absolute bottom-6 right-8 z-20 flex gap-3">
                       <Button variant="ghost" className="rounded-xl border border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest">
                          <FileText className="size-3.5 mr-2" /> Upload PDF
                       </Button>
                       <Button 
                         onClick={() => startSession('requirements')}
                         className="rounded-xl bg-slate-900 text-white px-8 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-300 hover:bg-slate-800"
                       >
                          Generate Stage <ArrowRight className="size-3.5 ml-2" />
                       </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="live"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="p-16 border-2 border-dashed border-slate-100 rounded-[48px] flex flex-col items-center justify-center space-y-8 bg-slate-50/20"
                >
                  <div className="size-24 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-slate-200 relative">
                    <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
                    <Mic className="size-10" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-slate-900">Ready to listen.</h3>
                    <p className="text-slate-400 font-bold max-w-sm">Start your live lecture and Cogmate agents will build the classroom in real-time as you speak.</p>
                  </div>
                  <Button 
                    onClick={() => startSession('live')}
                    className="rounded-2xl bg-blue-600 hover:bg-blue-500 text-white px-12 h-14 text-xs font-black uppercase tracking-widest shadow-2xl shadow-blue-200"
                  >
                    Start Recording Session
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Recent & Agents */}
          <div className="lg:col-span-4 space-y-12">
            {/* Recent Sessions */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Clock className="size-3" /> Recent Vaults
                </h4>
                <Button variant="link" className="text-[10px] font-black uppercase tracking-widest text-blue-500 p-0 h-auto">View All</Button>
              </div>
              
              <div className="space-y-3">
                {recentStages.length > 0 ? (
                  recentStages.map((s) => (
                    <button 
                      key={s.id}
                      onClick={() => router.push(`/classroom/${s.id}`)}
                      className="w-full p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-900 hover:shadow-xl hover:shadow-slate-100 transition-all text-left group flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="text-[13px] font-black text-slate-900 line-clamp-1">{s.name}</div>
                        <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                          {new Date(s.updatedAt).toLocaleDateString()} • {s.scenesCount || 0} Scenes
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-slate-200 group-hover:text-slate-900 transition-colors" />
                    </button>
                  ))
                ) : (
                  <div className="p-8 border border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center space-y-3">
                    <Terminal className="size-6 text-slate-100" />
                    <span className="text-[10px] font-bold text-slate-200 uppercase">No recent sessions</span>
                  </div>
                )}
              </div>
            </section>

            {/* Active Agents Preview */}
            <section className="p-8 bg-slate-900 rounded-[40px] text-white space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 size-32 bg-blue-500/20 blur-3xl rounded-full" />
              <div className="space-y-2">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Agent Registry</h4>
                <p className="text-sm font-bold leading-relaxed">Your session will be orchestrated by the following core units:</p>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Highlighter', role: 'Term Extraction', status: 'Online' },
                  { name: 'Architect', role: 'Scene Structure', status: 'Standby' },
                  { name: 'Sim Student', role: 'Gap Analysis', status: 'Ready' }
                ].map(agent => (
                  <div key={agent.name} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Layers className="size-4 text-blue-300" />
                    </div>
                    <div className="flex-1">
                       <div className="text-[11px] font-black uppercase tracking-tight">{agent.name}</div>
                       <div className="text-[9px] text-white/40 font-bold">{agent.role}</div>
                    </div>
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* How it Works / Instructions */}
        <section id="how-it-works" className="mt-40 border-t border-slate-50 pt-32 space-y-24">
          <div className="text-center space-y-4">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600">Pure Pedagogical Intelligence</h2>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Unified Workflow. Zero Friction.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              {
                step: '01',
                title: 'Ingestion',
                desc: 'Speak, type, or upload. Our ingestion engine maps raw content to a vector-backed semantic index.',
                icon: Mic
              },
              {
                step: '02',
                title: 'Orchestration',
                desc: 'Agents collaborate via LangGraph to determine the most effective teaching strategy for the material.',
                icon: Network
              },
              {
                step: '03',
                title: 'Synthesis',
                desc: 'Notes, diagrams, and code are generated dynamically, merging AI insights with your existing knowledge.',
                icon: GitBranch
              },
              {
                step: '04',
                title: 'Preservation',
                desc: 'Your classroom is vaulted locally in IndexedDB, ready for offline review or recursive learning cycles.',
                icon: Database
              }
            ].map((item, i) => (
              <div key={i} className="space-y-6 group">
                <div className="flex items-end gap-3">
                   <span className="text-4xl font-black text-slate-100 group-hover:text-slate-900 transition-colors duration-500">{item.step}</span>
                   <div className="size-1.5 rounded-full bg-blue-500 mb-2.5" />
                </div>
                <div className="space-y-3">
                   <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">{item.title}</h4>
                   <p className="text-[13px] text-slate-400 font-bold leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-40 h-24 border-t border-slate-50 flex flex-col items-center justify-center gap-4 bg-white">
        <div className="flex items-center gap-6">
           {['Twitter', 'GitHub', 'Documentation'].map(link => (
             <a key={link} href="#" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-slate-900 transition-colors">{link}</a>
           ))}
        </div>
        <div className="text-[9px] font-black uppercase tracking-widest text-slate-200">
           © 2026 Cogmate — High Fidelity Learning OS
        </div>
      </footer>
    </div>
  );
}
