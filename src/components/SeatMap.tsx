import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Clock,
  Sparkles,
  Armchair,
  Check,
  Lock,
  ArrowRight,
  Info,
  RotateCw,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Show, SeatStatus } from '../types';

interface SeatMapProps {
  onBack: () => void;
  onProceed: () => void;
  onOpenAuth: () => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({ onBack, onProceed, onOpenAuth }) => {
  const { user } = useAuth();
  const {
    selectedShow,
    selectedMovie,
    selectedSeats,
    toggleSeat,
    clearSeats,
    ticketsTotal,
    lockSecondsRemaining,
  } = useBooking();

  const [currentShow, setCurrentShow] = useState<Show | null>(selectedShow);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Poll for seat updates every 8 seconds so other bookings reflect in real-time
  useEffect(() => {
    if (!selectedShow) return;

    loadLatestSeatLayout();

    const interval = setInterval(() => {
      loadLatestSeatLayout(false);
    }, 8000);

    return () => clearInterval(interval);
  }, [selectedShow?.id]);

  const loadLatestSeatLayout = async (showSpinner = true) => {
    if (!selectedShow) return;
    if (showSpinner) setLoading(true);
    try {
      const res = await api.getShowById(selectedShow.id);
      setCurrentShow(res.show);
    } catch (err: any) {
      console.error('Failed to refresh seat layout:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  if (!selectedShow || !selectedMovie) return null;

  const seatLayout = currentShow?.seatLayout || selectedShow.seatLayout;

  // Group seats by row
  const rowsMap: { [row: string]: SeatStatus[] } = {};
  for (const seat of seatLayout) {
    if (!rowsMap[seat.row]) {
      rowsMap[seat.row] = [];
    }
    rowsMap[seat.row].push(seat);
  }

  // Sort rows alphabetically A to H
  const sortedRows = Object.keys(rowsMap).sort();

  const handleSeatClick = async (seat: SeatStatus) => {
    if (seat.status === 'booked') return;

    if (seat.status === 'locked' && seat.lockedByUserId && seat.lockedByUserId !== user?.id) {
      setErrorMsg(`Seat ${seat.row}${seat.number} is currently on hold by another customer.`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const isAlreadySelected = selectedSeats.some(s => s.row === seat.row && s.number === seat.number);

    toggleSeat({
      row: seat.row,
      number: seat.number,
      tier: seat.tier,
      price: seat.price,
    });

    // If user is authenticated, lock or unlock seat in backend
    if (user) {
      try {
        if (!isAlreadySelected) {
          await api.lockSeats(selectedShow.id, [{ row: seat.row, number: seat.number }]);
        } else {
          await api.unlockSeats(selectedShow.id, [{ row: seat.row, number: seat.number }]);
        }
      } catch (err: any) {
        console.warn('Seat lock sync error:', err);
      }
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) return;
    if (!user) {
      onOpenAuth();
      return;
    }
    onProceed();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition"
          >
            <ChevronLeft className="w-4 h-4 text-amber-400" />
            <span>Change Showtime</span>
          </button>

          <div>
            <h2 className="text-lg font-black text-white">{selectedMovie.title}</h2>
            <p className="text-xs text-slate-400">
              {selectedShow.theatreName} • {selectedShow.screenName} ({selectedShow.screenFormat})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-400">Showtime</p>
            <p className="text-sm font-bold text-amber-400">
              {selectedShow.startTime} • {selectedShow.date}
            </p>
          </div>

          <button
            onClick={() => loadLatestSeatLayout(true)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh seat availability"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Seat Hold Timer Banner (when seats are selected) */}
      {selectedSeats.length > 0 && (
        <div className="mb-6 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>
              Seats held temporarily. Please complete checkout before the timer expires.
            </span>
          </div>
          <span className="font-mono font-bold bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/40 text-amber-300">
            {formatTimer(lockSecondsRemaining)}
          </span>
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs font-semibold text-rose-300 flex items-center gap-2">
          <Info className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Seating Canvas Card */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Curved Cinema Screen */}
        <div className="relative mb-12 sm:mb-16 text-center">
          {/* Curved Projection Screen Bar */}
          <div className="w-4/5 sm:w-3/5 mx-auto h-2 sm:h-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-white to-cyan-500 shadow-[0_0_35px_rgba(34,211,238,0.7)]" />
          {/* Ambient screen light beam downwards */}
          <div className="w-4/5 sm:w-3/5 mx-auto h-16 bg-gradient-to-b from-cyan-500/15 via-cyan-500/5 to-transparent pointer-events-none rounded-t-full" />
          <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase -mt-10">
            CINEMA SCREEN (All Eyes This Way)
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pb-8 mb-8 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-5 h-5 rounded-md border border-slate-600 bg-slate-800/80" />
            <span>Available</span>
          </div>

          <div className="flex items-center gap-2 text-amber-300">
            <div className="w-5 h-5 rounded-md bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-[10px]">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>Selected</span>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-5 h-5 rounded-md bg-slate-800/40 border border-slate-800 flex items-center justify-center text-slate-600">
              ✕
            </div>
            <span>Reserved</span>
          </div>

          <div className="flex items-center gap-2 text-cyan-400">
            <div className="w-5 h-5 rounded-md bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Lock className="w-3 h-3" />
            </div>
            <span>On Hold</span>
          </div>
        </div>

        {/* Seat Tier Pricing Chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            VIP Recliner (Rows A-B): ${selectedShow.basePrices.VIP}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            Premium Club (Rows C-E): ${selectedShow.basePrices.Premium}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            Standard (Rows F-H): ${selectedShow.basePrices.Standard}
          </span>
        </div>

        {/* Seat Rows Grid */}
        <div className="space-y-3 sm:space-y-3.5 overflow-x-auto pb-4">
          {sortedRows.map(rowLetter => {
            const rowSeats = rowsMap[rowLetter].sort((a, b) => a.number - b.number);
            const tier = rowSeats[0]?.tier || 'Standard';

            return (
              <div key={rowLetter} className="flex items-center justify-center gap-2 sm:gap-3 min-w-[620px]">
                {/* Row Letter Indicator Left */}
                <span className="w-6 text-xs font-extrabold text-slate-500 text-right uppercase">
                  {rowLetter}
                </span>

                {/* Left Aisle Group (Seats 1-4) */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {rowSeats.slice(0, 4).map(seat => renderSeatButton(seat))}
                </div>

                {/* Left Aisle Gap */}
                <div className="w-4 sm:w-6" />

                {/* Center Aisle Group (Seats 5-8) */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {rowSeats.slice(4, 8).map(seat => renderSeatButton(seat))}
                </div>

                {/* Right Aisle Gap */}
                <div className="w-4 sm:w-6" />

                {/* Right Aisle Group (Seats 9-12) */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {rowSeats.slice(8, 12).map(seat => renderSeatButton(seat))}
                </div>

                {/* Row Letter Indicator Right */}
                <span className="w-6 text-xs font-extrabold text-slate-500 text-left uppercase">
                  {rowLetter}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Bar for Selected Seats & Checkout */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 p-4 shadow-2xl">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Selected Seats:</span>
              {selectedSeats.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No seats selected yet</span>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedSeats.map(s => (
                    <span
                      key={`${s.row}${s.number}`}
                      className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-300"
                    >
                      {s.row}{s.number}
                    </span>
                  ))}
                  <button
                    onClick={clearSeats}
                    className="text-[11px] text-slate-500 hover:text-rose-400 ml-1 underline"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Total ({selectedSeats.length} {selectedSeats.length === 1 ? 'ticket' : 'tickets'}):{' '}
              <strong className="text-white text-base font-extrabold">
                ${ticketsTotal.toFixed(2)}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleContinue}
              disabled={selectedSeats.length === 0}
              className={`w-full sm:w-auto px-7 py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all ${
                selectedSeats.length > 0
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20 hover:scale-105'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>{user ? 'Proceed to Snacks & Drinks' : 'Sign In & Reserve Seats'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  function renderSeatButton(seat: SeatStatus) {
    const isSelected = selectedSeats.some(s => s.row === seat.row && s.number === seat.number);
    const isBooked = seat.status === 'booked';
    const isLocked =
      seat.status === 'locked' && seat.lockedByUserId && seat.lockedByUserId !== user?.id;

    let buttonClass =
      'w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs font-bold flex items-center justify-center transition-all duration-150 transform';

    if (isBooked) {
      buttonClass += ' bg-slate-900 border border-slate-800 text-slate-700 cursor-not-allowed';
    } else if (isLocked) {
      buttonClass += ' bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 cursor-not-allowed';
    } else if (isSelected) {
      buttonClass +=
        ' bg-amber-500 border border-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 scale-110';
    } else {
      if (seat.tier === 'VIP') {
        buttonClass +=
          ' bg-slate-800/90 border border-amber-500/30 hover:border-amber-400 text-slate-200 hover:bg-amber-500/20';
      } else if (seat.tier === 'Premium') {
        buttonClass +=
          ' bg-slate-800/80 border border-indigo-500/30 hover:border-indigo-400 text-slate-200 hover:bg-indigo-500/20';
      } else {
        buttonClass +=
          ' bg-slate-800/70 border border-slate-700 hover:border-slate-500 text-slate-300 hover:bg-slate-700';
      }
    }

    return (
      <button
        key={`${seat.row}${seat.number}`}
        onClick={() => handleSeatClick(seat)}
        disabled={Boolean(isBooked || isLocked)}
        className={buttonClass}
        title={`Seat ${seat.row}${seat.number} (${seat.tier}) - $${seat.price}`}
      >
        {isBooked ? (
          <span className="text-[10px]">✕</span>
        ) : isLocked ? (
          <Lock className="w-3 h-3" />
        ) : isSelected ? (
          <Check className="w-4 h-4 stroke-[3]" />
        ) : (
          <span className="text-[10px]">{seat.number}</span>
        )}
      </button>
    );
  }
};
