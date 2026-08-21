import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';
import { VideoItem, PlaybackProgress } from '../types';
import { ProgressBar } from './ProgressBar';
import { preventContextMenu, preventDragStart, VIEW_ONLY_VIDEO_ATTRIBUTES } from '../utils/videoSecurity';

interface VideoCardProps {
  video: VideoItem;
  progress?: PlaybackProgress;
  onSelect: (video: VideoItem) => void;
  isCurrentlyPlaying?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  progress,
  onSelect,
  isCurrentlyPlaying = false,
}) => {
  const previewRef = useRef<HTMLVideoElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(true);

  const watchedPercentage = progress && progress.duration > 0
    ? (progress.currentTime / progress.duration) * 100
    : 0;
  const isCompleted = progress?.completed || watchedPercentage >= 90;
  const isStarted = !isCompleted && watchedPercentage > 2;

  // Seek to 1s on mount so the first frame shows as thumbnail
  useEffect(() => {
    const vid = previewRef.current;
    if (!vid) return;
    const onLoaded = () => { vid.currentTime = 1; };
    vid.addEventListener('loadedmetadata', onLoaded);
    return () => vid.removeEventListener('loadedmetadata', onLoaded);
  }, [video.videoUrl]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    hoverTimerRef.current = setTimeout(() => {
      const vid = previewRef.current;
      if (!vid) return;
      vid.muted = true;
      vid.currentTime = 0;
      vid.play().catch(() => {});
    }, 400);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    const vid = previewRef.current;
    if (vid) {
      vid.pause();
      vid.currentTime = 1; // snap back to thumbnail frame
    }
    setPreviewMuted(true);
  }, []);

  useEffect(() => () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !previewMuted;
    setPreviewMuted(next);
    if (previewRef.current) previewRef.current.muted = next;
  };

  return (
    <div
      id={`video-card-${video.id}`}
      onClick={() => onSelect(video)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(video); }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`Play ${video.title}`}
      className={`group relative w-full text-left cursor-pointer select-none rounded-2xl overflow-hidden transition-all duration-300 ${
        isCurrentlyPlaying
          ? 'ring-2 ring-white/50 shadow-2xl shadow-white/10 scale-[1.01]'
          : 'hover:scale-[1.01] active:scale-[0.99]'
      }`}
    >
      {/* ── Video thumbnail / preview area ── */}
      <div
        className="relative w-full aspect-video bg-black overflow-hidden"
        onContextMenu={preventContextMenu}
        onDragStart={preventDragStart}
      >
        {/* Video — always visible, paused at frame 1 when idle, plays on hover */}
        <video
          ref={previewRef}
          src={video.videoUrl}
          {...VIEW_ONLY_VIDEO_ATTRIBUTES}
          muted
          loop
          preload="metadata"
          controls={false}
          onContextMenu={preventContextMenu}
          onDragStart={preventDragStart}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Gradient overlay — stronger when idle so play button pops */}
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 bg-gradient-to-t from-black/80 via-black/20 to-black/10 ${
          isHovering ? 'opacity-60' : 'opacity-100'
        }`} />

        {/* Center play button — fades out while previewing */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
          isHovering ? 'opacity-0 scale-75' : 'opacity-100'
        }`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border transition-all duration-300 ${
            isCurrentlyPlaying
              ? 'bg-white border-transparent text-black'
              : 'bg-black/50 border-white/30 text-white backdrop-blur-md group-hover:bg-white group-hover:text-black group-hover:border-transparent group-hover:scale-110'
          }`}>
            <Play className="w-6 h-6 ml-0.5 fill-current" />
          </div>
        </div>

        {/* Duration badge — bottom right */}
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-mono font-bold text-white border border-white/10 shadow">
          {video.duration}
        </div>

        {/* Watched badge — top right */}
        {isCompleted && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-[10px] font-bold text-white shadow-lg">
            <CheckCircle2 className="w-3 h-3" />
            Watched
          </div>
        )}

        {/* Now playing indicator — top left */}
        {isCurrentlyPlaying && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
            Now Playing
          </div>
        )}

        {/* Mute toggle — only while hovering & video is playing */}
        {isHovering && (
          <button
            type="button"
            onClick={toggleMute}
            className="absolute bottom-2.5 left-2.5 z-20 p-2 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20 hover:bg-white hover:text-black transition-all active:scale-90 shadow-lg"
            aria-label={previewMuted ? 'Unmute' : 'Mute'}
          >
            {previewMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Watch progress bar */}
        {isStarted && (
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <ProgressBar
              progress={watchedPercentage}
              className="h-[3px] w-full bg-white/10"
              barColor="bg-red-500"
            />
          </div>
        )}
      </div>

      {/* ── Card footer — title only ── */}
      <div className={`px-3.5 py-3 transition-colors duration-200 ${
        isCurrentlyPlaying ? 'bg-[#161620]' : 'bg-[#0d0d12] group-hover:bg-[#111118]'
      }`}>
        <h3 className="text-sm font-bold text-neutral-100 group-hover:text-white transition-colors font-sans tracking-tight">
          {video.title}
        </h3>
      </div>
    </div>
  );
};
