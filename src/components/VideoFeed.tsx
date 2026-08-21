import React, { useState } from 'react';
import { ShieldCheck, Play, Sparkles, Filter, CheckCircle2, RotateCcw } from 'lucide-react';
import { VideoItem, PlaybackProgress } from '../types';
import { VideoCard } from './VideoCard';
import { ProgressBar } from './ProgressBar';

interface VideoFeedProps {
  videos: VideoItem[];
  progressMap: Record<string, PlaybackProgress>;
  currentVideo: VideoItem | null;
  onSelectVideo: (video: VideoItem) => void;
  onOpenSecurityModal: () => void;
  onResetProgress: () => void;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
  videos,
  progressMap,
  currentVideo,
  onSelectVideo,
  onOpenSecurityModal,
  onResetProgress,
}) => {
  const [filter, setFilter] = useState<'all' | 'unwatched' | 'completed'>('all');

  const progressList: PlaybackProgress[] = Object.values(progressMap);
  const completedCount = progressList.filter((p) => p.completed).length;
  const totalCount = videos.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  // Find the last in-progress video to show a quick "Resume" banner
  const lastActiveVideoId = progressList
    .sort((a, b) => b.lastWatchedAt - a.lastWatchedAt)
    .find((p) => !p.completed && p.currentTime > 5)?.videoId;

  const resumeVideo = lastActiveVideoId
    ? videos.find((v) => v.id === lastActiveVideoId)
    : null;

  const filteredVideos = videos.filter((v) => {
    const prog = progressMap[v.id];
    if (filter === 'completed') return prog?.completed;
    if (filter === 'unwatched') return !prog?.completed;
    return true;
  });

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-7 pb-28">
      {/* Header section */}
      <header className="flex flex-col gap-4 pb-6 border-b border-white/[0.08]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-neutral-400">
                Private Library
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
              {totalCount} Videos
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-medium mt-0.5">
              Curated private collection • View-only stream
            </p>
          </div>

          {/* View-Only Security Pill */}
          <button
            id="feed-security-badge-btn"
            type="button"
            onClick={onOpenSecurityModal}
            aria-label="View security and DRM info"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#121216] border border-white/[0.09] text-neutral-300 hover:text-white hover:border-white/20 transition-all text-xs font-medium active:scale-95 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden xs:inline font-medium">Protected</span>
          </button>
        </div>

        {/* Collection Progress Card */}
        <div className="p-4 rounded-2xl bg-[#0e0e12]/90 border border-white/[0.08] shadow-lg shadow-black/40 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-200">
              Collection Progress
            </span>
            <span className="font-mono text-neutral-400 font-medium">
              <strong className="text-white font-bold">{completedCount}</strong> of {totalCount} watched ({Math.round(progressPercentage)}%)
            </span>
          </div>

          <ProgressBar
            progress={progressPercentage}
            className="h-1.5 w-full bg-[#181820] rounded-full overflow-hidden"
            barColor="bg-gradient-to-r from-neutral-200 to-white"
            showGlow={completedCount > 0}
          />

          {completedCount > 0 && (
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={onResetProgress}
                className="text-[10px] font-mono text-neutral-400 hover:text-neutral-200 transition-colors underline-offset-2 hover:underline"
              >
                Reset Progress
              </button>
            </div>
          )}
        </div>

        {/* Quick Continue Watching Banner if available */}
        {resumeVideo && (
          <div
            id="continue-watching-banner"
            onClick={() => onSelectVideo(resumeVideo)}
            role="button"
            tabIndex={0}
            className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#141419] to-[#0c0c10] border border-white/[0.1] hover:border-white/[0.25] transition-all cursor-pointer shadow-lg shadow-black/50"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-md">
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Continue Watching
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                  {resumeVideo.title}
                </h4>
              </div>
            </div>

            <span className="text-xs text-neutral-400 font-medium flex-shrink-0 pl-2 group-hover:text-white transition-colors">
              Resume →
            </span>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-white text-black shadow-md shadow-white/10'
                : 'bg-[#101014] text-neutral-400 hover:text-neutral-200 border border-white/[0.08] hover:border-white/[0.16]'
            }`}
          >
            All ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('unwatched')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === 'unwatched'
                ? 'bg-white text-black shadow-md shadow-white/10'
                : 'bg-[#101014] text-neutral-400 hover:text-neutral-200 border border-white/[0.08] hover:border-white/[0.16]'
            }`}
          >
            Unwatched ({totalCount - completedCount})
          </button>

          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === 'completed'
                ? 'bg-white text-black shadow-md shadow-white/10'
                : 'bg-[#101014] text-neutral-400 hover:text-neutral-200 border border-white/[0.08] hover:border-white/[0.16]'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </header>

      {/* Vertical Video Cards List */}
      <main className="mt-5 space-y-3.5">
        {filteredVideos.length > 0 ? (
          filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              progress={progressMap[video.id]}
              onSelect={onSelectVideo}
              isCurrentlyPlaying={currentVideo?.id === video.id}
            />
          ))
        ) : (
          <div className="text-center py-12 px-4 rounded-2xl bg-[#0e0e12]/60 border border-white/[0.07] text-neutral-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-neutral-500" />
            <p className="text-sm font-medium text-neutral-300">
              No videos in this category
            </p>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1a1a22] rounded-xl hover:bg-[#22222c] border border-white/10 transition-colors"
            >
              Show all {totalCount} videos
            </button>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-14 text-center text-xs text-neutral-400 space-y-2 border-t border-white/[0.06] pt-8">
        <p className="font-mono text-neutral-400 font-medium">
          {totalCount}-Episode Private Video Collection • View-Only Mode
        </p>
        <p className="text-[11px] text-neutral-400 max-w-md mx-auto leading-relaxed">
          Videos stream directly within the app container. Normal file downloading and browser saving menus are restricted.
        </p>
      </footer>
    </div>
  );
};
