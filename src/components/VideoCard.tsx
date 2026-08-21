import React, { useState } from 'react';
import { Play, Check, Clock, Sparkles } from 'lucide-react';
import { VideoItem, PlaybackProgress } from '../types';
import { ProgressBar } from './ProgressBar';
import { preventContextMenu, preventDragStart, formatTime } from '../utils/videoSecurity';

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const watchedPercentage = progress && progress.duration > 0
    ? (progress.currentTime / progress.duration) * 100
    : 0;

  const isCompleted = progress?.completed || watchedPercentage >= 90;
  const isStarted = !isCompleted && watchedPercentage > 2;

  return (
    <div
      id={`video-card-${video.id}`}
      onClick={() => onSelect(video)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(video);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Play ${video.title} (${video.duration})`}
      className={`group relative w-full text-left transition-all duration-200 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.985] select-none ${
        isCurrentlyPlaying
          ? 'bg-[#14141a] border border-white/40 ring-1 ring-white/25 shadow-xl shadow-black/80'
          : 'bg-[#0d0d11]/90 hover:bg-[#131317] border border-white/[0.07] hover:border-white/[0.18] shadow-md shadow-black/40'
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-3.5 p-3.5 sm:p-4">
        {/* Thumbnail container */}
        <div
          className="relative aspect-video sm:w-56 w-full flex-shrink-0 bg-[#060608] rounded-xl overflow-hidden shadow-inner border border-white/[0.08]"
          onContextMenu={preventContextMenu}
          onDragStart={preventDragStart}
        >
          {/* Skeleton placeholder while loading */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-[#101014] animate-pulse flex items-center justify-center">
              <span className="text-xs text-neutral-600 font-mono font-medium tracking-wider">
                EP {video.index.toString().padStart(2, '0')}
              </span>
            </div>
          )}

          {/* Actual image or fallback gradient */}
          {!imageError ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              draggable={false}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#18181f] to-[#08080a] p-2 text-center">
              <span className="text-2xl font-bold text-neutral-400 font-mono">
                {video.index.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">
                Private Stream
              </span>
            </div>
          )}

          {/* Dark gradient overlay for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Episode number badge top-left */}
          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded-md bg-black/80 backdrop-blur-md text-neutral-200 border border-white/15 shadow-sm">
              EP {video.index.toString().padStart(2, '0')}
            </span>
          </div>

          {/* Duration badge bottom-right */}
          <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-mono font-semibold rounded bg-black/85 backdrop-blur-md text-neutral-200 border border-white/15">
            <Clock className="w-2.5 h-2.5 text-neutral-400" />
            <span>{video.duration}</span>
          </div>

          {/* Play icon overlay on hover/active */}
          <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xl transition-transform duration-200 ${
              isCurrentlyPlaying
                ? 'bg-white text-black scale-100 shadow-white/20'
                : 'bg-black/75 backdrop-blur-md text-white border border-white/20 group-hover:scale-110 group-hover:bg-white group-hover:text-black group-hover:border-transparent'
            }`}>
              <Play className="w-4 h-4 ml-0.5 fill-current" />
            </div>
          </div>

          {/* Progress bar at the bottom edge of thumbnail */}
          {isStarted && (
            <div className="absolute bottom-0 left-0 right-0 z-20">
              <ProgressBar
                progress={watchedPercentage}
                className="h-1 w-full bg-black/60"
                barColor="bg-gradient-to-r from-red-500 to-red-400"
              />
            </div>
          )}
        </div>

        {/* Card Metadata & Details */}
        <div className="flex flex-col justify-between flex-grow min-w-0 py-0.5">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400">
                Episode {video.index.toString().padStart(2, '0')}
              </span>
              
              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full shadow-sm">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  Watched
                </span>
              )}

              {isStarted && (
                <span className="text-[11px] font-medium text-amber-400/90 bg-amber-950/40 border border-amber-800/30 px-2 py-0.5 rounded-full">
                  {Math.round(watchedPercentage)}% watched
                </span>
              )}

              {isCurrentlyPlaying && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded-full animate-pulse">
                  <Sparkles className="w-2.5 h-2.5" />
                  Playing now
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-neutral-100 tracking-tight leading-snug group-hover:text-white transition-colors line-clamp-1 font-sans">
              {video.title}
            </h3>

            <p className="text-xs sm:text-sm text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
              {video.description}
            </p>
          </div>

          {/* Bottom Card Footer */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.06] text-xs text-neutral-400">
            <div className="flex items-center gap-1.5 flex-wrap">
              {video.tags?.map((tag) => (
                <span key={tag} className="text-[11px] text-neutral-400 bg-[#16161d] border border-white/[0.05] px-2 py-0.5 rounded-md font-mono">
                  {tag}
                </span>
              ))}
            </div>

            {isStarted && progress && (
              <span className="text-[11px] font-mono text-neutral-400">
                {formatTime(progress.currentTime)} left
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
