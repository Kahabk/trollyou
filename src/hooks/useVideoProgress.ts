import { useState, useEffect, useCallback } from 'react';
import { PlaybackProgress } from '../types';

const STORAGE_KEY = 'private_videos_playback_progress_v1';

export function useVideoProgress() {
  const [progressMap, setProgressMap] = useState<Record<string, PlaybackProgress>>(() => {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : {};
    } catch {
      return {};
    }
  });

  // Save progress map to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressMap));
    } catch (e) {
      console.warn('Unable to persist playback progress to localStorage', e);
    }
  }, [progressMap]);

  const saveProgress = useCallback((videoId: string, currentTime: number, duration: number) => {
    if (!videoId || duration <= 0) return;
    
    // Consider completed if watched >= 90% or within 10s of the end
    const isCompleted = (currentTime / duration >= 0.9) || (duration - currentTime <= 8 && currentTime > 5);

    setProgressMap((prev) => {
      const existing = prev[videoId];
      // Keep completed true once marked, unless restarted from 0
      const completed = isCompleted || (existing?.completed && currentTime > 5);

      return {
        ...prev,
        [videoId]: {
          videoId,
          currentTime,
          duration,
          completed: Boolean(completed),
          lastWatchedAt: Date.now(),
        },
      };
    });
  }, []);

  const markCompleted = useCallback((videoId: string, duration?: number) => {
    setProgressMap((prev) => {
      const existing = prev[videoId];
      const videoDuration = duration || existing?.duration || 0;
      return {
        ...prev,
        [videoId]: {
          videoId,
          currentTime: videoDuration,
          duration: videoDuration,
          completed: true,
          lastWatchedAt: Date.now(),
        },
      };
    });
  }, []);

  const getProgress = useCallback((videoId: string): PlaybackProgress | undefined => {
    return progressMap[videoId];
  }, [progressMap]);

  const resetAllProgress = useCallback(() => {
    setProgressMap({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  // Compute summary stats
  const progressList: PlaybackProgress[] = Object.values(progressMap);
  const completedCount = progressList.filter((p) => p.completed).length;
  const inProgressCount = progressList.filter(
    (p) => !p.completed && p.currentTime > 5
  ).length;

  return {
    progressMap,
    saveProgress,
    markCompleted,
    getProgress,
    resetAllProgress,
    completedCount,
    inProgressCount,
  };
}
