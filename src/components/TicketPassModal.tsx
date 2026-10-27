import React from 'react';
import {
  CheckCircle2,
  Download,
  Share2,
  Calendar,
  MapPin,
  Clock,
  QrCode,
  Ticket,
  Printer,
  Sparkles,
} from 'lucide-react';
import { Booking } from '../types';

interface TicketPassModalProps {
  booking: Booking | null;
  onDone: () => void;
  onViewAllBookings: () => void;
}

export const TicketPassModal: React.FC<TicketPassModalProps> = ({
  booking,
  onDone,
  onViewAllBookings,
}) => {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `My IMovies Ticket: ${booking.movieTitle}`,
        text: `I'm going to watch ${booking.movieTitle} at ${booking.theatreName} on ${booking.showDate} at ${booking.showTime}!`,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Ticket details link copied to clipboard!');
    }
  };

  const seatLabels = booking.seats.map(s => `${s.row}${s.number}`).join(', ');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-20">
      {/* Celebration Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">Booking Confirmed!</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Your e-tickets have been generated and sent to{' '}
          <strong className="text-white">{booking.userEmail}</strong>.
        </p>
      </div>

      {/* Cinematic Ticket Stub Card */}
      <div id="cinema-ticket-pass" className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
        {/* Top Gold Stripe */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500" />

        {/* Ticket Header */}
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between border-b border-dashed border-slate-800">
          <div className="flex items-center gap-4">
            <img
              src={booking.moviePoster}
              alt={booking.movieTitle}
              className="w-20 aspect-[2/3] object-cover rounded-xl shadow-md border border-slate-700 shrink-0"
            />
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                {booking.screenFormat}
              </span>
              <h3 className="text-xl font-black text-white mt-1">{booking.movieTitle}</h3>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {booking.theatreName}
              </p>
              <p className="text-[11px] text-slate-500">{booking.theatreAddress}</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Booking ID</p>
            <p className="text-sm font-mono font-bold text-amber-400">{booking.id}</p>
            <p className="text-[11px] text-slate-500 mt-1">Payment: {booking.paymentId}</p>
          </div>
        </div>

        {/* Ticket Mid Section: Grid of details */}
        <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/40">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Date</p>
            <p className="text-sm font-bold text-white mt-0.5">{booking.showDate}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Showtime</p>
            <p className="text-sm font-bold text-amber-400 mt-0.5">{booking.showTime}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Auditorium</p>
            <p className="text-sm font-bold text-white mt-0.5">{booking.screenName}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Seats</p>
            <p className="text-sm font-bold text-amber-300 mt-0.5">{seatLabels}</p>
          </div>
        </div>

        {/* Concessions banner if booked */}
        {booking.concessions && booking.concessions.length > 0 && (
          <div className="px-6 sm:px-8 py-3 bg-amber-500/10 border-t border-b border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
            <span>
              🍿 <strong>Snack Order Attached:</strong>{' '}
              {booking.concessions.map(c => `${c.quantity}x ${c.name}`).join(', ')}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold">Pick up at Express Counter</span>
          </div>
        )}

        {/* Ticket Bottom Section: QR Code & Verification */}
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-dashed border-slate-800">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-xs font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
              <QrCode className="w-4 h-4 text-amber-400" />
              Scan at Cinema Turnstile
            </p>
            <p className="text-[11px] text-slate-400">
              Present this digital pass at the entrance of {booking.screenName}.
            </p>
            <p className="text-[10px] text-slate-500">
              Free cancellation available up to 2 hours prior to showtime.
            </p>
          </div>

          {/* Stylized QR Code Box */}
          <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 flex flex-col items-center">
            {/* SVG simulated crisp QR matrix */}
            <svg
              className="w-24 h-24 text-slate-950"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              {/* Corner markers */}
              <rect x="0" y="0" width="30" height="30" />
              <rect x="5" y="5" width="20" height="20" fill="white" />
              <rect x="10" y="10" width="10" height="10" />

              <rect x="70" y="0" width="30" height="30" />
              <rect x="75" y="5" width="20" height="20" fill="white" />
              <rect x="80" y="10" width="10" height="10" />

              <rect x="0" y="70" width="30" height="30" />
              <rect x="5" y="75" width="20" height="20" fill="white" />
              <rect x="10" y="80" width="10" height="10" />

              {/* Data dots */}
              <rect x="40" y="10" width="10" height="10" />
              <rect x="55" y="5" width="8" height="8" />
              <rect x="40" y="35" width="20" height="10" />
              <rect x="15" y="45" width="15" height="10" />
              <rect x="70" y="45" width="15" height="10" />
              <rect x="45" y="60" width="10" height="20" />
              <rect x="65" y="70" width="25" height="10" />
              <rect x="75" y="85" width="15" height="10" />
              <rect x="35" y="85" width="15" height="10" />
            </svg>
            <span className="text-[9px] font-mono font-bold text-slate-900 mt-1">
              {booking.id}
            </span>
          </div>
        </div>
      </div>

      {/* Ticket Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3.5 mt-8">
        <button
          onClick={handlePrint}
          className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold flex items-center gap-2 transition"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>Print / Save PDF</span>
        </button>

        <button
          onClick={handleShare}
          className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold flex items-center gap-2 transition"
        >
          <Share2 className="w-4 h-4 text-amber-400" />
          <span>Share Ticket</span>
        </button>

        <button
          onClick={onViewAllBookings}
          className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 transition"
        >
          <Ticket className="w-4 h-4 text-amber-400" />
          <span>My Bookings</span>
        </button>

        <button
          onClick={onDone}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
        >
          Browse More Movies
        </button>
      </div>
    </div>
  );
};
