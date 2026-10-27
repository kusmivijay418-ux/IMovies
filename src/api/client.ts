import {
  User,
  Movie,
  Theatre,
  Show,
  Booking,
  ConcessionItem,
  NotificationItem,
  AdminStats,
} from '../types';

const TOKEN_KEY = 'imovies_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.error('LocalStorage write failed:', err);
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(name: string, email: string, password: string, phone?: string): Promise<{ token: string; user: User }> {
    return apiRequest<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    });
  },

  async getCurrentUser(): Promise<{ user: User }> {
    return apiRequest<{ user: User }>('/api/auth/me');
  },

  // Movies
  async getMovies(params: {
    status?: string;
    genre?: string;
    language?: string;
    search?: string;
    theatreId?: string;
  } = {}): Promise<{ movies: Movie[]; total: number }> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.genre) query.set('genre', params.genre);
    if (params.language) query.set('language', params.language);
    if (params.search) query.set('search', params.search);
    if (params.theatreId) query.set('theatreId', params.theatreId);

    const qs = query.toString();
    return apiRequest<{ movies: Movie[]; total: number }>(`/api/movies${qs ? `?${qs}` : ''}`);
  },

  async getSuggestedMovies(): Promise<{
    suggested: Movie[];
    topPicks: Movie[];
    trending: Movie[];
    imaxExperience: Movie[];
  }> {
    return apiRequest('/api/movies/suggested');
  },

  async getMovieById(id: string): Promise<{
    movie: Movie;
    availableDates: string[];
    theatres: Theatre[];
    totalShowsCount: number;
  }> {
    return apiRequest(`/api/movies/${id}`);
  },

  async createMovie(movieData: Partial<Movie>): Promise<{ movie: Movie }> {
    return apiRequest<{ movie: Movie }>('/api/movies', {
      method: 'POST',
      body: JSON.stringify(movieData),
    });
  },

  async updateMovie(id: string, movieData: Partial<Movie>): Promise<{ movie: Movie }> {
    return apiRequest<{ movie: Movie }>(`/api/movies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(movieData),
    });
  },

  async deleteMovie(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/movies/${id}`, {
      method: 'DELETE',
    });
  },

  // Theatres
  async getTheatres(): Promise<{ theatres: Theatre[] }> {
    return apiRequest<{ theatres: Theatre[] }>('/api/theatres');
  },

  async createTheatre(theatreData: Partial<Theatre>): Promise<{ theatre: Theatre }> {
    return apiRequest<{ theatre: Theatre }>('/api/theatres', {
      method: 'POST',
      body: JSON.stringify(theatreData),
    });
  },

  // Shows
  async getShows(params: { movieId?: string; theatreId?: string; date?: string } = {}): Promise<{ shows: Show[] }> {
    const query = new URLSearchParams();
    if (params.movieId) query.set('movieId', params.movieId);
    if (params.theatreId) query.set('theatreId', params.theatreId);
    if (params.date) query.set('date', params.date);

    const qs = query.toString();
    return apiRequest<{ shows: Show[] }>(`/api/shows${qs ? `?${qs}` : ''}`);
  },

  async getShowById(id: string): Promise<{ show: Show; movie: Movie; theatre: Theatre }> {
    return apiRequest<{ show: Show; movie: Movie; theatre: Theatre }>(`/api/shows/${id}`);
  },

  async lockSeats(showId: string, seats: { row: string; number: number }[]): Promise<any> {
    return apiRequest(`/api/shows/${showId}/lock-seats`, {
      method: 'POST',
      body: JSON.stringify({ seats }),
    });
  },

  async unlockSeats(showId: string, seats: { row: string; number: number }[]): Promise<any> {
    return apiRequest(`/api/shows/${showId}/unlock-seats`, {
      method: 'POST',
      body: JSON.stringify({ seats }),
    });
  },

  async createShow(showData: any): Promise<{ show: Show }> {
    return apiRequest<{ show: Show }>('/api/shows', {
      method: 'POST',
      body: JSON.stringify(showData),
    });
  },

  async deleteShow(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/shows/${id}`, {
      method: 'DELETE',
    });
  },

  // Concessions
  async getConcessions(): Promise<{ concessions: ConcessionItem[] }> {
    return apiRequest<{ concessions: ConcessionItem[] }>('/api/concessions');
  },

  // Promo Validation
  async validatePromo(code: string, subtotal: number, concessionsTotal: number): Promise<{
    valid: boolean;
    code: string;
    description: string;
    discountAmount: number;
  }> {
    return apiRequest('/api/promos/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal, concessionsTotal }),
    });
  },

  // Bookings
  async getBookings(): Promise<{ bookings: Booking[] }> {
    return apiRequest<{ bookings: Booking[] }>('/api/bookings');
  },

  async createBooking(bookingPayload: any): Promise<{ message: string; booking: Booking }> {
    return apiRequest<{ message: string; booking: Booking }>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingPayload),
    });
  },

  async cancelBooking(bookingId: string): Promise<{ message: string; booking: Booking }> {
    return apiRequest<{ message: string; booking: Booking }>(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
    });
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: NotificationItem[] }> {
    return apiRequest<{ notifications: NotificationItem[] }>('/api/notifications');
  },

  async markNotificationRead(id: string): Promise<any> {
    return apiRequest(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  // Admin
  async getAdminStats(): Promise<AdminStats> {
    return apiRequest<AdminStats>('/api/admin/stats');
  },

  async resetData(): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/api/admin/reset-data', {
      method: 'POST',
    });
  },
};
