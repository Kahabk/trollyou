import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { VideoItem } from './types';
import { VIDEOS_COLLECTION } from './data/videos';
import { useVideoProgress } from './hooks/useVideoProgress';
import { VideoFeed } from './components/VideoFeed';
import { VideoPlayer } from './components/VideoPlayer';
import { SecurityInfoModal } from './components/SecurityInfoModal';
import { Navigation } from './components/Navigation';

export default function App() {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<'library' | 'player' | 'security'>('library');

  const {
    progressMap,
    saveProgress,
    markCompleted,
    resetAllProgress,
  } = useVideoProgress();

  // Switch tabs
  const handleNavTabChange = (tab: 'library' | 'player' | 'security') => {
    if (tab === 'security') {
      setIsSecurityModalOpen(true);
      return;
    }
    if (tab === 'player' && selectedVideo) {
      setActiveNavTab('player');
      return;
    }
    setActiveNavTab('library');
    if (tab === 'library') {
      // Return to library while preserving video state
      setSelectedVideo(null);
    }
  };

  const handleSelectVideo = (video: VideoItem) => {
    setSelectedVideo(video);
    setActiveNavTab('player');
  };

  const handleBackToLibrary = () => {
    setSelectedVideo(null);
    setActiveNavTab('library');
  };

  const handleNextVideo = () => {
    if (!selectedVideo) return;
    const currentIndex = VIDEOS_COLLECTION.findIndex((v) => v.id === selectedVideo.id);
    if (currentIndex < VIDEOS_COLLECTION.length - 1) {
      setSelectedVideo(VIDEOS_COLLECTION[currentIndex + 1]);
    }
  };

  const handlePrevVideo = () => {
    if (!selectedVideo) return;
    const currentIndex = VIDEOS_COLLECTION.findIndex((v) => v.id === selectedVideo.id);
    if (currentIndex > 0) {
      setSelectedVideo(VIDEOS_COLLECTION[currentIndex - 1]);
    }
  };

  // Scroll to top when returning to feed if needed
  useEffect(() => {
    if (!selectedVideo) {
      document.title = `${VIDEOS_COLLECTION.length} Videos • Private Collection`;
    } else {
      document.title = `${selectedVideo.title} • ${VIDEOS_COLLECTION.length} Videos`;
    }
  }, [selectedVideo]);

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-100 antialiased font-sans selection:bg-neutral-800 selection:text-white">
      {/* Main Library View */}
      <VideoFeed
        videos={VIDEOS_COLLECTION}
        progressMap={progressMap}
        currentVideo={selectedVideo}
        onSelectVideo={handleSelectVideo}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onResetProgress={resetAllProgress}
      />

      {/* Dedicated Fullscreen Player View */}
      <AnimatePresence>
        {selectedVideo && (
          <VideoPlayer
            key={selectedVideo.id}
            video={selectedVideo}
            allVideos={VIDEOS_COLLECTION}
            progress={progressMap[selectedVideo.id]}
            onSaveProgress={saveProgress}
            onMarkCompleted={markCompleted}
            onNextVideo={handleNextVideo}
            onPrevVideo={handlePrevVideo}
            onBack={handleBackToLibrary}
            onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Security & View-Only Info Modal */}
      <SecurityInfoModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      {/* Simple Mobile Bottom Navigation Bar (hidden while active in fullscreen video player) */}
      {!selectedVideo && (
        <Navigation
          activeTab={activeNavTab}
          currentVideo={selectedVideo}
          totalVideos={VIDEOS_COLLECTION.length}
          onTabChange={handleNavTabChange}
        />
      )}
    </div>
  );
}
