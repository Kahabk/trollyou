import React from 'react';
import { Home, Film, Shield, Play } from 'lucide-react';
import { VideoItem } from '../types';

interface NavigationProps {
  activeTab: 'library' | 'player' | 'security';
  currentVideo: VideoItem | null;
  totalVideos?: number;
  onTabChange: (tab: 'library' | 'player' | 'security') => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  currentVideo,
  totalVideos,
  onTabChange,
}) => {
  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#08080a]/90 backdrop-blur-2xl border-t border-white/[0.08] py-2.5 px-6 shadow-2xl"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* Home / Collection Tab */}
        <button
          id="nav-home-btn"
          type="button"
          onClick={() => onTabChange('library')}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all ${
            activeTab === 'library'
              ? 'text-white font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'library' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-medium tracking-tight">Home</span>
        </button>

        {/* Videos Tab */}
        <button
          id="nav-videos-btn"
          type="button"
          onClick={() => onTabChange('library')}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all ${
            activeTab === 'library'
              ? 'text-white font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Film className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight">Videos{totalVideos ? ` (${totalVideos})` : ''}</span>
        </button>

        {/* Quick Return to Player Tab if a video is loaded */}
        {currentVideo && (
          <button
            id="nav-now-playing-btn"
            type="button"
            onClick={() => onTabChange('player')}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all animate-pulse ${
              activeTab === 'player'
                ? 'text-white font-bold'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Play className="w-5 h-5 fill-current text-white" />
            <span className="text-[10px] font-medium tracking-tight">Playing</span>
          </button>
        )}

        {/* Security / Info Tab */}
        <button
          id="nav-security-btn"
          type="button"
          onClick={() => onTabChange('security')}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all ${
            activeTab === 'security'
              ? 'text-white font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight">Security</span>
        </button>
      </div>
    </nav>
  );
};
