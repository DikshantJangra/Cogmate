'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Clock, Activity } from 'lucide-react';
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
      const host = window.location.hostname;
      const url = `${protocol}//${host}:8000/ws/ui`;
      
      console.log(`🔌 Attempting Cogmate UI connection: ${url}`);
      socket = new WebSocket(url);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'highlight') {
            setHighlights((prev) => [
              {
                tag: data.tag,
                timestamp: data.timestamp,
                importance: data.importance || 1,
              },
              ...prev,
            ]);
          }
        } catch (e) {
          console.error('❌ Error parsing UI stream message:', e);
        }
      };

      socket.onopen = () => {
        console.log('✅ Connected to Cogmate Backend UI stream');
        setConnected(true);
      };
      
      socket.onerror = (error) => {
        console.warn('⚠️ Cogmate UI Stream connection failed. Retrying in 3s...');
      };
      
      socket.onclose = (event) => {
        setConnected(false);
        console.log('❌ Cogmate UI Stream Disconnected. Reconnecting...');
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
      <div className="h-16 px-8 border-b border-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Activity className={cn("size-3.5 transition-colors", connected ? "text-blue-600" : "text-slate-300")} />
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
            Live Pulse
          </h3>
        </div>
        <div className={cn(
          "size-1.5 rounded-full transition-all duration-500",
          connected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-slate-200"
        )} />
      </div>

      {/* Concept List */}
      <ScrollArea className="flex-1">
        <div className="p-8 space-y-10">
          <AnimatePresence initial={false}>
            {highlights.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-4"
              >
                <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                  <Zap className="size-5 text-slate-200" />
                </div>
                <p className="text-[12px] font-bold text-slate-300 uppercase tracking-widest max-w-[140px] leading-relaxed">
                  Analyzing Stream...
                </p>
              </motion.div>
            ) : (
              highlights.map((h, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="group relative"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-[16px] font-bold text-slate-900 leading-tight tracking-tight">
                        {h.tag}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 shrink-0 mt-1">
                        <Clock className="size-3" />
                        {h.timestamp.split('T')[1]?.substring(0, 5) || h.timestamp}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-400 text-[9px] font-bold uppercase tracking-wider border border-slate-100">
                        Concept
                      </div>
                      {h.importance >= 4 && (
                        <div className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-bold uppercase tracking-wider border border-blue-100">
                          Critical
                        </div>
                      )}
                    </div>

                    <div className="h-0.5 w-full bg-slate-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(h.importance / 5) * 100}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-slate-900 rounded-full" 
                      />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Footer Info */}
      <div className="p-5 bg-slate-50/30 border-t border-slate-50">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300 text-center leading-relaxed">
          Active Orchestration
        </p>
      </div>
    </aside>
  );
}
