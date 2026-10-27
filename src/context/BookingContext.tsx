import React, { createContext, useContext, useState, useEffect } from 'react';
import { Movie, Show, ConcessionItem, Booking } from '../types';
import { api } from '../api/client';

export type BookingFlowStep =
  | 'browse'
  | 'movie-detail'
  | 'showtime-select'
  | 'seat-select'
  | 'concessions'
  | 'checkout'
  | 'ticket-pass';

export interface SelectedSeat {
  row: string;
  number: number;
  tier: 'VIP' | 'Premium' | 'Standard';
  price: number;
}

export interface SelectedConcession {
  item: ConcessionItem;
  quantity: number;
}

interface BookingContextType {
  currentStep: BookingFlowStep;
  setCurrentStep: (step: BookingFlowStep) => void;
  selectedMovie: Movie | null;
  setSelectedMovie: (movie: Movie | null) => void;
  selectedShow: Show | null;
  setSelectedShow: (show: Show | null) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedSeats: SelectedSeat[];
  toggleSeat: (seat: SelectedSeat) => void;
  clearSeats: () => void;
  concessions: Record<string, SelectedConcession>;
  updateConcessionQuantity: (item: ConcessionItem, delta: number) => void;
  clearConcessions: () => void;
  appliedPromo: { code: string; discountAmount: number; description: string } | null;
  applyPromo: (code: string) => Promise<void>;
  removePromo: () => void;
  subtotal: number;
  concessionsTotal: number;
  ticketsTotal: number;
  convenienceFee: number;
  totalAmount: number;
  latestBooking: Booking | null;
  setLatestBooking: (booking: Booking | null) => void;
  startBookingForMovie: (movie: Movie) => void;
  proceedToSeats: (show: Show) => void;
  resetFlow: () => void;
  lockSecondsRemaining: number;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<BookingFlowStep>('browse');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [concessions, setConcessions] = useState<Record<string, SelectedConcession>>({});
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
    description: string;
  } | null>(null);
  const [latestBooking, setLatestBooking] = useState<Booking | null>(null);
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState<number>(300);

  // Seat hold timer countdown
  useEffect(() => {
    if (selectedSeats.length === 0 || (currentStep !== 'seat-select' && currentStep !== 'concessions' && currentStep !== 'checkout')) {
      setLockSecondsRemaining(300);
      return;
    }

    const timer = setInterval(() => {
      setLockSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          alert('Seat reservation hold expired. Please reselect your seats.');
          setSelectedSeats([]);
          setCurrentStep('seat-select');
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSeats.length, currentStep]);

  const toggleSeat = (seat: SelectedSeat) => {
    setSelectedSeats(prev => {
      const exists = prev.some(s => s.row === seat.row && s.number === seat.number);
      if (exists) {
        return prev.filter(s => !(s.row === seat.row && s.number === seat.number));
      }
      if (prev.length >= 8) {
        alert('You can select a maximum of 8 seats per transaction.');
        return prev;
      }
      return [...prev, seat];
    });
  };

  const clearSeats = () => setSelectedSeats([]);

  const updateConcessionQuantity = (item: ConcessionItem, delta: number) => {
    setConcessions(prev => {
      const current = prev[item.id]?.quantity || 0;
      const nextQty = Math.max(0, current + delta);
      if (nextQty === 0) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: nextQty,
        },
      };
    });
  };

  const clearConcessions = () => setConcessions({});

  const ticketsTotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const concessionsTotal = Object.values(concessions).reduce(
    (sum, c) => sum + c.item.price * c.quantity,
    0
  );
  const subtotal = ticketsTotal + concessionsTotal;
  const convenienceFee = selectedSeats.length > 0 ? Number((selectedSeats.length * 1.75).toFixed(2)) : 0;

  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const totalAmount = Math.max(0, Number((subtotal + convenienceFee - discountAmount).toFixed(2)));

  const applyPromo = async (code: string) => {
    const res = await api.validatePromo(code, subtotal, concessionsTotal);
    if (res.valid) {
      setAppliedPromo({
        code: res.code,
        discountAmount: res.discountAmount,
        description: res.description,
      });
    }
  };

  const removePromo = () => setAppliedPromo(null);

  const startBookingForMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setSelectedSeats([]);
    setConcessions({});
    setAppliedPromo(null);
    setCurrentStep('showtime-select');
  };

  const proceedToSeats = (show: Show) => {
    setSelectedShow(show);
    setSelectedSeats([]);
    setCurrentStep('seat-select');
  };

  const resetFlow = () => {
    setSelectedMovie(null);
    setSelectedShow(null);
    setSelectedSeats([]);
    setConcessions({});
    setAppliedPromo(null);
    setCurrentStep('browse');
  };

  return (
    <BookingContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        selectedMovie,
        setSelectedMovie,
        selectedShow,
        setSelectedShow,
        selectedDate,
        setSelectedDate,
        selectedSeats,
        toggleSeat,
        clearSeats,
        concessions,
        updateConcessionQuantity,
        clearConcessions,
        appliedPromo,
        applyPromo,
        removePromo,
        subtotal,
        concessionsTotal,
        ticketsTotal,
        convenienceFee,
        totalAmount,
        latestBooking,
        setLatestBooking,
        startBookingForMovie,
        proceedToSeats,
        resetFlow,
        lockSecondsRemaining,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
