import React from 'react';
import { Film, Sparkles, Filter, RotateCcw } from 'lucide-react';

interface MovieFiltersProps {
  activeTab: 'now_showing' | 'coming_soon' | 'all';
  onTabChange: (tab: 'now_showing' | 'coming_soon' | 'all') => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  selectedFormat: string;
  onFormatChange: (fmt: string) => void;
  onReset: () => void;
  totalCount: number;
  onAddMovie?: () => void;
}

export const MovieFilters: React.FC<MovieFiltersProps> = ({
  activeTab,
  onTabChange,
  selectedGenre,
  onGenreChange,
  selectedLanguage,
  onLanguageChange,
  selectedFormat,
  onFormatChange,
  onReset,
  totalCount,
  onAddMovie,
}) => {
  const genres = [
    'All',
    'Action',
    'Sci-Fi',
    'Adventure',
    'Thriller',
    'Drama',
    'Animation',
    'Fantasy',
    'Horror',
  ];

  const languages = ['All', 'English', 'Spanish', 'French', 'Japanese', 'Hindi', 'Greek'];
  const formats = ['All', 'IMAX 3D', 'Dolby Atmos', '4DX', '3D', '2D'];

  const hasActiveFilters =
    selectedGenre !== 'All' ||
    selectedLanguage !== 'All' ||
    selectedFormat !== 'All' ||
    activeTab !== 'now_showing';

  return (
    <div className="space-y-4 mb-8">
      {/* Top Row: Category Tabs & Counter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => onTabChange('now_showing')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'now_showing'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Now Showing
          </button>

          <button
            onClick={() => onTabChange('coming_soon')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'coming_soon'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Coming Soon
          </button>

          <button
            onClick={() => onTabChange('all')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Movies
          </button>
        </div>

        {/* Filters Summary, Reset, & Add Movie */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-white">{totalCount}</strong> titles
          </span>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}

          {onAddMovie && (
            <button
              onClick={onAddMovie}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition hover:scale-105"
            >
              <span className="text-sm leading-none">+</span>
              <span>Add Movie</span>
            </button>
          )}
        </div>
      </div>

      {/* Second Row: Genre Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          Genre:
        </span>
        {genres.map(g => (
          <button
            key={g}
            onClick={() => onGenreChange(g)}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all ${
              selectedGenre === g
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Third Row: Language and Format Selectors */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        {/* Language select */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Language:</span>
          <select
            value={selectedLanguage}
            onChange={e => onLanguageChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            {languages.map(l => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* Screen Format select */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Format:</span>
          <select
            value={selectedFormat}
            onChange={e => onFormatChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            {formats.map(f => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
