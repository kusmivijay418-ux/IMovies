import React, { useState } from 'react';
import { Sparkles, Star, Clock, Ticket, Play, Flame, Award, Film, ChevronRight } from 'lucide-react';
import { Movie } from '../types';

interface SuggestedMoviesSectionProps {
  suggestedMovies: Movie[];
  topPicks: Movie[];
  trending: Movie[];
  imaxMovies: Movie[];
  onBook: (movie: Movie) => void;
  onViewDetails: (movie: Movie) => void;
  onWatchTrailer: (trailerUrl: string, title: string) => void;
}

export const SuggestedMoviesSection: React.FC<SuggestedMoviesSectionProps> = ({
  suggestedMovies,
  topPicks,
  trending,
  imaxMovies,
  onBook,
  onViewDetails,
  onWatchTrailer,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'top' | 'trending' | 'imax'>('all');

  const getActiveList = () => {
    switch (filterTab) {
      case 'top':
        return topPicks.length > 0 ? topPicks : suggestedMovies;
      case 'trending':
        return trending.length > 0 ? trending : suggestedMovies;
      case 'imax':
        return imaxMovies.length > 0 ? imaxMovies : suggestedMovies;
      case 'all':
      default:
        return suggestedMovies;
    }
  };

  const activeMovies = getActiveList().slice(0, 8);

  if (activeMovies.length === 0) return null;

  return (
    <div className="relative my-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-amber-500/[0.07] via-slate-900/80 to-slate-900/60 border border-amber-500/25 shadow-2xl overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Curated For You</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Suggested Movies
            <span className="text-amber-400 text-lg font-bold font-mono">
              ({activeMovies.length} Picks)
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Personalized cinema recommendations curated based on audience acclaim, critic reviews, and visual formats.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl overflow-x-auto shrink-0">
          {[
            { id: 'all', label: 'All Curated', icon: Sparkles },
            { id: 'top', label: 'Top Rated', icon: Award },
            { id: 'trending', label: 'Trending', icon: Flame },
            { id: 'imax', label: 'IMAX Laser', icon: Film },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Suggested Movies Horizontal Shelf / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {activeMovies.map(movie => {
          const score = movie.matchScore || Math.floor(92 + (movie.rating - 7.5) * 4);
          const reason =
            movie.suggestedReason ||
            (movie.rating >= 8.8
              ? 'Masterpiece • 99% Critic Score'
              : movie.formats.includes('IMAX 3D')
              ? 'IMAX 3D Visual Spectacle'
              : 'Trending Box Office Favorite');

          return (
            <div
              key={movie.id}
              className="group relative flex flex-col justify-between bg-slate-950/90 rounded-2xl overflow-hidden border border-slate-800/90 hover:border-amber-400/70 hover:shadow-2xl hover:shadow-amber-500/15 transition-all duration-300"
            >
              {/* Poster Container */}
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90" />

                {/* Match Score Badge */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/90 backdrop-blur-md text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                    {score}% Match
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {movie.rating}
                  </span>
                </div>

                {/* Trailer Play on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-950/50 backdrop-blur-[2px] transition-opacity duration-200">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onWatchTrailer(movie.trailerUrl, movie.title);
                    }}
                    className="p-3 rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400 hover:scale-110 shadow-lg shadow-amber-500/40 transition"
                    title="Watch Official Trailer"
                  >
                    <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                  </button>
                </div>

                {/* Format Tags on Poster */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap gap-1 pointer-events-none">
                  {movie.formats.slice(0, 2).map(f => (
                    <span
                      key={f}
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900/90 text-amber-200 border border-slate-700/80"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Details */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  {/* Reason Pill */}
                  <p className="text-[10px] font-semibold text-amber-300 line-clamp-1 truncate mb-1">
                    ✨ {reason}
                  </p>

                  <h4
                    onClick={() => onViewDetails(movie)}
                    className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors cursor-pointer truncate"
                    title={movie.title}
                  >
                    {movie.title}
                  </h4>

                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>
                      {Math.floor(movie.duration / 60)}h {movie.duration % 60}m
                    </span>
                    <span>•</span>
                    <span className="truncate">{movie.genres[0]}</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => onBook(movie)}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Book</span>
                  </button>

                  <button
                    onClick={() => onViewDetails(movie)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="View Details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
