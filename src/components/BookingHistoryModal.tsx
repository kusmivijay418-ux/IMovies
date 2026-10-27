import React, { useState, useEffect } from 'react';
import {
  X,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Booking } from '../types';

interface BookingHistoryModalProps {
  onClose: () => void;
  onViewTicket: (booking: Booking) => void;
}

export const BookingHistoryModal: React.FC<BookingHistoryModalProps> = ({
  onClose,
  onViewTicket,
}) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancellationSuccessMsg, setCancellationSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await api.getBookings();
      setBookings(res.bookings || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    setCancellingId(cancelModalBooking.id);
    try {
      const res = await api.cancelBooking(cancelModalBooking.id);
      setBookings(prev =>
        prev.map(b => (b.id === cancelModalBooking.id ? res.booking : b))
      );
      setCancellationSuccessMsg(
        `Booking #${cancelModalBooking.id} cancelled. Refund of $${res.booking.refundAmount?.toFixed(2)} processed!`
      );
      setCancelModalBooking(null);
      setTimeout(() => setCancellationSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = bookings.filter(b => {
    if (selectedFilter === 'all') return true;
    return b.status === selectedFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-8 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">My Cinema Tickets</h2>
              <p className="text-xs text-slate-400">View upcoming showtimes and manage your reservations</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cancellationSuccessMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-300 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cancellationSuccessMsg}</span>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-6">
          {(['all', 'confirmed', 'cancelled'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                selectedFilter === tab
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab === 'all' ? 'All Bookings' : tab}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading your bookings...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Ticket className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm font-semibold">No bookings found in this view.</p>
              <p className="text-xs text-slate-600">Reserve your favorite movie show to see tickets here.</p>
            </div>
          ) : (
            filtered.map(b => {
              const seatLabels = b.seats.map(s => `${s.row}${s.number}`).join(', ');
              const isCancelled = b.status === 'cancelled';

              return (
                <div
                  key={b.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCancelled
                      ? 'bg-slate-950/40 border-slate-800/80 opacity-75'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 shadow-md'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={b.moviePoster}
                        alt={b.movieTitle}
                        className="w-14 aspect-[2/3] object-cover rounded-lg shadow-sm border border-slate-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              isCancelled
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {b.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">#{b.id}</span>
                        </div>

                        <h4 className="text-base font-bold text-white mt-1 truncate">
                          {b.movieTitle}
                        </h4>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            {b.theatreName} ({b.screenFormat})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-white font-medium">
                            <Calendar className="w-3 h-3 text-amber-400" />
                            {b.showDate} at {b.showTime}
                          </span>
                        </div>

                        <p className="text-xs text-amber-300 font-semibold mt-1">
                          Seats: {seatLabels} ({b.screenName})
                        </p>
                      </div>
                    </div>

                    {/* Actions and Amount */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-extrabold text-white">${b.totalAmount.toFixed(2)}</p>
                        {isCancelled && b.refundAmount && (
                          <p className="text-[11px] text-emerald-400">
                            Refunded: ${b.refundAmount.toFixed(2)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isCancelled && (
                          <button
                            onClick={() => setCancelModalBooking(b)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition"
                          >
                            Cancel & Refund
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onClose();
                            onViewTicket(b);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-400" />
                          <span>View Ticket</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cancellation Confirmation Prompt Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Cancel Booking & Release Seats?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to cancel booking <strong>#{cancelModalBooking.id}</strong> for{' '}
                <strong className="text-white">{cancelModalBooking.movieTitle}</strong>?
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Original Order Total</span>
                <span>${cancelModalBooking.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Convenience Fee (Retained)</span>
                <span>-${cancelModalBooking.convenienceFee.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-emerald-400">
                <span>Instant Refund Amount</span>
                <span>
                  ${(cancelModalBooking.totalAmount - cancelModalBooking.convenienceFee).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancellingId === cancelModalBooking.id}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-1.5"
              >
                {cancellingId === cancelModalBooking.id ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
