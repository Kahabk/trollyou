import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Loader2,
  AlertTriangle,
  RotateCcw,
  RotateCw,
  Play,
  SkipForward,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { VideoItem, PlaybackProgress } from '../types';
import { PlayerControls } from './PlayerControls';
import {
  preventContextMenu,
  preventDragStart,
  VIEW_ONLY_VIDEO_ATTRIBUTES,
  formatTime,
} from '../utils/videoSecurity';

interface VideoPlayerProps {
  video: VideoItem;
  allVideos: VideoItem[];
  progress?: PlaybackProgress;
  onSaveProgress: (videoId: string, currentTime: number, duration: number) => void;
  onMarkCompleted: (videoId: string, duration?: number) => void;
  onNextVideo: () => void;
  onPrevVideo: () => void;
  onBack: () => void;
  onOpenSecurityModal: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  allVideos,
  progress,
  onSaveProgress,
  onMarkCompleted,
  onNextVideo,
  onPrevVideo,
  onBack,
  onOpenSecurityModal,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.durationSeconds || 0);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Resume prompt state
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [resumeTime, setResumeTime] = useState(0);

  // Double tap ripple state
  const [doubleTapSide, setDoubleTapSide] = useState<'left' | 'right' | null>(null);
  const lastTapTimeRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  // Auto-advance countdown on video end
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);

  const currentIndex = allVideos.findIndex((v) => v.id === video.id);
  const hasPrevVideo = currentIndex > 0;
  const hasNextVideo = currentIndex < allVideos.length - 1;

  // Auto-hide controls timer
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 1500);
    }
  }, [isPlaying]);

  // Candidate URL fallback paths for robust deployment across subpaths/hosting providers
  const candidateUrls = React.useMemo(() => {
    const fileName = `${video.index}.mp4`;
    const set = new Set<string>();
    if (video.videoUrl) set.add(video.videoUrl);
    set.add(`/videos/${fileName}`);
    set.add(`videos/${fileName}`);
    set.add(`./videos/${fileName}`);
    set.add(`/assets/.aistudio/videos/${fileName}`);
    set.add(`assets/.aistudio/videos/${fileName}`);
    return Array.from(set);
  }, [video.index, video.videoUrl]);

  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);

  useEffect(() => {
    setCurrentUrlIndex(0);
  }, [video.id]);

  const activeSrc = candidateUrls[currentUrlIndex] || video.videoUrl;

  const handleVideoError = () => {
    if (currentUrlIndex + 1 < candidateUrls.length) {
      console.warn(`Video source failed at ${activeSrc}. Trying fallback: ${candidateUrls[currentUrlIndex + 1]}`);
      setCurrentUrlIndex((prev) => prev + 1);
    } else {
      setIsLoading(false);
      setHasError(true);
      setErrorMessage('Unable to stream video. Please check connection or source file.');
    }
  };

  // Check if we should offer resume from saved position
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    setAutoAdvanceCountdown(null);
    setCurrentTime(0);

    const savedProgress = progress;
    if (
      savedProgress &&
      savedProgress.currentTime > 8 &&
      (!savedProgress.completed || savedProgress.currentTime < savedProgress.duration - 10)
    ) {
      setResumeTime(savedProgress.currentTime);
      setShowResumePrompt(true);
    } else {
      setShowResumePrompt(false);
    }
  }, [video.id, progress]);

  // Set up video element playback & rate
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.playbackRate = playbackRate;
  }, [playbackRate]);

  // Handle Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Sync volume
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
    }
    setIsMuted(newVolume === 0);
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
    if (!newMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const handlePlayPause = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (vid.paused) {
      vid.play().catch((err) => {
        console.warn('Autoplay prevented or failed:', err);
      });
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
    resetControlsTimer();
  }, [resetControlsTimer]);

  const handleSeek = (targetTime: number) => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.currentTime = Math.max(0, Math.min(targetTime, duration));
    setCurrentTime(vid.currentTime);
    onSaveProgress(video.id, vid.currentTime, duration);
    resetControlsTimer();
  };

  const handleSeekRelative = (delta: number) => {
    const vid = videoRef.current;
    if (!vid) return;

    const newTime = Math.max(0, Math.min(vid.currentTime + delta, duration));
    vid.currentTime = newTime;
    setCurrentTime(newTime);
    onSaveProgress(video.id, newTime, duration);
    resetControlsTimer();
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
        case 'j':
          e.preventDefault();
          handleSeekRelative(-10);
          break;
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          handleSeekRelative(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          handleToggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case 'Escape':
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
          } else {
            onBack();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlayPause, volume, onBack]);

  // Video HTML5 event handlers
  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return;

    setCurrentTime(vid.currentTime);

    // Save progress periodically (e.g. every 2-3 seconds)
    if (Math.floor(vid.currentTime) % 2 === 0 && vid.duration > 0) {
      onSaveProgress(video.id, vid.currentTime, vid.duration);
    }

    // Buffer calculation
    if (vid.buffered.length > 0 && vid.duration > 0) {
      const bufferedEnd = vid.buffered.end(vid.buffered.length - 1);
      setBuffered((bufferedEnd / vid.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    const vid = videoRef.current;
    if (!vid) return;

    setDuration(vid.duration);
    setIsLoading(false);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    onMarkCompleted(video.id, duration);

    if (hasNextVideo) {
      // Start 5-second countdown to next video
      setAutoAdvanceCountdown(5);
    }
  };

  // Auto advance countdown effect
  useEffect(() => {
    if (autoAdvanceCountdown === null) return;

    if (autoAdvanceCountdown <= 0) {
      onNextVideo();
      setAutoAdvanceCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setAutoAdvanceCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoAdvanceCountdown, onNextVideo]);

  // Double tap gesture detection on screen
  const handleScreenTouch = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const timeDiff = now - lastTapTimeRef.current.time;
    const isDoubleTap = timeDiff < 300 && Math.abs(clientX - lastTapTimeRef.current.x) < 50;

    if (isDoubleTap) {
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
      const isRight = clientX > containerWidth / 2;

      if (isRight) {
        handleSeekRelative(10);
        setDoubleTapSide('right');
      } else {
        handleSeekRelative(-10);
        setDoubleTapSide('left');
      }

      setTimeout(() => setDoubleTapSide(null), 600);
      lastTapTimeRef.current = { time: 0, x: 0 };
    } else {
      lastTapTimeRef.current = { time: now, x: clientX };
      // Toggle controls on single tap
      setControlsVisible((prev) => !prev);
      resetControlsTimer();
    }
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black select-none overflow-hidden"
      onMouseMove={resetControlsTimer}
      onContextMenu={preventContextMenu}
    >
      {/* Background Dim & Backdrop */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {/* The Native HTML5 Video Element with View-Only Attributes */}
        <video
          ref={videoRef}
          src={activeSrc}
          controls={false}
          {...VIEW_ONLY_VIDEO_ATTRIBUTES}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => {
            setIsLoading(false);
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          onContextMenu={preventContextMenu}
          onDragStart={preventDragStart}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Transparent touch catcher for single/double tap detection */}
        <div
          id="video-screen-touch-surface"
          className="absolute inset-0 z-20 cursor-pointer"
          onClick={handleScreenTouch}
          onContextMenu={preventContextMenu}
          onDragStart={preventDragStart}
        />

        {/* Double-tap visual ripples */}
        <AnimatePresence>
          {doubleTapSide === 'left' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute left-12 top-1/2 -translate-y-1/2 z-40 pointer-events-none flex flex-col items-center justify-center p-5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30"
            >
              <RotateCcw className="w-8 h-8" />
              <span className="text-xs font-mono font-bold mt-1">-10s</span>
            </motion.div>
          )}

          {doubleTapSide === 'right' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute right-12 top-1/2 -translate-y-1/2 z-40 pointer-events-none flex flex-col items-center justify-center p-5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30"
            >
              <RotateCw className="w-8 h-8" />
              <span className="text-xs font-mono font-bold mt-1">+10s</span>
            </motion.div>
          )}
        </AnimatePresence>




        {/* Resume Position Prompt */}
        <AnimatePresence>
          {showResumePrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-40 w-[90%] max-w-sm p-4 rounded-2xl bg-[#101016]/95 backdrop-blur-2xl border border-white/15 shadow-2xl text-white"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium">
                    Resume from <strong className="font-mono text-white">{formatTime(resumeTime)}</strong>?
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResumePrompt(false);
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        videoRef.current.play().catch(() => {});
                      }
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium text-neutral-400 hover:text-white rounded-lg bg-[#181822] hover:bg-[#20202e] transition-colors"
                  >
                    Start Over
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResumePrompt(false);
                      if (videoRef.current) {
                        videoRef.current.currentTime = resumeTime;
                        videoRef.current.play().catch(() => {});
                      }
                    }}
                    className="px-3.5 py-1 text-[11px] font-bold text-black bg-white hover:bg-neutral-200 rounded-lg shadow-sm transition-colors"
                  >
                    Resume
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auto-Advance Next Video Modal */}
        <AnimatePresence>
          {autoAdvanceCountdown !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            >
              <div className="flex flex-col items-center text-center max-w-xs p-6 rounded-3xl bg-[#0e0e14]/95 backdrop-blur-2xl border border-white/12 shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-emerald-950/70 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_12px_rgba(52,211,153,0.3)]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Episode Completed
                </h3>
                <p className="text-xs text-neutral-400 mb-4 font-mono">
                  Next video playing in {autoAdvanceCountdown}s
                </p>

                <div className="flex items-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setAutoAdvanceCountdown(null)}
                    className="flex-1 py-2.5 rounded-xl bg-[#1a1a24] text-xs font-semibold text-neutral-300 hover:text-white border border-white/[0.08] transition-colors"
                  >
                    Replay
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAutoAdvanceCountdown(null);
                      onNextVideo();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-white text-black text-xs font-bold flex items-center justify-center gap-1 hover:bg-neutral-200 shadow-md transition-colors"
                  >
                    <span>Play Next</span>
                    <SkipForward className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Fallback Screen */}
        {hasError && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-[#07070a]/95 text-center">
            <div className="p-4 rounded-full bg-red-950/60 border border-red-800/40 text-red-400 mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-sans">
              Video Unavailable
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mb-6 leading-relaxed">
              {errorMessage || 'Please check your connection and try again.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 text-xs font-medium text-neutral-300 bg-[#121218] border border-white/10 rounded-xl hover:bg-[#1a1a22] transition-colors"
              >
                Back to Library
              </button>
              <button
                type="button"
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                    videoRef.current.play().catch(() => {});
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-black bg-white rounded-xl hover:bg-neutral-200 shadow-md transition-colors"
              >
                Retry Playback
              </button>
            </div>
          </div>
        )}

        {/* Custom On-Screen Player Controls */}
        <PlayerControls
          video={video}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          buffered={buffered}
          volume={volume}
          isMuted={isMuted}
          playbackRate={playbackRate}
          isFullscreen={isFullscreen}
          hasPrevVideo={hasPrevVideo}
          hasNextVideo={hasNextVideo}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onSeekRelative={handleSeekRelative}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onPlaybackRateChange={setPlaybackRate}
          onToggleFullscreen={handleToggleFullscreen}
          onPrevVideo={onPrevVideo}
          onNextVideo={onNextVideo}
          onBack={onBack}
          onOpenSecurityModal={onOpenSecurityModal}
          visible={controlsVisible}
        />
      </div>
    </motion.div>
  );
};
