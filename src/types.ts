export interface VideoItem {
  id: string;
  index: number;
  title: string;
  subtitle?: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: string; // e.g. "04:12"
  durationSeconds: number; // e.g. 252
  category?: string;
  tags?: string[];
  publishedDate?: string;
}

export interface PlaybackProgress {
  videoId: string;
  currentTime: number;
  duration: number;
  completed: boolean;
  lastWatchedAt: number; // timestamp
}

export interface PlayerSettings {
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  autoAdvance: boolean;
  quality?: string;
}
