import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { VideoItem } from '../types';
import { formatTime, preventContextMenu } from '../utils/videoSecurity';

interface PlayerControlsProps {
  video: VideoItem;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
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
  visible,
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const [hoverSeekPosition, setHoverSeekPosition] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const seekBarRef = useRef<HTMLDivElement>(null);

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
    onSeek(targetPercent * duration);
  };

  const handleSeekMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || duration <= 0) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setHoverSeekTime((offsetX / rect.width) * duration);
    setHoverSeekPosition(offsetX);
  };

  const handleSeekLeave = () => setHoverSeekTime(null);

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col justify-between pointer-events-none select-none transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onContextMenu={preventContextMenu}
    >
      {/* ── Top bar: back button only ── */}
      <div className="flex items-center p-4 pointer-events-auto">
        <button
          id="player-back-btn"
          type="button"
          onClick={onBack}
          aria-label="Back to collection"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl text-white hover:bg-black/80 transition-colors border border-white/15 active:scale-95 shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* ── Middle: empty (no center buttons) ── */}
      <div />

      {/* ── Bottom bar: seekbar + controls ── */}
      <div
        className="flex flex-col gap-2 w-full pointer-events-auto px-3 pb-4 pt-8"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}
      >
        {/* Seekbar */}
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
          {/* Hover tooltip */}
          {hoverSeekTime !== null && (
            <div
              className="absolute -top-8 transform -translate-x-1/2 px-2.5 py-0.5 rounded-lg bg-[#14141a] border border-white/20 text-[11px] font-mono text-white pointer-events-none z-40 shadow-xl"
              style={{ left: `${hoverSeekPosition}px` }}
            >
              {formatTime(hoverSeekTime)}
            </div>
          )}
          <div className="relative w-full h-1 group-hover:h-2 bg-white/20 rounded-full overflow-hidden transition-all duration-150">
            <div
              className="absolute top-0 bottom-0 left-0 bg-white/30 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, buffered))}%` }}
            />
            <div
              className="absolute top-0 bottom-0 left-0 bg-white rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 -translate-x-1/2 transition-all pointer-events-none"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between text-white">
          {/* Left: play/pause + seek buttons + time */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              id="player-play-pause-btn"
              type="button"
              onClick={onPlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors active:scale-90"
            >
              {isPlaying
                ? <Pause className="w-5 h-5 fill-current" />
                : <Play className="w-5 h-5 ml-0.5 fill-current" />}
            </button>

            {/* Rewind */}
            <button
              id="player-rewind-10-btn"
              type="button"
              onClick={() => onSeekRelative(-10)}
              aria-label="Rewind 10s"
              className="p-2 rounded-xl hover:bg-white/10 transition-colors active:scale-90"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Forward */}
            <button
              id="player-forward-10-btn"
              type="button"
              onClick={() => onSeekRelative(10)}
              aria-label="Forward 10s"
              className="p-2 rounded-xl hover:bg-white/10 transition-colors active:scale-90"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Time */}
            <span className="text-xs font-mono text-neutral-300 ml-1">
              <span className="text-white font-bold">{formatTime(currentTime)}</span>
              <span className="text-neutral-500 mx-1">/</span>
              {formatTime(duration)}
            </span>
          </div>

          {/* Right: volume + speed + fullscreen */}
          <div className="flex items-center gap-1">
            {/* Volume */}
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
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                {isMuted || volume === 0
                  ? <VolumeX className="w-4 h-4 text-red-400" />
                  : <Volume2 className="w-4 h-4" />}
              </button>
              {showVolumeSlider && (
                <div className="hidden sm:flex items-center w-20 ml-1 bg-[#121218]/95 px-2.5 py-2 rounded-xl border border-white/10">
                  <input
                    type="range" min={0} max={1} step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    aria-label="Volume"
                    className="w-full h-1 bg-[#252530] rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              )}
            </div>

            {/* Speed */}
            <div className="relative">
              <button
                id="player-speed-btn"
                type="button"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-xs font-mono font-bold"
                aria-label="Speed"
              >
                {playbackRate}x
              </button>
              {showSpeedMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-28 bg-[#101015]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-1 z-50">
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => { onPlaybackRateChange(rate); setShowSpeedMenu(false); }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium transition-colors ${
                        playbackRate === rate ? 'bg-[#20202a] text-white font-bold' : 'text-neutral-300 hover:bg-[#181820] hover:text-white'
                      }`}
                    >
                      <span>{rate}x</span>
                      {playbackRate === rate && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              id="player-fullscreen-btn"
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
