import React from 'react';
import { X, ShieldCheck, Lock, Eye, AlertCircle, FileCode, CheckCircle2 } from 'lucide-react';

interface SecurityInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityInfoModal: React.FC<SecurityInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-[#0e0e14]/95 border border-white/12 rounded-3xl p-6 sm:p-7 shadow-2xl text-neutral-200 overflow-y-auto max-h-[90vh] no-scrollbar backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-950/70 border border-emerald-800/50 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 id="security-modal-title" className="text-lg font-bold text-white tracking-tight font-sans">
                View-Only Stream Security
              </h3>
              <p className="text-xs text-neutral-400">
                Private playback architecture & safeguards
              </p>
            </div>
          </div>

          <button
            id="security-modal-close-btn"
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="mt-5 space-y-4 text-xs leading-relaxed text-neutral-300">
          <div className="p-4 rounded-2xl bg-[#13131a]/80 border border-white/[0.08] space-y-2.5 shadow-sm">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Active UI Protections</span>
            </div>
            <ul className="space-y-1.5 pl-6 list-disc text-neutral-300">
              <li>No download triggers, export options, or save actions anywhere in UI.</li>
              <li>Disabled native HTML5 video download attributes (<code className="text-neutral-200 bg-[#1e1e28] px-1.5 py-0.5 rounded font-mono">controlsList="nodownload"</code>).</li>
              <li>Context menu & right-click / long-press save disabled on media canvas.</li>
              <li>Drag-and-drop file grabbing prevented.</li>
              <li>Direct file URLs hidden from interface elements.</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/30 space-y-1.5 text-amber-200/90">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Technical Note: Client-Side Playback vs. DRM</span>
            </div>
            <p className="text-[11px] leading-normal text-amber-300/80">
              Standard browser MP4 streaming cannot provide mathematical DRM-level protection against technical inspection. This app implements strict UI-level prevention to ensure seamless view-only consumption.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#13131a]/80 border border-white/[0.08] space-y-2 text-neutral-300">
            <div className="flex items-center gap-2 text-white font-semibold">
              <FileCode className="w-4 h-4 text-blue-400" />
              <span>Video Storage Path</span>
            </div>
            <p className="text-neutral-400 text-[11px]">
              Videos stream directly from <code className="text-neutral-200 bg-[#1e1e28] px-1.5 py-0.5 rounded font-mono">/assets/.aistudio/videos/</code> (e.g. <code className="text-neutral-200 bg-[#1e1e28] px-1.5 py-0.5 rounded font-mono">1.mp4</code> through <code className="text-neutral-200 bg-[#1e1e28] px-1.5 py-0.5 rounded font-mono">14.mp4</code>). Metadata and titles are defined in <code className="text-neutral-200 bg-[#1e1e28] px-1.5 py-0.5 rounded font-mono">src/data/videos.ts</code>.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-white/[0.08] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#1b1b24] hover:bg-[#232330] border border-white/10 rounded-xl transition-all active:scale-95 shadow-md"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
