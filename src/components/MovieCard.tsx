import React from 'react';
import { Star, Clock, Ticket, Play, Info } from 'lucide-react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onBook: (movie: Movie) => void;
  onViewDetails: (movie: Movie) => void;
  onWatchTrailer: (trailerUrl: string, title: string) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onBook,
  onViewDetails,
  onWatchTrailer,
}) => {
  const isComingSoon = movie.status === 'coming_soon';

  return (
    <div className="group flex flex-col bg-slate-900/60 rounded-2xl overflow-hidden border border-slate-800/80 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300">
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Ambient Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Rating */}
          <div className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-700/80 flex items-center gap-1 text-xs font-bold text-amber-300 shadow-md">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{movie.rating}</span>
          </div>

          {/* Censor Rating */}
          <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-semibold text-slate-300">
            {movie.censorRating}
          </span>
        </div>

        {/* Quick Trailer Button Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-300">
          <button
            onClick={e => {
              e.stopPropagation();
              onWatchTrailer(movie.trailerUrl, movie.title);
            }}
            className="p-3.5 rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400 hover:scale-110 shadow-xl shadow-amber-500/30 transition-all transform duration-200"
            title="Watch Official Trailer"
          >
            <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
          </button>
        </div>

        {/* Bottom Format Pills on Poster */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 pointer-events-none">
          {movie.formats.slice(0, 3).map(fmt => (
            <span
              key={fmt}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/90 text-slate-200 border border-slate-700/60 backdrop-blur-sm"
            >
              {fmt}
            </span>
          ))}
        </div>
      </div>

      {/* Movie Details Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400/80" />
              {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
            </span>
            <span>•</span>
            <span className="truncate">{movie.genres.slice(0, 2).join(', ')}</span>
          </div>

          <h3
            onClick={() => onViewDetails(movie)}
            className="text-base font-bold text-white group-hover:text-amber-300 transition-colors cursor-pointer line-clamp-1"
            title={movie.title}
          >
            {movie.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {movie.synopsis}
          </p>
        </div>

        {/* Actions Button Row */}
        <div className="pt-2 flex items-center gap-2">
          {isComingSoon ? (
            <button
              onClick={() => onViewDetails(movie)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition"
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Details & Trailer</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => onBook(movie)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Book</span>
              </button>

              <button
                onClick={() => onViewDetails(movie)}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
                title="View Full Cast & Details"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
