import React from 'react';
import { X, ExternalLink, Film } from 'lucide-react';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerUrl: string;
  movieTitle: string;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({
  isOpen,
  onClose,
  trailerUrl,
  movieTitle,
}) => {
  if (!isOpen || !trailerUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white truncate">
              {movieTitle} — Official Trailer
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`${trailerUrl}?autoplay=1&rel=0&modestbranding=1`}
            title={`${movieTitle} trailer`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};
