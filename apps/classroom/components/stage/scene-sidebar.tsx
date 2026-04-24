'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  PanelLeftClose,
  PieChart,
  Cpu,
  MousePointer2,
  BookOpen,
  AlertCircle,
  RefreshCw,
  Trophy,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStageStore } from '@/lib/store';
import { useI18n } from '@/lib/hooks/use-i18n';
import type { SceneType } from '@/lib/types/stage';
import { PENDING_SCENE_ID } from '@/lib/store/stage';

interface SceneSidebarProps {
  readonly collapsed: boolean;
  readonly onCollapseChange: (collapsed: boolean) => void;
  readonly onSceneSelect?: (sceneId: string) => void;
  readonly onRetryOutline?: (outlineId: string) => Promise<void>;
  readonly isCourseComplete?: boolean;
}

const DEFAULT_WIDTH = 220;
const MIN_WIDTH = 170;
const MAX_WIDTH = 400;

export function SceneSidebar({
  collapsed,
  onCollapseChange,
  onSceneSelect,
  onRetryOutline,
  isCourseComplete,
}: SceneSidebarProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { scenes, currentSceneId, setCurrentSceneId, generatingOutlines, generationStatus } =
    useStageStore();
  const failedOutlines = useStageStore.use.failedOutlines();

  const [retryingOutlineId, setRetryingOutlineId] = useState<string | null>(null);

  const handleRetryOutline = async (outlineId: string) => {
    if (!onRetryOutline) return;
    setRetryingOutlineId(outlineId);
    try {
      await onRetryOutline(outlineId);
    } finally {
      setRetryingOutlineId(null);
    }
  };

  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const isDraggingRef = useRef(false);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const handleMouseMove = (me: MouseEvent) => {
        const delta = me.clientX - startX;
        const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
        setSidebarWidth(newWidth);
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [sidebarWidth],
  );

  const getSceneTypeIcon = (type: SceneType) => {
    const icons = {
      slide: BookOpen,
      quiz: PieChart,
      interactive: MousePointer2,
      pbl: Cpu,
    };
    return icons[type] || BookOpen;
  };

  const displayWidth = collapsed ? 0 : sidebarWidth;

  return (
    <div
      style={{
        width: displayWidth,
        transition: isDraggingRef.current ? 'none' : 'width 0.3s ease',
      }}
      className="bg-white border-r border-slate-50 flex flex-col shrink-0 z-20 relative overflow-visible font-sans"
    >
      {/* Drag handle */}
      {!collapsed && (
        <div
          onMouseDown={handleDragStart}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 group hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors"
        >
        </div>
      )}

      <div className={cn('flex flex-col w-full h-full overflow-hidden', collapsed && 'hidden')}>
        {/* Logo Header */}
        <div className="h-20 flex items-center justify-between shrink-0 relative px-8 border-b border-slate-50 mb-2">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 cursor-pointer active:scale-[0.97] transition-all duration-150"
            title={t('generation.backToHome')}
          >
             <div className="size-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-lg shadow-slate-200">
               <GraduationCap className="size-4.5" />
             </div>
             <span className="font-black text-[15px] tracking-tight text-slate-900 uppercase">Cogmate</span>
          </button>
          <button
            onClick={() => onCollapseChange(true)}
            className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-50 transition-all"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Scenes List */}
        <div
          data-testid="scene-list"
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 space-y-2 scrollbar-hide py-4"
        >
          {scenes.map((scene, index) => {
            const isActive = currentSceneId === scene.id;
            const Icon = getSceneTypeIcon(scene.type);

            return (
              <div
                key={scene.id}
                data-testid="scene-item"
                onClick={() => {
                  if (onSceneSelect) {
                    onSceneSelect(scene.id);
                  } else {
                    setCurrentSceneId(scene.id);
                  }
                }}
                className={cn(
                  'group relative rounded-2xl transition-all duration-300 cursor-pointer flex flex-col gap-2 p-2',
                  isActive
                    ? 'bg-white border border-slate-100 shadow-xl shadow-slate-200/40'
                    : 'hover:bg-slate-50/50 border border-transparent',
                )}
              >
                {/* Scene Header */}
                <div className="flex justify-between items-center px-2 pt-1">
                  <div className="flex items-center gap-2.5 max-w-full">
                    <span
                      className={cn(
                        'text-[9px] font-black w-4 h-4 rounded-lg flex items-center justify-center shrink-0 border transition-all',
                        isActive
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-100 text-slate-300',
                      )}
                    >
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <span
                      data-testid="scene-title"
                      className={cn(
                        'text-[11px] font-bold uppercase tracking-wider truncate transition-colors',
                        isActive
                          ? 'text-slate-900'
                          : 'text-slate-400 group-hover:text-slate-600',
                      )}
                    >
                      {scene.title}
                    </span>
                  </div>
                </div>

                {/* Thumbnail placeholder */}
                <div className={cn(
                  "relative aspect-video w-full rounded-xl overflow-hidden flex items-center justify-center transition-colors border",
                  isActive ? "bg-blue-50 border-blue-100" : "bg-slate-50 border-slate-50"
                )}>
                   <Icon className={cn("size-5 transition-all", isActive ? "text-blue-500" : "text-slate-200")} />
                </div>
              </div>
            );
          })}

          {/* Pending / Complete Slots */}
          {generatingOutlines.length > 0 &&
            (() => {
              const outline = generatingOutlines[0];
              const isFailed = failedOutlines.some((f) => f.id === outline.id);
              const isActive = currentSceneId === PENDING_SCENE_ID;

              return (
                <div
                  key={`generating-${outline.id}`}
                  onClick={() => !isFailed && (onSceneSelect ? onSceneSelect(PENDING_SCENE_ID) : setCurrentSceneId(PENDING_SCENE_ID))}
                  className={cn(
                    'group relative rounded-2xl flex flex-col gap-2 p-2 transition-all duration-300 border',
                    isActive ? 'bg-white border-slate-100 shadow-xl shadow-slate-200/40 opacity-100' : 'opacity-60 border-transparent hover:bg-slate-50/50',
                    isFailed && 'opacity-100'
                  )}
                >
                  <div className="flex justify-between items-center px-2 pt-1">
                    <div className="flex items-center gap-2.5 max-w-full">
                      <span className="text-[9px] font-black w-4 h-4 rounded-lg flex items-center justify-center shrink-0 border bg-white border-slate-100 text-slate-200">
                        {(scenes.length + 1).toString().padStart(2, '0')}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 truncate">
                        {outline.title}
                      </span>
                    </div>
                  </div>
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-50 flex items-center justify-center">
                      <RefreshCw className={cn("size-5 text-slate-200", !isFailed && generationStatus !== 'paused' && "animate-spin")} />
                  </div>
                </div>
              );
            })()}

          {isCourseComplete && generatingOutlines.length === 0 &&
            (() => {
              const isActive = currentSceneId === PENDING_SCENE_ID;
              return (
                <div
                  key="course-complete-slot"
                  onClick={() => onSceneSelect ? onSceneSelect(PENDING_SCENE_ID) : setCurrentSceneId(PENDING_SCENE_ID)}
                  className={cn(
                    'group relative rounded-2xl flex flex-col gap-2 p-2 transition-all duration-300 border',
                    isActive ? 'bg-white border-slate-100 shadow-xl shadow-slate-200/40 opacity-100' : 'opacity-60 border-transparent hover:bg-slate-50/50',
                  )}
                >
                  <div className="flex justify-between items-center px-2 pt-1">
                    <div className="flex items-center gap-2.5 max-w-full">
                      <span className={cn(
                        "text-[9px] font-black w-4 h-4 rounded-lg flex items-center justify-center shrink-0 border transition-all",
                        isActive ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100" : "bg-white border-slate-100 text-slate-200"
                      )}>
                        {(scenes.length + 1).toString().padStart(2, '0')}
                      </span>
                      <span className={cn(
                        "text-[11px] font-bold uppercase tracking-wider truncate transition-colors",
                        isActive ? "text-amber-600" : "text-slate-300"
                      )}>
                        Summary
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "relative aspect-video w-full rounded-xl overflow-hidden flex items-center justify-center border transition-colors",
                    isActive ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-50"
                  )}>
                      <Trophy className={cn("size-6 transition-colors", isActive ? "text-amber-500" : "text-slate-200")} />
                  </div>
                </div>
              );
            })()}
        </div>

        <div className="p-8 border-t border-slate-50">
           <div className="px-4 py-2 rounded-xl bg-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400 text-center">
              Session End
           </div>
        </div>
      </div>
    </div>
  );
}
