'use client';

import { useImperativeHandle, forwardRef, useRef, useCallback, useState, useMemo } from 'react';
import type { SessionType } from '@/lib/types/chat';
import type { LectureNoteEntry } from '@/lib/types/chat';
import type { DiscussionRequest } from '@/components/roundtable';
import type { Action, SpeechAction, DiscussionAction } from '@/lib/types/action';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/hooks/use-i18n';
import { useStageStore } from '@/lib/store';
import { PanelRightClose, BookOpen, MessageSquare } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useChatSessions } from './use-chat-sessions';
import { SessionList } from './session-list';
import { LectureNotesView } from './lecture-notes-view';

interface ChatAreaProps {
  className?: string;
  width?: number;
  onWidthChange?: (width: number) => void;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  activeBubbleId?: string | null;
  onActiveBubble?: (messageId: string | null) => void;
  onLiveSpeech?: (text: string | null, agentId?: string | null) => void;
  onSpeechProgress?: (ratio: number | null) => void;
  onThinking?: (state: { stage: string; agentId?: string } | null) => void;
  onCueUser?: (fromAgentId?: string, prompt?: string) => void;
  onLiveSessionError?: () => void;
  onStopSession?: () => void;
  onSegmentSealed?: (
    messageId: string,
    partId: string,
    fullText: string,
    agentId: string | null,
  ) => void;
  /** When provided and returns true, StreamBuffer holds on the current text item after reveal. */
  shouldHoldAfterReveal?: () => { holding: boolean; segmentDone: number } | boolean;
  currentSceneId?: string | null;
}

export interface ChatAreaRef {
  createSession: (type: SessionType, title: string) => Promise<string>;
  endSession: (sessionId: string) => Promise<void>;
  endActiveSession: () => Promise<void>;
  softPauseActiveSession: () => Promise<void>;
  resumeActiveSession: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  startDiscussion: (request: DiscussionRequest) => Promise<void>;
  startLecture: (sceneId: string) => Promise<string>;
  addLectureMessage: (sessionId: string, action: Action, actionIndex: number) => void;
  getIsStreaming: () => boolean;
  getActiveSessionType: () => string | null;
  getLectureMessageId: (sessionId: string) => string | null;
  pauseBuffer: (sessionId: string) => void;
  resumeBuffer: (sessionId: string) => void;
  pauseActiveLiveBuffer: () => boolean;
  resumeActiveLiveBuffer: () => void;
  switchToTab: (tab: 'lecture' | 'chat') => void;
}

const DEFAULT_WIDTH = 340;
const MIN_WIDTH = 240;
const MAX_WIDTH = 560;

export const ChatArea = forwardRef<ChatAreaRef, ChatAreaProps>(
  (
    {
      className,
      width = DEFAULT_WIDTH,
      onWidthChange,
      collapsed = false,
      onCollapseChange,
      activeBubbleId,
      onActiveBubble,
      onLiveSpeech,
      onSpeechProgress,
      onThinking,
      onCueUser,
      onLiveSessionError,
      onStopSession,
      onSegmentSealed,
      shouldHoldAfterReveal,
      currentSceneId,
    },
    ref,
  ) => {
    const { t } = useI18n();
    const scenes = useStageStore((s) => s.scenes);
    const {
      sessions,
      activeSessionType,
      expandedSessionIds,
      isStreaming,
      createSession,
      endSession,
      endActiveSession,
      softPauseActiveSession,
      resumeActiveSession,
      sendMessage,
      startDiscussion,
      startLecture,
      addLectureMessage,
      toggleSessionExpand,
      getLectureMessageId,
      pauseBuffer,
      resumeBuffer,
      pauseActiveLiveBuffer,
      resumeActiveLiveBuffer,
    } = useChatSessions({
      onLiveSpeech,
      onSpeechProgress,
      onThinking,
      onCueUser,
      onActiveBubble,
      onLiveSessionError,
      onStopSession,
      onSegmentSealed,
      shouldHoldAfterReveal,
    });

    const [activeTab, setActiveTab] = useState<'lecture' | 'chat'>('lecture');
    const isDraggingRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Derive lecture notes directly from scenes — updates reactively as scenes stream in
    // Preserves action order so spotlight/laser badges appear inline between speech texts
    const lectureNotes: LectureNoteEntry[] = useMemo(
      () =>
        scenes
          .filter((scene) => scene.actions && scene.actions.length > 0)
          .map((scene) => ({
            sceneId: scene.id,
            sceneTitle: scene.title,
            sceneOrder: scene.order,
            items: scene
              .actions!.filter(
                (a) =>
                  a.type === 'speech' ||
                  a.type === 'spotlight' ||
                  a.type === 'laser' ||
                  a.type === 'play_video' ||
                  a.type === 'discussion',
              )
              .map((a) => {
                if (a.type === 'speech') {
                  return {
                    kind: 'speech' as const,
                    text: (a as SpeechAction).text,
                  };
                }
                return {
                  kind: 'action' as const,
                  type: a.type,
                  label: a.type === 'discussion' ? (a as DiscussionAction).topic : undefined,
                };
              }),
            completedAt: scene.updatedAt || scene.createdAt || 0,
          }))
          .sort((a, b) => a.sceneOrder - b.sceneOrder),
      [scenes],
    );

    // Filter out lecture sessions for the Chat tab
    const chatSessions = useMemo(() => sessions.filter((s) => s.type !== 'lecture'), [sessions]);

    // Whether there's an active discussion/QA session (for amber dot on Chat tab)
    const hasActiveChatSession = useMemo(
      () => chatSessions.some((s) => s.status === 'active'),
      [chatSessions],
    );

    // Wrap endSession for QA/Discussion: also notify parent for engine cleanup
    const handleEndSession = useCallback(
      async (sessionId: string) => {
        await endSession(sessionId);
        onStopSession?.();
      },
      [endSession, onStopSession],
    );

    const switchToTab = useCallback((tab: 'lecture' | 'chat') => {
      setActiveTab(tab);
    }, []);

    useImperativeHandle(ref, () => ({
      createSession,
      endSession,
      endActiveSession,
      softPauseActiveSession,
      resumeActiveSession,
      sendMessage,
      startDiscussion,
      startLecture,
      addLectureMessage,
      getIsStreaming: () => isStreaming,
      getActiveSessionType: () => activeSessionType,
      getLectureMessageId,
      pauseBuffer,
      resumeBuffer,
      pauseActiveLiveBuffer,
      resumeActiveLiveBuffer,
      switchToTab,
    }));

    // Drag-to-resize
    const handleDragStart = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        setIsDragging(true);
        const startX = e.clientX;
        const startWidth = width;

        const handleMouseMove = (me: MouseEvent) => {
          const delta = startX - me.clientX;
          const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
          onWidthChange?.(newWidth);
        };

        const handleMouseUp = () => {
          isDraggingRef.current = false;
          setIsDragging(false);
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
      [width, onWidthChange],
    );

    const displayWidth = collapsed ? 0 : width;

    return (
      <div
        style={{
          width: displayWidth,
          transition: isDragging ? 'none' : 'width 0.3s ease',
        }}
        className={cn(
          'bg-white border-l border-slate-50 flex flex-col shrink-0 z-20 relative overflow-visible font-sans',
          className,
        )}
      >
        {/* Drag handle */}
        {!collapsed && (
          <div
            onMouseDown={handleDragStart}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-50 group hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors"
          >
          </div>
        )}

        <div className={cn('flex flex-col w-full h-full overflow-hidden', collapsed && 'hidden')}>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'lecture' | 'chat')}
            className="flex flex-col h-full gap-0"
          >
            {/* Tab header row */}
            <div className="h-16 flex items-center gap-1 shrink-0 px-6 border-b border-slate-50">
              <TabsList variant="line" className="h-full flex-1 w-0 bg-transparent gap-4">
                <TabsTrigger value="lecture" className="text-[11px] font-bold uppercase tracking-wider gap-2 flex-1 h-full data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent transition-all">
                  <BookOpen className="w-3.5 h-3.5" />
                  {t('chat.tabs.lecture')}
                </TabsTrigger>
                <TabsTrigger value="chat" className="text-[11px] font-bold uppercase tracking-wider gap-2 flex-1 h-full data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none border-b-2 border-transparent transition-all relative">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {t('chat.tabs.chat')}
                  {/* Amber pulse dot when there's an active chat session and user is on Notes tab */}
                  {hasActiveChatSession && activeTab === 'lecture' && (
                    <span className="absolute top-3 right-2 flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {onCollapseChange && (
                <button
                  onClick={() => onCollapseChange(true)}
                  className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all ml-2"
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Notes Tab */}
            <TabsContent value="lecture" className="flex-1 overflow-hidden flex flex-col bg-slate-50/20">
              <LectureNotesView notes={lectureNotes} currentSceneId={currentSceneId} />
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 overflow-hidden flex flex-col bg-slate-50/20">
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4 scrollbar-hide">
                {chatSessions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-200 shadow-sm">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">
                        {t('chat.noConversations')}
                      </p>
                      <p className="text-[12px] text-slate-400 max-w-[200px]">
                        {t('chat.startConversation')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <SessionList
                      sessions={chatSessions}
                      expandedSessionIds={expandedSessionIds}
                      isStreaming={isStreaming}
                      activeBubbleId={activeBubbleId}
                      onToggleExpand={toggleSessionExpand}
                      onEndSession={handleEndSession}
                    />
                    <div ref={bottomRef} />
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  },
);

ChatArea.displayName = 'ChatArea';
