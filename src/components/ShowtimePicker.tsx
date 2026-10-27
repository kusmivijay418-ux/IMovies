import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  Sparkles,
  Volume2,
  Check,
  Armchair,
  ShieldCheck,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { api } from '../api/client';
import { Show, Theatre } from '../types';

interface ShowtimePickerProps {
  onBack: () => void;
}

export const ShowtimePicker: React.FC<ShowtimePickerProps> = ({ onBack }) => {
  const { selectedMovie, proceedToSeats } = useBooking();
  const [shows, setShows] = useState<Show[]>([]);
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedFormatFilter, setSelectedFormatFilter] = useState<string>('All');

  // Generate 5 consecutive date options
  const dateOptions = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { dateStr, dayName, formattedDate };
  });

  useEffect(() => {
    if (!selectedMovie) return;
    loadShowsAndTheatres();
  }, [selectedMovie, selectedDate]);

  const loadShowsAndTheatres = async () => {
    if (!selectedMovie) return;
    setLoading(true);
    try {
      const [showsRes, theatresRes] = await Promise.all([
        api.getShows({ movieId: selectedMovie.id, date: selectedDate }),
        api.getTheatres(),
      ]);
      setShows(showsRes.shows || []);
      setTheatres(theatresRes.theatres || []);
    } catch (err) {
      console.error('Failed to load shows:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedMovie) return null;

  // Filter shows by format if selected
  const filteredShows = selectedFormatFilter === 'All'
    ? shows
    : shows.filter(s => s.screenFormat === selectedFormatFilter);

  // Group shows by theatreId
  const theatreGroups = theatres
    .map(theatre => {
      const theatreShows = filteredShows.filter(s => s.theatreId === theatre.id);
      return {
        theatre,
        shows: theatreShows,
      };
    })
    .filter(group => group.shows.length > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Navigation Bar */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4 text-amber-400" />
          <span>Back to Movies</span>
        </button>
      </div>

      {/* Selected Movie Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <img
            src={selectedMovie.posterUrl}
            alt={selectedMovie.title}
            className="w-24 sm:w-28 aspect-[2/3] object-cover rounded-xl shadow-lg border border-slate-700/80 shrink-0"
          />

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                {selectedMovie.rating} Rating
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300 font-semibold">
                {selectedMovie.censorRating}
              </span>
              <span className="text-xs text-slate-400">
                {Math.floor(selectedMovie.duration / 60)}h {selectedMovie.duration % 60}m
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {selectedMovie.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-3xl">
              {selectedMovie.synopsis}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
              <span>{selectedMovie.genres.join(' • ')}</span>
              <span>|</span>
              <span>Available in: {selectedMovie.languages.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date Selector Row */}
      <div className="mb-8">
        <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          Select Date
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {dateOptions.map(opt => {
            const isSelected = selectedDate === opt.dateStr;
            return (
              <button
                key={opt.dateStr}
                onClick={() => setSelectedDate(opt.dateStr)}
                className={`p-3.5 rounded-2xl text-center border transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20 scale-[1.02]'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <p className={`text-xs ${isSelected ? 'text-slate-950 font-extrabold' : 'text-slate-400'}`}>
                  {opt.dayName}
                </p>
                <p className="text-base sm:text-lg font-black mt-0.5">{opt.formattedDate}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Screen Format Filter Pills */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-2">
          Format:
        </span>
        {['All', 'IMAX 3D', 'Dolby Atmos', '4DX', 'Standard'].map(fmt => (
          <button
            key={fmt}
            onClick={() => setSelectedFormatFilter(fmt)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
              selectedFormatFilter === fmt
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {fmt}
          </button>
        ))}
      </div>

      {/* Theatres & Showtimes List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Loading live showtimes & seat availability...</p>
          </div>
        ) : theatreGroups.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-slate-900/50 border border-slate-800 p-8 space-y-3">
            <Armchair className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-300">No showtimes found for this date</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Please choose another date or format above to view upcoming screenings.
            </p>
          </div>
        ) : (
          theatreGroups.map(group => (
            <div
              key={group.theatre.id}
              className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 sm:p-7 shadow-lg space-y-5"
            >
              {/* Theatre Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    {group.theatre.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{group.theatre.address}</p>
                </div>

                {/* Amenities Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {group.theatre.amenities.slice(0, 3).map(amenity => (
                    <span
                      key={amenity}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-950 border border-slate-800 text-slate-300"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Showtimes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {group.shows.map(show => {
                  const availableSeats = show.availableSeatsCount ?? 75;
                  const totalSeats = show.totalSeatsCount ?? 96;
                  const isFillingFast = availableSeats < 25;

                  return (
                    <button
                      key={show.id}
                      onClick={() => proceedToSeats(show)}
                      className="group/btn text-left p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/60 shadow-md hover:shadow-amber-500/10 transition-all transform hover:-translate-y-0.5 focus:outline-none"
                    >
                      {/* Showtime & Format */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-base font-extrabold text-white group-hover/btn:text-amber-300 transition-colors">
                          {show.startTime}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400">
                          {show.screenFormat}
                        </span>
                      </div>

                      {/* Screen Name & Base Price */}
                      <p className="text-[11px] text-slate-400 truncate">{show.screenName}</p>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-300">
                          From ${show.basePrices.Standard}
                        </span>

                        <span
                          className={`text-[10px] font-bold ${
                            isFillingFast ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {availableSeats} left
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
