import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  barColor?: string;
  showGlow?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = 'h-1 w-full bg-neutral-800 rounded-full overflow-hidden',
  barColor = 'bg-white',
  showGlow = false,
}) => {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className={`relative ${className}`}>
      <div
        className={`h-full transition-all duration-200 ease-out rounded-full ${barColor} ${
          showGlow ? 'shadow-[0_0_8px_rgba(255,255,255,0.7)]' : ''
        }`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
