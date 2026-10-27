import React, { useState, useEffect } from 'react';
import {
  Shield,
  Film,
  Calendar,
  DollarSign,
  TrendingUp,
  Ticket,
  Plus,
  Trash2,
  Edit2,
  X,
  RotateCcw,
  Search,
  CheckCircle2,
  MapPin,
  Clock,
  Layers,
  Users,
  Sparkles,
  Star,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AdminStats, Movie, Theatre, Show, Booking } from '../types';

interface AdminDashboardProps {
  onClose: () => void;
  onRefreshData?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onRefreshData }) => {
  const { user, loginAsDemoAdmin, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'movies' | 'shows' | 'bookings' | 'theatres' | 'suggested'>('analytics');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // In-dashboard admin login form state
  const [adminEmail, setAdminEmail] = useState('admin@imovies.com');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Movie Modal state
  const [movieModalOpen, setMovieModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [movieForm, setMovieForm] = useState({
    title: '',
    tagline: '',
    synopsis: '',
    posterUrl: '',
    backdropUrl: '',
    trailerUrl: '',
    duration: 120,
    releaseDate: new Date().toISOString().split('T')[0],
    genres: 'Sci-Fi, Action',
    languages: 'English, Spanish',
    censorRating: 'PG-13' as const,
    director: '',
    formats: 'IMAX 3D, Dolby Atmos, 2D',
    status: 'now_showing' as 'now_showing' | 'coming_soon',
  });

  // Show Modal state
  const [showModalOpen, setShowModalOpen] = useState(false);
  const [showForm, setShowForm] = useState({
    movieId: '',
    theatreId: '',
    screenId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '04:30 PM',
    priceVIP: 22,
    pricePremium: 18,
    priceStandard: 14,
  });

  // Search filter for bookings
  const [bookingSearch, setBookingSearch] = useState('');

  useEffect(() => {
    loadAllAdminData();
  }, [user?.role]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch public cinema data
      const [moviesRes, theatresRes, showsRes] = await Promise.all([
        api.getMovies({ status: 'all' }).catch(() => ({ movies: [] })),
        api.getTheatres().catch(() => ({ theatres: [] })),
        api.getShows().catch(() => ({ shows: [] })),
      ]);
      setMovies(moviesRes.movies || []);
      setTheatres(theatresRes.theatres || []);
      setShows(showsRes.shows || []);

      // 2. Only fetch protected stats and bookings if current session is an admin
      if (user?.role === 'admin') {
        try {
          const [statsRes, bookingsRes] = await Promise.all([
            api.getAdminStats(),
            api.getBookings(),
          ]);
          setStats(statsRes);
          setBookings(bookingsRes.bookings || []);
        } catch (authErr) {
          console.warn('Admin stats could not be loaded for current session:', authErr);
        }
      }
    } catch (err: any) {
      console.warn('Could not load cinema data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleToggleFeatured = async (movie: Movie) => {
    try {
      const nextFeatured = !movie.featured;
      await api.updateMovie(movie.id, { featured: nextFeatured });
      setMovies(prev => prev.map(m => (m.id === movie.id ? { ...m, featured: nextFeatured } : m)));
      showToast(`Updated "${movie.title}" suggested status to: ${nextFeatured ? 'Recommended' : 'Standard'}`);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update movie');
    }
  };

  // Movie actions
  const handleOpenAddMovie = () => {
    setEditingMovie(null);
    setMovieForm({
      title: '',
      tagline: '',
      synopsis: '',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
      trailerUrl: 'https://www.youtube.com/embed/Way9Dexny3w',
      duration: 125,
      releaseDate: new Date().toISOString().split('T')[0],
      genres: 'Action, Thriller',
      languages: 'English',
      censorRating: 'PG-13',
      director: 'Christopher Nolan',
      formats: 'IMAX 3D, Dolby Atmos',
      status: 'now_showing',
    });
    setMovieModalOpen(true);
  };

  const handleOpenEditMovie = (movie: Movie) => {
    setEditingMovie(movie);
    setMovieForm({
      title: movie.title,
      tagline: movie.tagline,
      synopsis: movie.synopsis,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
      trailerUrl: movie.trailerUrl,
      duration: movie.duration,
      releaseDate: movie.releaseDate,
      genres: movie.genres.join(', '),
      languages: movie.languages.join(', '),
      censorRating: movie.censorRating as any,
      director: movie.director,
      formats: movie.formats.join(', '),
      status: movie.status,
    });
    setMovieModalOpen(true);
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Movie> = {
        title: movieForm.title,
        tagline: movieForm.tagline,
        synopsis: movieForm.synopsis,
        posterUrl: movieForm.posterUrl,
        backdropUrl: movieForm.backdropUrl,
        trailerUrl: movieForm.trailerUrl,
        duration: Number(movieForm.duration),
        releaseDate: movieForm.releaseDate,
        genres: movieForm.genres.split(',').map(s => s.trim()).filter(Boolean),
        languages: movieForm.languages.split(',').map(s => s.trim()).filter(Boolean),
        censorRating: movieForm.censorRating,
        director: movieForm.director,
        formats: movieForm.formats.split(',').map(s => s.trim()) as any,
        status: movieForm.status,
      };

      if (editingMovie) {
        await api.updateMovie(editingMovie.id, payload);
        showToast(`Updated "${payload.title}" successfully`);
      } else {
        await api.createMovie(payload);
        showToast(`Created new movie "${payload.title}" successfully`);
      }

      setMovieModalOpen(false);
      loadAllAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to save movie');
    }
  };

  const handleDeleteMovie = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? All associated shows will also be deleted.`)) return;
    try {
      await api.deleteMovie(id);
      showToast(`Deleted "${title}"`);
      loadAllAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete movie');
    }
  };

  // Show actions
  const handleOpenAddShow = () => {
    if (movies.length === 0 || theatres.length === 0) return;
    const defaultTheat = theatres[0];
    setShowForm({
      movieId: movies[0].id,
      theatreId: defaultTheat.id,
      screenId: defaultTheat.screens[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      startTime: '04:30 PM',
      priceVIP: 24,
      pricePremium: 19,
      priceStandard: 15,
    });
    setShowModalOpen(true);
  };

  const handleSaveShow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createShow({
        movieId: showForm.movieId,
        theatreId: showForm.theatreId,
        screenId: showForm.screenId,
        date: showForm.date,
        startTime: showForm.startTime,
        basePrices: {
          VIP: Number(showForm.priceVIP),
          Premium: Number(showForm.pricePremium),
          Standard: Number(showForm.priceStandard),
        },
      });

      showToast('Show scheduled successfully');
      setShowModalOpen(false);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule show');
    }
  };

  const handleDeleteShow = async (id: string) => {
    if (!window.confirm('Delete this showtime?')) return;
    try {
      await api.deleteShow(id);
      showToast('Show deleted');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete show');
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset all cinema data (movies, bookings, shows) back to default seed?')) return;
    try {
      await api.resetData();
      showToast('Database reset to initial sample state successfully');
      loadAllAdminData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to reset database');
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (!bookingSearch.trim()) return true;
    const q = bookingSearch.toLowerCase();
    return (
      b.id.toLowerCase().includes(q) ||
      b.userName.toLowerCase().includes(q) ||
      b.movieTitle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Admin Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">IMovies Cinema Director Console</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  Admin Master
                </span>
              </div>
              <p className="text-xs text-slate-400">Manage movies, live shows, seat capacities, and view revenues</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetData}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
              title="Reset data to original seed"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Data</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {toastMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 overflow-x-auto shrink-0">
          {[
            { id: 'analytics', label: 'Analytics & KPIs', icon: TrendingUp },
            { id: 'movies', label: `Movies (${movies.length})`, icon: Film },
            { id: 'suggested', label: 'Suggested & Curated', icon: Sparkles },
            { id: 'shows', label: `Shows & Schedules (${shows.length})`, icon: Calendar },
            { id: 'theatres', label: `Cinemas (${theatres.length})`, icon: MapPin },
            { id: 'bookings', label: `Transactions (${bookings.length})`, icon: Ticket },
          ].map(t => {
            const Icon = t.icon;
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold text-xs shrink-0 transition-all ${
                  isSelected
                    ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {(!user || user.role !== 'admin') ? (
            <div className="max-w-md mx-auto py-10 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">Cinema Director Access Required</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The management console allows editing movies, scheduling screenings, managing auditorium capacity, and inspecting gross revenue. Please sign in as Cinema Director to proceed.
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
                  {authError}
                </div>
              )}

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <button
                  type="button"
                  disabled={loggingIn}
                  onClick={async () => {
                    setLoggingIn(true);
                    setAuthError(null);
                    try {
                      await loginAsDemoAdmin();
                      showToast('Signed in as Cinema Director successfully');
                    } catch (e: any) {
                      setAuthError(e.message || 'Login failed');
                    } finally {
                      setLoggingIn(false);
                    }
                  }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  <Shield className="w-4 h-4" />
                  <span>{loggingIn ? 'Authenticating...' : '⚡ Quick Sign In as Cinema Director'}</span>
                </button>

                <p className="text-[11px] text-slate-500">
                  Demo credentials: <strong className="text-slate-400">admin@imovies.com</strong> / <strong className="text-slate-400">admin123</strong>
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="py-20 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading admin console data...
            </div>
          ) : (
            <>
              {/* TAB 1: ANALYTICS & KPIS */}
              {activeTab === 'analytics' && stats && (
                <div className="space-y-6">
                  {/* Top KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <p className="text-xs font-semibold text-slate-400">Gross Ticket Sales</p>
                      <p className="text-2xl font-black text-amber-400">
                        ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[11px] text-emerald-400">
                        {stats.confirmedBookingsCount} confirmed bookings
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <p className="text-xs font-semibold text-slate-400">Tickets Issued</p>
                      <p className="text-2xl font-black text-white">{stats.totalTicketsSold}</p>
                      <p className="text-[11px] text-slate-400">Across all theatre halls</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <p className="text-xs font-semibold text-slate-400">Cinema Occupancy Rate</p>
                      <p className="text-2xl font-black text-cyan-400">{stats.overallOccupancyRate}%</p>
                      <p className="text-[11px] text-slate-400">Capacity utilization</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <p className="text-xs font-semibold text-slate-400">Active Screens</p>
                      <p className="text-2xl font-black text-indigo-400">{stats.activeShowsCount}</p>
                      <p className="text-[11px] text-slate-400">{stats.totalTheatresCount} locations</p>
                    </div>
                  </div>

                  {/* Top Grossing Movies Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                        Top Grossing Titles
                      </h3>
                      <div className="space-y-3">
                        {stats.topMovies.map((m, idx) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-400 text-xs">
                                #{idx + 1}
                              </span>
                              <span className="font-bold text-white">{m.title}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-extrabold text-amber-400">${m.revenue.toFixed(2)}</p>
                              <p className="text-[10px] text-slate-500">{m.tickets} tickets sold</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Theatres Occupancy Breakdown */}
                    <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        Theatre Hall Performance
                      </h3>
                      <div className="space-y-3">
                        {stats.theatreStats.map(th => (
                          <div
                            key={th.id}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs space-y-1.5"
                          >
                            <div className="flex justify-between font-bold text-white">
                              <span>
                                {th.name} ({th.city})
                              </span>
                              <span className="text-amber-400">{th.occupancyRate}% filled</span>
                            </div>
                            {/* Visual Progress bar */}
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${Math.max(5, th.occupancyRate)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500">{th.totalShows} active scheduled shows</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MOVIES MANAGEMENT */}
              {activeTab === 'movies' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2">
                    <p className="text-xs text-slate-400">Add, edit synopsis, trailers, and release schedules</p>
                    <button
                      onClick={handleOpenAddMovie}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Movie</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {movies.map(m => (
                      <div
                        key={m.id}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex gap-4"
                      >
                        <img
                          src={m.posterUrl}
                          alt={m.title}
                          className="w-16 aspect-[2/3] object-cover rounded-xl shadow-md border border-slate-800 shrink-0"
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-800">
                                {m.rating} ★
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                {m.status.replace('_', ' ')}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white mt-1 truncate">{m.title}</h4>
                            <p className="text-xs text-slate-400 line-clamp-1">{m.genres.join(', ')}</p>
                            <p className="text-[11px] text-slate-500">{m.duration} mins • {m.censorRating}</p>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                            <button
                              onClick={() => handleOpenEditMovie(m)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMovie(m.id, m.title)}
                              className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs"
                              title="Delete movie"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: SUGGESTED & CURATED MOVIES */}
              {activeTab === 'suggested' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        AI & Curated Suggested Movies Engine
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        These movies are recommended to cinema patrons on the main dashboard based on critical acclaim, formats, and rating.
                      </p>
                    </div>

                    <button
                      onClick={handleOpenAddMovie}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Movie</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {movies.map(m => {
                      const score = m.matchScore || Math.floor(92 + (m.rating - 7.5) * 4);
                      const isPromoted = Boolean(m.featured);

                      return (
                        <div
                          key={m.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isPromoted
                              ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                              : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <img
                              src={m.posterUrl}
                              alt={m.title}
                              className="w-16 aspect-[2/3] object-cover rounded-xl shadow-md border border-slate-800 shrink-0"
                            />

                            <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    {score}% Match
                                  </span>
                                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                                    <Star className="w-3 h-3 fill-amber-400" />
                                    {m.rating} ★
                                  </span>
                                  {isPromoted && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                                      Featured
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-sm font-bold text-white mt-1 truncate">{m.title}</h4>
                                <p className="text-[11px] text-amber-300/90 font-medium line-clamp-1 mt-0.5">
                                  ✨ {m.suggestedReason || (m.rating >= 8.8 ? 'Masterpiece • Critic Pick' : 'Box Office Blockbuster')}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {m.genres.slice(0, 2).join(', ')} • {m.formats.slice(0, 2).join(', ')}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 pt-3 mt-2 border-t border-slate-800/80">
                                <button
                                  onClick={() => handleToggleFeatured(m)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                    isPromoted
                                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                                  }`}
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>{isPromoted ? 'Promoted (Top Shelf)' : 'Promote to Suggested'}</span>
                                </button>

                                <button
                                  onClick={() => handleOpenEditMovie(m)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                                  title="Edit details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: SHOWS & SCHEDULES */}
              {activeTab === 'shows' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2">
                    <p className="text-xs text-slate-400">
                      Configure movie screening times, auditoriums, and ticket pricing tiers
                    </p>
                    <button
                      onClick={handleOpenAddShow}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Schedule New Show</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden">
                    {shows.slice(0, 20).map(s => {
                      const movie = movies.find(m => m.id === s.movieId);
                      const theatre = theatres.find(t => t.id === s.theatreId);
                      const bookedSeats = s.seatLayout.filter(st => st.status === 'booked').length;
                      const occupancy = Math.round((bookedSeats / s.seatLayout.length) * 100);

                      return (
                        <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-400 text-sm">{s.startTime}</span>
                              <span className="text-slate-400">({s.date})</span>
                              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-bold text-[10px] text-cyan-400">
                                {s.screenFormat}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-white mt-0.5">{movie?.title || 'Unknown Title'}</p>
                            <p className="text-slate-400 text-[11px]">
                              {theatre?.name} • {s.screenName}
                            </p>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="font-bold text-slate-200">
                                VIP: ${s.basePrices.VIP} | Std: ${s.basePrices.Standard}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {bookedSeats}/{s.seatLayout.length} booked ({occupancy}%)
                              </p>
                            </div>

                            <button
                              onClick={() => handleDeleteShow(s.id)}
                              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                              title="Delete Show"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: THEATRES */}
              {activeTab === 'theatres' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {theatres.map(th => (
                    <div key={th.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-base font-bold text-white">{th.name}</h4>
                          <p className="text-xs text-slate-400">{th.address}, {th.city}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-bold text-amber-400">
                          {th.screens.length} Screens
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                        {th.screens.map(sc => (
                          <div key={sc.id} className="flex justify-between text-slate-300">
                            <span>{sc.name} ({sc.format})</span>
                            <span className="text-slate-500">{sc.totalSeats} seats</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-1 pt-2">
                        {th.amenities.map(a => (
                          <span key={a} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 5: BOOKINGS / TRANSACTIONS */}
              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={bookingSearch}
                        onChange={e => setBookingSearch(e.target.value)}
                        placeholder="Search by ID, customer, movie..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      Showing {filteredBookings.length} total transactions
                    </span>
                  </div>

                  <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl bg-slate-950 overflow-hidden text-xs">
                    {filteredBookings.map(b => (
                      <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400">#{b.id}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                b.status === 'confirmed'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {b.status}
                            </span>
                            <span className="text-slate-400">Customer: <strong className="text-white">{b.userName}</strong> ({b.userEmail})</span>
                          </div>
                          <p className="text-white font-bold mt-1">
                            {b.movieTitle} • {b.theatreName}
                          </p>
                          <p className="text-slate-400 text-[11px]">
                            {b.showDate} at {b.showTime} • Seats: {b.seats.map(s => `${s.row}${s.number}`).join(', ')}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-sm font-extrabold text-white">${b.totalAmount.toFixed(2)}</p>
                          <p className="text-[10px] text-slate-500 uppercase">{b.paymentMethod} • {b.paymentId}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add / Edit Movie Modal */}
      {movieModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingMovie ? `Edit Movie: ${editingMovie.title}` : 'Add New Movie Title'}
              </h3>
              <button onClick={() => setMovieModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovie} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Movie Title *</label>
                  <input
                    type="text"
                    required
                    value={movieForm.title}
                    onChange={e => setMovieForm({ ...movieForm, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Tagline</label>
                  <input
                    type="text"
                    value={movieForm.tagline}
                    onChange={e => setMovieForm({ ...movieForm, tagline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Synopsis</label>
                <textarea
                  rows={3}
                  value={movieForm.synopsis}
                  onChange={e => setMovieForm({ ...movieForm, synopsis: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Poster Image URL *</label>
                  <input
                    type="text"
                    required
                    value={movieForm.posterUrl}
                    onChange={e => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">YouTube Trailer Embed URL</label>
                  <input
                    type="text"
                    value={movieForm.trailerUrl}
                    onChange={e => setMovieForm({ ...movieForm, trailerUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={movieForm.duration}
                    onChange={e => setMovieForm({ ...movieForm, duration: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Director</label>
                  <input
                    type="text"
                    value={movieForm.director}
                    onChange={e => setMovieForm({ ...movieForm, director: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Status</label>
                  <select
                    value={movieForm.status}
                    onChange={e => setMovieForm({ ...movieForm, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="now_showing">Now Showing</option>
                    <option value="coming_soon">Coming Soon</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Genres (Comma separated)</label>
                  <input
                    type="text"
                    value={movieForm.genres}
                    onChange={e => setMovieForm({ ...movieForm, genres: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Screen Formats</label>
                  <input
                    type="text"
                    value={movieForm.formats}
                    onChange={e => setMovieForm({ ...movieForm, formats: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMovieModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                >
                  Save Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Show Modal */}
      {showModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Schedule New Screening Show</h3>
              <button onClick={() => setShowModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShow} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Select Movie</label>
                <select
                  value={showForm.movieId}
                  onChange={e => setShowForm({ ...showForm, movieId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.duration}m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Select Cinema Theatre</label>
                <select
                  value={showForm.theatreId}
                  onChange={e => {
                    const th = theatres.find(t => t.id === e.target.value) || theatres[0];
                    setShowForm({
                      ...showForm,
                      theatreId: th.id,
                      screenId: th.screens[0]?.id || '',
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  {theatres.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={showForm.date}
                    onChange={e => setShowForm({ ...showForm, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Showtime</label>
                  <select
                    value={showForm.startTime}
                    onChange={e => setShowForm({ ...showForm, startTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="10:30 AM">10:30 AM (Morning Matinee)</option>
                    <option value="01:45 PM">01:45 PM (Afternoon)</option>
                    <option value="04:30 PM">04:30 PM (Evening)</option>
                    <option value="07:15 PM">07:15 PM (Prime Evening)</option>
                    <option value="10:00 PM">10:00 PM (Night Show)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">VIP Price ($)</label>
                  <input
                    type="number"
                    value={showForm.priceVIP}
                    onChange={e => setShowForm({ ...showForm, priceVIP: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Premium ($)</label>
                  <input
                    type="number"
                    value={showForm.pricePremium}
                    onChange={e => setShowForm({ ...showForm, pricePremium: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Standard ($)</label>
                  <input
                    type="number"
                    value={showForm.priceStandard}
                    onChange={e => setShowForm({ ...showForm, priceStandard: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                >
                  Publish Show
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
