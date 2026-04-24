'use client';

import { useEffect, useRef } from 'react';
import { BookOpen, MessageSquare, Flashlight, MousePointer2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/hooks/use-i18n';
import type { LectureNoteEntry } from '@/lib/types/chat';

const ACTION_ICON_ONLY: Record<string, { Icon: typeof Flashlight; style: string }> = {
  spotlight: {
    Icon: Flashlight,
    style:
      'bg-blue-50 border-blue-100 text-blue-600',
  },
  laser: {
    Icon: MousePointer2,
    style:
      'bg-red-50 border-red-100 text-red-600',
  },
  play_video: {
    Icon: Play,
    style:
      'bg-blue-50 border-blue-100 text-blue-600',
  },
};

interface LectureNotesViewProps {
  notes: LectureNoteEntry[];
  currentSceneId?: string | null;
}

export function LectureNotesView({ notes, currentSceneId }: LectureNotesViewProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the current scene note
  useEffect(() => {
    if (!currentSceneId || !containerRef.current) return;
    const el = containerRef.current.querySelector(`[data-scene-id="${currentSceneId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSceneId]);

  // Empty state
  if (notes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
        <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-200 shadow-sm">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-900">
            {t('chat.lectureNotes.empty')}
          </p>
          <p className="text-[12px] text-slate-400 max-w-[200px]">
            {t('chat.lectureNotes.emptyHint')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4 scrollbar-hide"
    >
      {notes.map((note, index) => {
        const isCurrent = note.sceneId === currentSceneId;
        const pageNum = index + 1;
        const pageLabel = t('chat.lectureNotes.pageLabel', { n: pageNum });

        return (
          <div
            key={note.sceneId}
            data-scene-id={note.sceneId}
            className={cn(
              'relative rounded-2xl px-5 py-4 transition-all duration-200 border',
              isCurrent
                ? 'bg-white border-blue-100 shadow-sm shadow-blue-50'
                : 'bg-transparent border-transparent hover:bg-white/50 hover:border-slate-100',
            )}
          >
            {/* Page label row */}
            <div className="flex items-center gap-2 mb-2">
              {/* Timeline dot */}
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  isCurrent
                    ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                    : 'bg-slate-200',
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider',
                  isCurrent
                    ? 'text-blue-600'
                    : 'text-slate-400',
                )}
              >
                {pageLabel}
              </span>
              {isCurrent && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  {t('chat.lectureNotes.currentPage')}
                </span>
              )}
            </div>

            {/* Scene title */}
            <h4 className="text-[14px] font-bold text-slate-900 mb-2 leading-snug pl-3.5">
              {note.sceneTitle}
            </h4>

            {/* Ordered items: spotlight/laser inline at sentence start, discussion as card */}
            <div className="pl-3.5 space-y-2">
              {(() => {
                // Build render rows: group inline actions (spotlight/laser) with next speech,
                // but render discussion as its own block
                type Row =
                  | { kind: 'speech'; inlineActions: string[]; text: string }
                  | { kind: 'discussion'; label?: string }
                  | { kind: 'trailing'; inlineActions: string[] };
                const rows: Row[] = [];
                let pendingInline: string[] = [];
                for (const item of note.items) {
                  if (item.kind === 'action' && item.type === 'discussion') {
                    // Flush pending inline actions as trailing if any
                    if (pendingInline.length > 0) {
                      rows.push({
                        kind: 'trailing',
                        inlineActions: pendingInline,
                      });
                      pendingInline = [];
                    }
                    rows.push({ kind: 'discussion', label: item.label });
                  } else if (item.kind === 'action') {
                    pendingInline.push(item.type);
                  } else {
                    rows.push({
                      kind: 'speech',
                      inlineActions: pendingInline,
                      text: item.text,
                    });
                    pendingInline = [];
                  }
                }
                if (pendingInline.length > 0) {
                  rows.push({ kind: 'trailing', inlineActions: pendingInline });
                }
                return rows.map((row, i) => {
                  if (row.kind === 'discussion') {
                    return (
                      <div
                        key={i}
                        className="my-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/30 px-3 py-2.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span className="text-[12px] leading-snug font-medium text-slate-700">
                          {row.label}
                        </span>
                      </div>
                    );
                  }
                  const actions = row.kind === 'trailing' ? row.inlineActions : row.inlineActions;
                  return (
                    <p
                      key={i}
                      className="text-[13px] leading-relaxed text-slate-600"
                    >
                      {actions.map((a, j) => {
                        const cfg = ACTION_ICON_ONLY[a];
                        if (!cfg) return null;
                        const { Icon, style } = cfg;
                        return (
                          <span
                            key={j}
                            className={cn(
                              'inline-flex items-center justify-center w-4 h-4 rounded-full border align-middle mr-1.5',
                              style,
                            )}
                          >
                            <Icon className="w-2.5 h-2.5" />
                          </span>
                        );
                      })}
                      {row.kind === 'speech' ? row.text : null}
                    </p>
                  );
                });
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
