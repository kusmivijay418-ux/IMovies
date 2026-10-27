export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
}

export interface Movie {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  duration: number; // in mins
  releaseDate: string;
  genres: string[];
  languages: string[];
  censorRating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
  rating: number;
  votesCount: number;
  director: string;
  cast: { name: string; role: string; avatarUrl?: string }[];
  formats: ('2D' | '3D' | 'IMAX 3D' | '4DX' | 'Dolby Atmos')[];
  status: 'now_showing' | 'coming_soon';
  featured?: boolean;
  suggestedReason?: string;
  matchScore?: number;
}

export interface Theatre {
  id: string;
  name: string;
  city: string;
  address: string;
  screens: {
    id: string;
    name: string;
    format: 'IMAX 3D' | 'Dolby Atmos' | '4DX' | 'Standard';
    totalSeats: number;
    rows: number;
    cols: number;
  }[];
  amenities: string[];
}

export interface SeatStatus {
  row: string;
  number: number;
  tier: 'VIP' | 'Premium' | 'Standard';
  price: number;
  status: 'available' | 'booked' | 'locked';
  lockedUntil?: number;
  lockedByUserId?: string;
}

export interface Show {
  id: string;
  movieId: string;
  theatreId: string;
  screenId: string;
  screenName: string;
  screenFormat: 'IMAX 3D' | 'Dolby Atmos' | '4DX' | 'Standard';
  date: string;
  startTime: string;
  endTime: string;
  basePrices: {
    VIP: number;
    Premium: number;
    Standard: number;
  };
  seatLayout: SeatStatus[];
  movieTitle?: string;
  moviePoster?: string;
  movieDuration?: number;
  theatreName?: string;
  theatreCity?: string;
  theatreAddress?: string;
  availableSeatsCount?: number;
  totalSeatsCount?: number;
}

export interface ConcessionItem {
  id: string;
  name: string;
  category: 'Popcorn' | 'Beverages' | 'Combos' | 'Snacks';
  price: number;
  imageUrl: string;
  description: string;
}

export interface BookingConcession {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  showId: string;
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  theatreId: string;
  theatreName: string;
  theatreAddress: string;
  screenName: string;
  screenFormat: string;
  showDate: string;
  showTime: string;
  seats: { row: string; number: number; tier: string; price: number }[];
  concessions: BookingConcession[];
  subtotal: number;
  convenienceFee: number;
  discountAmount: number;
  totalAmount: number;
  promoCode?: string;
  paymentMethod: 'card' | 'applepay' | 'googlepay' | 'upi';
  paymentId: string;
  status: 'confirmed' | 'cancelled';
  bookingDate: string;
  cancelledAt?: string;
  refundAmount?: number;
  qrCodeData: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'cancellation' | 'promo' | 'reminder';
  read: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalRevenue: number;
  totalBookings: number;
  confirmedBookingsCount: number;
  cancelledBookingsCount: number;
  totalTicketsSold: number;
  activeMoviesCount: number;
  activeShowsCount: number;
  totalTheatresCount: number;
  overallOccupancyRate: number;
  topMovies: { id: string; title: string; revenue: number; tickets: number }[];
  theatreStats: { id: string; name: string; city: string; totalShows: number; occupancyRate: number }[];
  recentBookings: Booking[];
}
