import React, { useState, useEffect } from 'react';
import { Play, Ticket, Star, Clock, Volume2, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../types';

interface HeroCarouselProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onWatchTrailer: (trailerUrl: string, title: string) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  movies,
  onSelectMovie,
  onWatchTrailer,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const featuredMovies = movies.filter(m => m.featured || m.status === 'now_showing').slice(0, 4);

  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredMovies.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [featuredMovies.length]);

  if (featuredMovies.length === 0) return null;

  const current = featuredMovies[currentIndex] || featuredMovies[0];

  return (
    <div className="relative w-full h-[480px] sm:h-[560px] lg:h-[620px] overflow-hidden bg-slate-950">
      {/* Background Backdrop Image */}
      <div className="absolute inset-0">
        <img
          src={current.backdropUrl || current.posterUrl}
          alt={current.title}
          className="w-full h-full object-cover object-center filter brightness-[0.45] scale-105 transition-all duration-1000 ease-out"
        />
        {/* Cinematic Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Main Content Area */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-2xl space-y-4 sm:space-y-6 pt-12">
          {/* Formats & Rating Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/10">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {current.rating} Rating
            </span>

            {current.formats.slice(0, 3).map(fmt => (
              <span
                key={fmt}
                className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700 text-xs font-semibold text-slate-200"
              >
                {fmt}
              </span>
            ))}

            <span className="px-2 py-0.5 rounded border border-slate-700 text-xs text-slate-300 font-medium">
              {current.censorRating}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] drop-shadow-md">
            {current.title}
          </h1>

          {/* Tagline */}
          {current.tagline && (
            <p className="text-base sm:text-lg text-amber-200/90 font-medium italic">
              "{current.tagline}"
            </p>
          )}

          {/* Metadata: Duration & Genres */}
          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              {Math.floor(current.duration / 60)}h {current.duration % 60}m
            </span>
            <span>•</span>
            <span>{current.genres.join(', ')}</span>
            <span>•</span>
            <span>Dir. {current.director}</span>
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-xl">
            {current.synopsis}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              onClick={() => onSelectMovie(current)}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-sm uppercase tracking-wider flex items-center gap-2.5 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all transform hover:-translate-y-0.5"
            >
              <Ticket className="w-5 h-5 text-slate-950" />
              <span>Book Tickets</span>
            </button>

            <button
              onClick={() => onWatchTrailer(current.trailerUrl, current.title)}
              className="px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold text-sm flex items-center gap-2 backdrop-blur-md transition-all transform hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Watch Trailer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Navigation Arrows */}
      {featuredMovies.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex(prev => (prev - 1 + featuredMovies.length) % featuredMovies.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-800 border border-slate-700/60 text-white backdrop-blur-md transition"
            aria-label="Previous movie"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentIndex(prev => (prev + 1) % featuredMovies.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-800 border border-slate-700/60 text-white backdrop-blur-md transition"
            aria-label="Next movie"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Carousel Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {featuredMovies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-8 bg-amber-400' : 'w-2 bg-slate-600 hover:bg-slate-500'
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
