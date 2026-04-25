'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Highlight {
  tag: string;
  timestamp: string;
  importance: number;
}

export function PedagogicalPulse() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.hostname}:8000/ws/ui`;
      socket = new WebSocket(url);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'highlight') {
            setHighlights((prev) => [
              { tag: data.tag, timestamp: data.timestamp, importance: data.importance || 1 },
              ...prev,
            ]);
          }
        } catch {}
      };

      socket.onopen = () => setConnected(true);
      socket.onerror = () => {};
      socket.onclose = () => {
        setConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  return (
    <aside className="flex flex-col h-full bg-white font-sans">
      {/* Header */}
      <div className="h-16 px-6 border-b border-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="size-3 text-slate-300" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
            Lecture Feed
          </span>
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider transition-all duration-500',
            connected
              ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
              : 'bg-slate-50 border-slate-100 text-slate-300',
          )}
        >
          <div className={cn('size-1 rounded-full', connected ? 'bg-emerald-500' : 'bg-slate-300')} />
          {connected ? 'Live' : 'Offline'}
        </div>
      </div>

      {/* Concept List */}
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-3">
          <AnimatePresence initial={false}>
            {highlights.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center space-y-3"
              >
                <div className="size-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Sparkles className="size-4 text-slate-200" />
                </div>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
                  {connected ? 'Waiting for lecture...' : 'No signal'}
                </p>
              </motion.div>
            ) : (
              highlights.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3 shadow-sm shadow-slate-100/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13px] font-bold text-slate-800 leading-snug tracking-tight">
                      {h.tag}
                    </p>
                    <span className="text-[9px] font-bold text-slate-300 shrink-0 flex items-center gap-1 mt-0.5">
                      <Clock className="size-2.5" />
                      {h.timestamp.split('T')[1]?.substring(0, 5) ?? h.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-1 flex-1 bg-slate-50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(h.importance / 5) * 100}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className={cn(
                          'h-full rounded-full',
                          h.importance >= 4 ? 'bg-blue-500' : 'bg-slate-300',
                        )}
                      />
                    </div>
                    {h.importance >= 4 && (
                      <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">
                        Key
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      <div className="px-6 py-4 border-t border-slate-50">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300 text-center">
          Cogmate Listener
        </p>
      </div>
    </aside>
  );
}
