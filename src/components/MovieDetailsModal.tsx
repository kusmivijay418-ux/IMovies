import React from 'react';
import { X, Play, Clock, Star, Calendar, Globe, Film, Ticket, Users } from 'lucide-react';
import { Movie } from '../types';

interface MovieDetailsModalProps {
  movie: Movie | null;
  onClose: () => void;
  onBook: (movie: Movie) => void;
  onWatchTrailer: (trailerUrl: string, title: string) => void;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  onClose,
  onBook,
  onWatchTrailer,
}) => {
  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white border border-slate-700/60 backdrop-blur-md transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Banner */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-950">
          <img
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-center filter brightness-[0.55]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          {/* Trailer Play CTA Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => onWatchTrailer(movie.trailerUrl, movie.title)}
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/30 hover:scale-105 transition-all"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Watch Official Trailer</span>
            </button>
          </div>

          {/* Bottom title info over backdrop */}
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {movie.rating}/10 ({movie.votesCount.toLocaleString()} votes)
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300 font-semibold">
                {movie.censorRating}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {movie.title}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Metadata quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2.5 text-xs">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-slate-500">Duration</p>
                <p className="font-semibold text-slate-200">
                  {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-slate-500">Release Date</p>
                <p className="font-semibold text-slate-200">{movie.releaseDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs">
              <Globe className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-slate-500">Languages</p>
                <p className="font-semibold text-slate-200 truncate">{movie.languages.join(', ')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs">
              <Film className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-slate-500">Formats</p>
                <p className="font-semibold text-slate-200 truncate">{movie.formats.join(', ')}</p>
              </div>
            </div>
          </div>

          {/* Synopsis */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
              Synopsis
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              {movie.synopsis}
            </p>
          </div>

          {/* Director & Cast */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              Director & Cast
            </h4>
            <div className="mb-3 text-xs text-slate-300">
              <span className="text-slate-500">Directed by:</span>{' '}
              <strong className="text-white">{movie.director}</strong>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {movie.cast.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-300 shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{c.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{c.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
            >
              Close
            </button>

            {movie.status === 'now_showing' && (
              <button
                onClick={() => {
                  onClose();
                  onBook(movie);
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
              >
                <Ticket className="w-4 h-4" />
                <span>Select Showtime & Seats</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
