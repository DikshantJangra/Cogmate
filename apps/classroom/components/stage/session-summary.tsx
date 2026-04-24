'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Upload, Brain, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface SynthesisResult {
  merged: string;
  gaps: string[];
}

export function SessionSummary() {
  const [studentNotes, setStudentNotes] = useState('');
  const [aiNotes] = useState('AI has captured the core concepts of Neural Networks, including Backpropagation and Loss Functions.'); // Placeholder
  const [synthesis, setSynthesis] = useState<SynthesisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSynthesis = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_notes: aiNotes, student_notes: studentNotes }),
      });
      const data = await response.json();
      setSynthesis(data);
      toast.success('Synthesis complete!');
    } catch (error) {
      toast.error('Failed to sync with Cogmate Backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: 'pptx' | 'md') => {
    window.open(`http://localhost:8000/api/export/${type}`, '_blank');
  };

  return (
    <div className="h-full bg-white flex flex-col font-sans overflow-hidden">
      {/* Internal Summary Header */}
      <header className="h-20 px-10 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-col">
          <h1 className="text-sm font-black text-slate-900 tracking-[0.1em] uppercase">Session Synthesis</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Refine & Persist</p>
        </div>
        <div className="flex gap-4">
          <button 
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            onClick={() => handleExport('md')}
          >
            <FileText className="size-3.5" /> Markdown
          </button>
          <button 
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            onClick={() => handleExport('pptx')}
          >
            <Download className="size-3.5" /> PPTX
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-12 bg-slate-50/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 h-full">
          
          {/* Left Column: Notes Input */}
          <div className="lg:col-span-5 flex flex-col space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                <div className="size-1.5 rounded-full bg-blue-500" /> 
                Student Input
              </h2>
              <input
                type="file"
                id="notes-upload"
                className="hidden"
                accept=".txt,.md,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.type.startsWith('image/')) {
                      toast.info('Vision analysis enabled.');
                    } else {
                      const reader = new FileReader();
                      reader.onload = (rev) => setStudentNotes(rev.target?.result as string);
                      reader.readAsText(file);
                    }
                  }
                }}
              />
              <button 
                onClick={() => document.getElementById('notes-upload')?.click()}
                className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1 rounded-full border border-blue-100"
              >
                Upload File
              </button>
            </div>

            <div className="flex-1 min-h-[400px] relative bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 flex flex-col transition-all hover:border-slate-200">
              <Textarea
                placeholder="Synchronize your personal insights with AI context..."
                className="flex-1 border-none focus-visible:ring-0 text-slate-700 leading-[1.8] resize-none p-0 text-[15px] font-medium"
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
              />
              <div className="pt-6 flex justify-end border-t border-slate-50 mt-4">
                <Button 
                  className="rounded-full bg-slate-900 hover:bg-slate-800 text-white px-8 h-12 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-200"
                  onClick={handleSynthesis}
                  disabled={loading || !studentNotes.trim()}
                >
                  {loading ? 'Synthesizing...' : 'Sync with AI'} <ArrowRight className="ml-3 size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Synthesis */}
          <div className="lg:col-span-7 flex flex-col space-y-8">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
              <div className="size-1.5 rounded-full bg-indigo-500" /> 
              Pedagogical Merge
            </h2>

            {!synthesis ? (
              <div className="bg-white rounded-[32px] border border-dashed border-slate-200 flex-1 min-h-[500px] flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="size-20 rounded-[32px] bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                  <Brain className="size-10 text-slate-200" />
                </div>
                <div className="space-y-2">
                  <p className="text-slate-900 font-black text-lg tracking-tight uppercase">Ready for Synthesis</p>
                  <p className="text-slate-400 text-sm max-w-[280px] font-medium leading-relaxed">Provide your notes to initiate the AST-aware merging orchestrator.</p>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col space-y-12"
              >
                {/* Merged View */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 p-10 space-y-8 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                      <CheckCircle2 className="size-6" />
                    </div>
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Unified Insights</h3>
                  </div>
                  <ScrollArea className="flex-1 w-full pr-6 min-h-[250px]">
                    <div className="prose prose-slate prose-sm leading-loose text-slate-600 font-medium">
                      {synthesis.merged.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Gaps */}
                <div className="space-y-6">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 px-2">Actionable Gaps</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {synthesis.gaps.map((gap, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white border border-slate-100 shadow-lg shadow-slate-100/50 rounded-[24px] p-6 text-[13px] text-slate-600 font-bold leading-relaxed flex gap-4 items-start transition-all hover:shadow-xl"
                      >
                        <div className="size-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        {gap}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
