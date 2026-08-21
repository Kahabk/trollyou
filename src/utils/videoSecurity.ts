/**
 * Video Security & View-Only Protection Utilities
 *
 * IMPORTANT ARCHITECTURAL NOTICE:
 * Browser-based HTML5 video playback CANNOT provide absolute DRM-level protection.
 * Any media rendered natively by a client browser in standard MP4 formats can theoretically
 * be inspected via browser developer tools or network sniffers.
 *
 * This module implements proactive "UI-level & standard browser hardening" to prevent
 * accidental, standard, or trivial downloads:
 * 1. Disables default HTML5 download controls (`controlsList="nodownload noplaybackrate"`).
 * 2. Disables context menu / right-click "Save Video As..." on video elements & overlays.
 * 3. Prevents drag-and-drop file saving behavior.
 * 4. Hides direct file URLs and avoids rendering download links or Blob export buttons.
 * 5. Uses custom UI overlays rendering on top of the native media stream.
 *
 * FUTURE DRM & ENTERPRISE STREAMING ROADMAP:
 * To upgrade from UI-hardened view-only to commercial DRM:
 * - HLS / MPEG-DASH with Encrypted Media Extensions (EME).
 * - Multi-DRM services: Google Widevine (Modular), Apple FairPlay Streaming, Microsoft PlayReady.
 * - Time-limited, signed URLs (e.g., Cloudflare Stream / AWS CloudFront Signed Cookies).
 * - Server-side token authentication per chunk.
 */

import React from 'react';

/**
 * Prevents context menu (right-click / long-press save) on video surfaces
 */
export function preventContextMenu(e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): void {
  e.preventDefault();
}

/**
 * Prevents dragging the video element to desktop or folder
 */
export function preventDragStart(e: React.DragEvent | DragEvent): void {
  e.preventDefault();
}

/**
 * Attributes to apply to HTML5 <video> elements for view-only hardening
 */
export const VIEW_ONLY_VIDEO_ATTRIBUTES = {
  controlsList: 'nodownload noplaybackrate nofullscreen',
  disablePictureInPicture: true,
  playsInline: true,
  draggable: false,
} as const;

/**
 * Formats time in seconds to mm:ss format (e.g. 125 -> "02:05")
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hours = Math.floor(mins / 60);
  
  if (hours > 0) {
    const remMins = mins % 60;
    return `${hours.toString().padStart(2, '0')}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
