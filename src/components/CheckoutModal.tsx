import React, { useState } from 'react';
import {
  ChevronLeft,
  CreditCard,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Lock,
  Sparkles,
  Ticket,
  AlertCircle,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

interface CheckoutModalProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
  const {
    selectedMovie,
    selectedShow,
    selectedSeats,
    concessions,
    appliedPromo,
    applyPromo,
    removePromo,
    ticketsTotal,
    concessionsTotal,
    subtotal,
    convenienceFee,
    totalAmount,
    setLatestBooking,
  } = useBooking();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'applepay' | 'googlepay' | 'upi'>('card');
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState('4532 8920 1938 4920');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('389');
  const [cardHolder, setCardHolder] = useState(user?.name || 'Alex Johnson');

  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (!selectedMovie || !selectedShow || selectedSeats.length === 0) return null;

  const handleApplyPromo = async (codeToApply?: string) => {
    const code = (codeToApply || promoInput).trim();
    if (!code) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      await applyPromo(code);
      setPromoInput('');
    } catch (err: any) {
      setPromoError(err.message || 'Invalid promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handlePay = async () => {
    setProcessing(true);
    setPaymentError(null);

    try {
      const concessionsPayload = Object.values(concessions).map(c => ({
        id: c.item.id,
        name: c.item.name,
        quantity: c.quantity,
        price: c.item.price,
      }));

      const res = await api.createBooking({
        showId: selectedShow.id,
        seats: selectedSeats,
        concessions: concessionsPayload,
        paymentMethod,
        promoCode: appliedPromo?.code,
      });

      setLatestBooking(res.booking);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#ffffff', '#6366f1'],
        });
      } catch {
        // ignore
      }

      onSuccess();
    } catch (err: any) {
      setPaymentError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const concessionsList = Object.values(concessions);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 mb-6 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition"
        >
          <ChevronLeft className="w-4 h-4 text-amber-400" />
          <span>Back to Snacks</span>
        </button>

        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            Order Checkout & Payment
          </h2>
          <p className="text-xs text-slate-400">Review your ticket summary and select payment method</p>
        </div>
      </div>

      {paymentError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{paymentError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Order Summary & Promo Code (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Booking Summary Card */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
              <img
                src={selectedMovie.posterUrl}
                alt={selectedMovie.title}
                className="w-16 aspect-[2/3] object-cover rounded-xl shadow-md border border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {selectedShow.screenFormat}
                </span>
                <h3 className="text-base font-black text-white mt-1 truncate">
                  {selectedMovie.title}
                </h3>
                <p className="text-xs text-slate-400 truncate">{selectedShow.theatreName}</p>
                <p className="text-xs text-slate-400">
                  {selectedShow.date} • {selectedShow.startTime}
                </p>
              </div>
            </div>

            {/* Reserved Seats */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Seats ({selectedSeats.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map(s => (
                  <span
                    key={`${s.row}${s.number}`}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-amber-300"
                  >
                    {s.row}{s.number} ({s.tier} - ${s.price})
                  </span>
                ))}
              </div>
            </div>

            {/* Concessions (if any) */}
            {concessionsList.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Snacks & Drinks
                </p>
                <div className="space-y-1.5 text-xs">
                  {concessionsList.map(c => (
                    <div key={c.item.id} className="flex justify-between text-slate-300">
                      <span>
                        {c.quantity}x {c.item.name}
                      </span>
                      <span>${(c.item.price * c.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost Breakdown */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Tickets Subtotal</span>
                <span>${ticketsTotal.toFixed(2)}</span>
              </div>

              {concessionsTotal > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Concessions Subtotal</span>
                  <span>${concessionsTotal.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>Cinema Convenience Fee</span>
                <span>${convenienceFee.toFixed(2)}</span>
              </div>

              {appliedPromo && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Promo ({appliedPromo.code})
                  </span>
                  <span>-${appliedPromo.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-between text-white text-base font-black">
                <span>Total Amount Due</span>
                <span className="text-amber-400">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Promo Code Input Card */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              Apply Promo Code
            </h4>

            {appliedPromo ? (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-400">{appliedPromo.code} Applied</p>
                  <p className="text-[11px] text-emerald-300/80">{appliedPromo.description}</p>
                </div>
                <button
                  onClick={removePromo}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={e => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Enter promo code..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono uppercase text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => handleApplyPromo()}
                    disabled={promoLoading || !promoInput.trim()}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 disabled:opacity-40 transition"
                  >
                    {promoLoading ? 'Checking...' : 'Apply'}
                  </button>
                </div>

                {promoError && (
                  <p className="text-[11px] text-rose-400 mt-1.5">{promoError}</p>
                )}

                {/* Promo Code suggestions */}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
                  <span className="text-slate-500">Try:</span>
                  <button
                    onClick={() => handleApplyPromo('CINEMA20')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono transition"
                  >
                    CINEMA20 (20% Off)
                  </button>
                  <button
                    onClick={() => handleApplyPromo('IMOVIES10')}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono transition"
                  >
                    IMOVIES10 ($10 Off)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Payment Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Select Payment Method</span>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-normal">
                <Lock className="w-3 h-3 text-emerald-400" />
                256-bit Encrypted
              </span>
            </h3>

            {/* Payment Options Radio Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'card', label: 'Credit Card', icon: '💳' },
                { id: 'applepay', label: 'Apple Pay', icon: '🍎' },
                { id: 'googlepay', label: 'Google Pay', icon: '🇬' },
                { id: 'upi', label: 'Instant UPI', icon: '⚡' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setPaymentMethod(opt.id as any)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    paymentMethod === opt.id
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl block mb-1">{opt.icon}</span>
                  <span className="text-xs font-bold">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Card Inputs */}
            {paymentMethod === 'card' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={e => setCardHolder(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="Full Name as on card"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                    placeholder="•••• •••• •••• ••••"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      placeholder="MM/YY"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                      Security Code (CVV)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      placeholder="•••"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod !== 'card' && (
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
                <p className="text-xs font-semibold text-slate-300">
                  Ready to authorize via{' '}
                  {paymentMethod === 'applepay'
                    ? 'Apple Pay biometric'
                    : paymentMethod === 'googlepay'
                    ? 'Google Wallet'
                    : 'UPI Virtual Payment Address'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Click the button below to authorize seamless 1-click cinema ticket purchase.
                </p>
              </div>
            )}

            {/* Guarantee note */}
            <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">100% Verified Ticket Pass:</strong> You will
                instantly receive digital barcoded tickets with seat assurance and free cancellation
                up to 2 hours prior to showtime.
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing Payment...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Pay ${totalAmount.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
