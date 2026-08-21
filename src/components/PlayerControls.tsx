import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  Settings,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { VideoItem } from '../types';
import { formatTime, preventContextMenu } from '../utils/videoSecurity';

interface PlayerControlsProps {
  video: VideoItem;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number; // percentage (0-100)
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  hasPrevVideo: boolean;
  hasNextVideo: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onSeekRelative: (deltaSeconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onToggleFullscreen: () => void;
  onPrevVideo: () => void;
  onNextVideo: () => void;
  onBack: () => void;
  onOpenSecurityModal?: () => void;
  visible: boolean;
}

const PLAYBACK_RATES = [0.75, 1.0, 1.25, 1.5, 2.0];

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  video,
  isPlaying,
  currentTime,
  duration,
  buffered,
  volume,
  isMuted,
  playbackRate,
  isFullscreen,
  hasPrevVideo,
  hasNextVideo,
  onPlayPause,
  onSeek,
  onSeekRelative,
  onVolumeChange,
  onToggleMute,
  onPlaybackRateChange,
  onToggleFullscreen,
  onPrevVideo,
  onNextVideo,
  onBack,
  onOpenSecurityModal,
  visible,
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const [hoverSeekPosition, setHoverSeekPosition] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const seekBarRef = useRef<HTMLDivElement>(null);

  // Close speed menu when clicking outside or when controls become hidden
  useEffect(() => {
    if (!visible) {
      setShowSpeedMenu(false);
      setShowVolumeSlider(false);
    }
  }, [visible]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsSeeking(true);
    updateSeekFromEvent(e);
  };

  const updateSeekFromEvent = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement> | MouseEvent | TouchEvent) => {
    if (!seekBarRef.current || duration <= 0) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const targetPercent = offsetX / rect.width;
    const targetTime = targetPercent * duration;
    onSeek(targetTime);
  };

  const handleSeekMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || duration <= 0) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const targetPercent = offsetX / rect.width;
    setHoverSeekTime(targetPercent * duration);
    setHoverSeekPosition(offsetX);
  };

  const handleSeekLeave = () => {
    setHoverSeekTime(null);
  };

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col justify-between p-4 sm:p-6 transition-opacity duration-300 pointer-events-none select-none ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onContextMenu={preventContextMenu}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-3">
          <button
            id="player-back-btn"
            type="button"
            onClick={onBack}
            aria-label="Back to collection"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/70 backdrop-blur-xl text-white hover:bg-neutral-800 transition-colors border border-white/15 active:scale-95 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-400">
              Episode {video.index.toString().padStart(2, '0')}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1 font-sans">
              {video.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Only Security indicator */}
          <button
            id="player-security-btn"
            type="button"
            onClick={onOpenSecurityModal}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#121218]/80 backdrop-blur-xl border border-white/10 text-neutral-300 hover:text-white hover:border-white/25 transition-colors text-xs font-medium shadow-md"
            title="View-Only Protected Stream"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>View Only</span>
          </button>

          {/* Speed Selector Trigger */}
          <div className="relative">
            <button
              id="player-speed-btn"
              type="button"
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-xl border border-white/15 text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors text-xs font-mono font-semibold shadow-md"
              aria-label="Playback Speed"
            >
              <span>{playbackRate}x</span>
            </button>

            {/* Speed selection dropdown */}
            {showSpeedMenu && (
              <div className="absolute right-0 top-full mt-2 w-32 bg-[#101015]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 border-b border-white/[0.08]">
                  Speed
                </div>
                {PLAYBACK_RATES.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => {
                      onPlaybackRateChange(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium transition-colors ${
                      playbackRate === rate
                        ? 'bg-[#20202a] text-white font-bold'
                        : 'text-neutral-300 hover:bg-[#181820] hover:text-white'
                    }`}
                  >
                    <span>{rate}x</span>
                    {playbackRate === rate && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center Big Playback Actions (Prev, -10s, Play/Pause, +10s, Next) */}
      <div className="flex items-center justify-center gap-4 sm:gap-8 pointer-events-auto">
        {/* Previous Video Button */}
        <button
          id="player-prev-video-btn"
          type="button"
          onClick={onPrevVideo}
          disabled={!hasPrevVideo}
          aria-label="Previous Video"
          className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-xl text-white border border-white/15 transition-all ${
            hasPrevVideo
              ? 'hover:bg-neutral-800 hover:scale-105 active:scale-95 shadow-md'
              : 'opacity-30 cursor-not-allowed'
          }`}
        >
          <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Rewind 10 Seconds */}
        <button
          id="player-rewind-10-btn"
          type="button"
          onClick={() => onSeekRelative(-10)}
          aria-label="Rewind 10 seconds"
          className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/60 backdrop-blur-xl text-white border border-white/20 hover:bg-neutral-800 hover:scale-105 active:scale-95 transition-all shadow-lg"
        >
          <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Main Center Play / Pause */}
        <button
          id="player-play-pause-btn"
          type="button"
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-black shadow-2xl hover:scale-105 active:scale-95 transition-all shadow-white/20"
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 sm:w-9 sm:h-9 fill-current" />
          ) : (
            <Play className="w-7 h-7 sm:w-9 sm:h-9 ml-1 fill-current" />
          )}
        </button>

        {/* Forward 10 Seconds */}
        <button
          id="player-forward-10-btn"
          type="button"
          onClick={() => onSeekRelative(10)}
          aria-label="Forward 10 seconds"
          className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/60 backdrop-blur-xl text-white border border-white/20 hover:bg-neutral-800 hover:scale-105 active:scale-95 transition-all shadow-lg"
        >
          <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Next Video Button */}
        <button
          id="player-next-video-btn"
          type="button"
          onClick={onNextVideo}
          disabled={!hasNextVideo}
          aria-label="Next Video"
          className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-xl text-white border border-white/15 transition-all ${
            hasNextVideo
              ? 'hover:bg-neutral-800 hover:scale-105 active:scale-95 shadow-md'
              : 'opacity-30 cursor-not-allowed'
          }`}
        >
          <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Bottom Controls (Seekbar, Timers, Volume, Fullscreen) */}
      <div className="flex flex-col gap-2 w-full pointer-events-auto bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 sm:p-4 rounded-3xl backdrop-blur-sm">
        {/* Interactive Custom Seek Bar */}
        <div
          ref={seekBarRef}
          onMouseDown={handleSeekStart}
          onTouchStart={handleSeekStart}
          onMouseMove={handleSeekMove}
          onMouseLeave={handleSeekLeave}
          className="relative w-full h-6 flex items-center cursor-pointer group"
          role="slider"
          aria-label="Video scrubber"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
        >
          {/* Hover Time Tooltip */}
          {hoverSeekTime !== null && (
            <div
              className="absolute -top-8 transform -translate-x-1/2 px-2.5 py-0.5 rounded-lg bg-[#14141a] border border-white/20 text-[11px] font-mono text-white pointer-events-none z-40 shadow-xl"
              style={{ left: `${hoverSeekPosition}px` }}
            >
              {formatTime(hoverSeekTime)}
            </div>
          )}

          {/* Scrubber track background */}
          <div className="relative w-full h-1.5 group-hover:h-2.5 bg-[#1a1a22] rounded-full overflow-hidden transition-all duration-150">
            {/* Buffered track */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-[#282834] rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, buffered))}%` }}
            />
            {/* Played progress track */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-white rounded-full transition-all shadow-[0_0_10px_rgba(255,255,255,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Scrubber Handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transform -translate-x-1/2 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all pointer-events-none ring-2 ring-black/40"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Bottom Status Bar */}
        <div className="flex items-center justify-between text-xs font-mono text-neutral-300 pt-0.5">
          {/* Time indicator */}
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-white font-bold">{formatTime(currentTime)}</span>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400">{formatTime(duration)}</span>
          </div>

          {/* Right Action Group (Volume & Fullscreen) */}
          <div className="flex items-center gap-3">
            {/* Volume control */}
            <div
              className="relative flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                id="player-mute-btn"
                type="button"
                onClick={onToggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              {/* Volume Slider for desktop */}
              {showVolumeSlider && (
                <div className="hidden sm:flex items-center w-20 ml-1 bg-[#121218]/95 px-2.5 py-2 rounded-xl border border-white/10 shadow-lg">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    aria-label="Volume slider"
                    className="w-full h-1 bg-[#252530] rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              id="player-fullscreen-btn"
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
