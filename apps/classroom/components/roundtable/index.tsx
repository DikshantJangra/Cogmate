'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Send,
  MessageSquare,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
  Repeat,
  BookOpen,
  Loader2,
  Volume2,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AudioIndicatorState } from './audio-indicator';
import { CanvasToolbar } from '@/components/canvas/canvas-toolbar';
import { useAudioRecorder } from '@/lib/hooks/use-audio-recorder';
import { useI18n } from '@/lib/hooks/use-i18n';
import { toast } from 'sonner';
import { useSettingsStore, PLAYBACK_SPEEDS } from '@/lib/store/settings';
import { ProactiveCard } from '@/components/chat/proactive-card';
import { PresentationSpeechOverlay } from '@/components/roundtable/presentation-speech-overlay';
import { AvatarDisplay } from '@/components/ui/avatar-display';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { useAgentRegistry } from '@/lib/orchestration/registry/store';
import { DEFAULT_TEACHER_AVATAR, DEFAULT_USER_AVATAR } from '@/components/roundtable/constants';
import type { DiscussionAction } from '@/lib/types/action';
import type { EngineMode, PlaybackView } from '@/lib/playback';
import type { Participant } from '@/lib/types/roundtable';

export interface DiscussionRequest {
  topic: string;
  prompt?: string;
  agentId?: string; // Agent ID to initiate discussion (default: 'default-1')
}

interface RoundtableProps {
  readonly mode?: 'playback' | 'autonomous';
  readonly initialParticipants?: Participant[];
  readonly playbackView?: PlaybackView; // Centralised derived state from Stage
  readonly currentSpeech?: string | null; // Live SSE speech (from StreamBuffer — discussion/QA)
  readonly lectureSpeech?: string | null; // Active lecture speech (from PlaybackEngine, full text)
  readonly idleText?: string | null; // Static idle text (first speech action)
  readonly playbackCompleted?: boolean; // True when engine finished all actions (show restart icon)
  readonly discussionRequest?: DiscussionAction | null;
  readonly engineMode?: EngineMode;
  readonly isStreaming?: boolean;
  readonly sessionType?: 'qa' | 'discussion';
  readonly speakingAgentId?: string | null;
  readonly audioIndicatorState?: AudioIndicatorState;
  readonly audioAgentId?: string | null;
  readonly speechProgress?: number | null; // StreamBuffer reveal progress (0–1) for auto-scroll
  readonly showEndFlash?: boolean;
  readonly endFlashSessionType?: 'qa' | 'discussion';
  readonly thinkingState?: { stage: string; agentId?: string } | null;
  readonly isCueUser?: boolean;
  readonly isTopicPending?: boolean;
  readonly onMessageSend?: (message: string) => void;
  readonly onDiscussionStart?: (request: DiscussionAction) => void;
  readonly onDiscussionSkip?: () => void;
  readonly onStopDiscussion?: () => void;
  readonly onInputActivate?: () => void;

  readonly onResumeTopic?: () => void;
  readonly onPlayPause?: () => void;
  readonly isDiscussionPaused?: boolean;
  readonly onDiscussionPause?: () => void;
  readonly onDiscussionResume?: () => void;
  readonly totalActions?: number;
  readonly currentActionIndex?: number;
  // Toolbar props (merged from CanvasArea)
  readonly currentSceneIndex?: number;
  readonly scenesCount?: number;
  readonly whiteboardOpen?: boolean;
  readonly sidebarCollapsed?: boolean;
  readonly chatCollapsed?: boolean;
  readonly onToggleSidebar?: () => void;
  readonly onToggleChat?: () => void;
  readonly onPrevSlide?: () => void;
  readonly onNextSlide?: () => void;
  readonly onWhiteboardClose?: () => void;
  readonly isPresenting?: boolean;
  readonly controlsVisible?: boolean;
  readonly onTogglePresentation?: () => void;
  readonly onPresentationInteractionChange?: (active: boolean) => void;
  /** Ref to the fullscreen container — passed to ProactiveCard so its portal
   *  renders inside the top-layer during presentation mode. */
  readonly fullscreenContainerRef?: React.RefObject<HTMLDivElement | null>;
}

const VOICE_WAVE_BARS = [
  { peak: 18, duration: 0.55 },
  { peak: 24, duration: 0.72 },
  { peak: 15, duration: 0.63 },
  { peak: 22, duration: 0.68 },
  { peak: 27, duration: 0.78 },
  { peak: 19, duration: 0.61 },
  { peak: 26, duration: 0.74 },
  { peak: 17, duration: 0.58 },
  { peak: 23, duration: 0.7 },
  { peak: 16, duration: 0.57 },
  { peak: 21, duration: 0.66 },
  { peak: 14, duration: 0.53 },
] as const;

function VoiceWaveformBars({ barClassName }: { readonly barClassName: string }) {
  return VOICE_WAVE_BARS.map((bar, i) => (
    <motion.div
      key={i}
      animate={{
        height: [4, bar.peak, 4],
        opacity: [0.3, 1, 0.3],
      }}
      transition={{
        repeat: Infinity,
        duration: bar.duration,
        delay: i * 0.05,
        ease: 'easeInOut',
      }}
      className={cn('w-1 rounded-full', barClassName)}
    />
  ));
}

export function Roundtable({
  mode: _mode = 'autonomous',
  initialParticipants = [],
  playbackView,
  currentSpeech,
  lectureSpeech,
  idleText,
  playbackCompleted,
  discussionRequest,
  engineMode = 'idle',
  isStreaming,
  sessionType,
  speakingAgentId,
  audioIndicatorState,
  audioAgentId,
  speechProgress: _speechProgress,
  showEndFlash,
  endFlashSessionType = 'discussion',
  thinkingState,
  isCueUser,
  isTopicPending,
  onMessageSend,
  onDiscussionStart,
  onDiscussionSkip,
  onStopDiscussion,
  onInputActivate,

  onResumeTopic,
  onPlayPause,
  isDiscussionPaused,
  onDiscussionPause,
  onDiscussionResume,
  currentSceneIndex = 0,
  scenesCount = 1,
  whiteboardOpen = false,
  sidebarCollapsed,
  chatCollapsed,
  onToggleSidebar,
  onToggleChat,
  onPrevSlide,
  onNextSlide,
  onWhiteboardClose,
  isPresenting,
  controlsVisible,
  onTogglePresentation,
  onPresentationInteractionChange,
  fullscreenContainerRef,
}: RoundtableProps) {
  const { t } = useI18n();
  const ttsMuted = useSettingsStore((s) => s.ttsMuted);
  const setTTSMuted = useSettingsStore((s) => s.setTTSMuted);
  const ttsEnabled = useSettingsStore((state) => state.ttsEnabled);
  const asrEnabled = useSettingsStore((state) => state.asrEnabled);
  const chatAreaWidth = useSettingsStore((s) => s.chatAreaWidth);
  const ttsVolume = useSettingsStore((s) => s.ttsVolume);
  const setTTSVolume = useSettingsStore((s) => s.setTTSVolume);
  const autoPlayLecture = useSettingsStore((s) => s.autoPlayLecture);
  const setAutoPlayLecture = useSettingsStore((s) => s.setAutoPlayLecture);
  const playbackSpeed = useSettingsStore((s) => s.playbackSpeed);
  const setPlaybackSpeed = useSettingsStore((s) => s.setPlaybackSpeed);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const agentScrollRef = useRef<HTMLDivElement>(null);
  const bubbleScrollRef = useRef<HTMLDivElement>(null);
  const teacherAvatarRef = useRef<HTMLDivElement>(null);
  const studentAvatarRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const userMessageClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive source text for display
  const isInLiveFlow = sessionType === 'qa' || sessionType === 'discussion';
  const sourceText = isInLiveFlow ? currentSpeech : (lectureSpeech || idleText);
  const isBubbleLoading = thinkingState?.agentId != null || (!sourceText && !isTopicPending && isInLiveFlow);
  const isAgentLoading = thinkingState?.agentId != null;

  // Identify participants
  const teacherParticipant = initialParticipants.find((p) => p.role === 'teacher');
  const studentParticipants = initialParticipants.filter((p) => p.role !== 'teacher');
  const speakingStudent = speakingAgentId ? initialParticipants.find((p) => p.id === speakingAgentId) : null;
  const isTeacherSpeaking = teacherParticipant && speakingAgentId === teacherParticipant.id;

  // Final bubble layout derivation
  const bubbleRole = isCueUser ? 'user' : (isTeacherSpeaking ? 'teacher' : (speakingStudent ? 'agent' : (sourceText ? 'teacher' : null)));
  const bubbleName = bubbleRole === 'user' ? 'You' : (bubbleRole === 'agent' ? speakingStudent?.name : teacherParticipant?.name);
  const bubbleAvatar = bubbleRole === 'user' 
    ? DEFAULT_USER_AVATAR 
    : (bubbleRole === 'agent' ? (speakingStudent?.avatar || DEFAULT_TEACHER_AVATAR) : DEFAULT_TEACHER_AVATAR);
  const bubbleKey = `${bubbleRole}-${speakingAgentId || 'idle'}`;

  const teacherAvatar = teacherParticipant?.avatar || DEFAULT_TEACHER_AVATAR;
  const userAvatar = DEFAULT_USER_AVATAR;

  const handleStopDiscussion = useCallback(() => {
    onStopDiscussion?.();
  }, [onStopDiscussion]);

  return (
    <div
      className={cn(
        'relative flex h-48 bg-white border-t border-slate-50 overflow-visible transition-all duration-500 font-sans',
        isPresenting && !controlsVisible && 'translate-y-full opacity-0',
      )}
    >
      <div className="flex-1 flex min-w-0 relative">
        {/* Left: Content/Speech area */}
        <div className="flex-1 flex flex-col relative min-w-0">
          {/* Main bubble area */}
          <div className="flex-1 relative flex flex-col items-center justify-center px-10">
            {/* Thinking / Status indicator */}
            <AnimatePresence>
              {thinkingState && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-4 left-10 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 shadow-sm"
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                        className="w-1 h-1 rounded-full bg-blue-500"
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t(`thinking.${thinkingState.stage}`)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat bubble */}
            <AnimatePresence mode="wait">
              {bubbleRole && (
                <motion.div
                  key={bubbleKey}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{
                    opacity: isInputOpen || isVoiceOpen ? 0.4 : 1,
                    y: 0,
                  }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.2, ease: [0.21, 1, 0.36, 1] }}
                  className="w-full flex items-center relative z-10"
                >
                  <div
                    className={cn(
                      'flex w-full transition-all duration-500',
                      bubbleRole === 'teacher' ? 'justify-start' : 'justify-end',
                    )}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (bubbleRole === 'user') return;
                        if (isTopicPending) {
                          onResumeTopic?.();
                          return;
                        }
                        if (isInLiveFlow) {
                          if (isDiscussionPaused) {
                            onDiscussionResume?.();
                          } else if (!thinkingState && currentSpeech) {
                            onDiscussionPause?.();
                          }
                          return;
                        }
                        onPlayPause?.();
                      }}
                      className={cn(
                        'relative px-5 pt-3 pb-4 rounded-2xl text-[14px] leading-relaxed transition-all border w-[min(480px,calc(100%-4rem))] group/bubble flex flex-col max-h-[120px] shadow-sm',
                        bubbleRole === 'user'
                          ? 'bg-slate-900 border-slate-900 text-white rounded-br-sm shadow-slate-200'
                          : bubbleRole === 'agent'
                            ? 'bg-blue-50/50 border-blue-100 text-slate-700 rounded-br-sm'
                            : 'bg-white border-slate-100 text-slate-700 rounded-bl-sm hover:border-slate-200 cursor-pointer',
                      )}
                    >
                      {bubbleRole && (
                        <div
                          className={cn(
                            'absolute -top-3 z-20 pointer-events-none select-none',
                            bubbleRole === 'teacher' ? '-left-3' : '-right-3',
                          )}
                          title={bubbleName}
                        >
                          <div
                            className={cn(
                              'w-7 h-7 rounded-full overflow-hidden border-2 bg-white',
                              bubbleRole === 'user'
                                ? 'border-slate-900'
                                : bubbleRole === 'agent'
                                  ? 'border-blue-200'
                                  : 'border-slate-100',
                            )}
                          >
                            <AvatarDisplay src={bubbleAvatar} alt={bubbleName} />
                          </div>
                        </div>
                      )}

                      <div ref={bubbleScrollRef} className="overflow-y-auto scrollbar-hide">
                        {bubbleRole !== 'user' && bubbleName && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                              {bubbleName}
                            </span>
                            {(() => {
                              const aiState = speakingAgentId === audioAgentId ? (audioIndicatorState ?? 'idle') : 'idle';
                              if (aiState === 'generating')
                                return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />;
                              if (aiState === 'playing')
                                return <Volume2 className="w-3 h-3 text-slate-300" />;
                              return null;
                            })()}
                          </div>
                        )}
                        {isBubbleLoading ? (
                          <div className="flex gap-1 items-center py-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full',
                                  isAgentLoading ? 'bg-blue-400' : 'bg-slate-300',
                                )}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words text-slate-600 leading-normal" suppressHydrationWarning>
                            {sourceText}
                            {isTopicPending && (
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 ml-1.5 animate-pulse" />
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Participants area */}
        <div
          className={cn(
            'w-[160px] shrink-0 flex flex-col py-4 border-l border-slate-50 bg-slate-50/20 overflow-visible transition-opacity duration-300',
            isPresenting && !controlsVisible && 'opacity-0 pointer-events-none',
          )}
        >
          {/* Main Teacher Section */}
          <div className="px-4 mb-4">
             <div 
               ref={teacherAvatarRef}
               className={cn(
                 'relative w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-500',
                 speakingAgentId === teacherParticipant?.id 
                   ? 'border-blue-500 shadow-lg shadow-blue-100 scale-[1.02]' 
                   : 'border-white shadow-sm'
               )}
             >
                <AvatarDisplay src={teacherAvatar} alt={teacherParticipant?.name} />
                {speakingAgentId === teacherParticipant?.id && (
                  <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                )}
             </div>
             <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center truncate">
               {teacherParticipant?.name}
             </p>
          </div>

          <div className="flex-1 relative group/scroll overflow-hidden">
            <div
              ref={agentScrollRef}
              className="h-full overflow-y-auto px-4 space-y-3 scrollbar-hide"
            >
                {studentParticipants.map((student) => {
                   const isActive = speakingAgentId === student.id;
                   return (
                     <div key={student.id} className="space-y-2">
                        <div 
                          className={cn(
                            'relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all duration-500',
                            isActive ? 'border-blue-500 shadow-md shadow-blue-50' : 'border-white shadow-sm'
                          )}
                        >
                           <AvatarDisplay src={student.avatar} alt={student.name} />
                        </div>
                        <p className={cn(
                          'text-[9px] font-bold uppercase tracking-tight text-center truncate px-1',
                          isActive ? 'text-blue-600' : 'text-slate-300'
                        )}>
                          {student.name}
                        </p>
                     </div>
                   );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
