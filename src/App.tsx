import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookingProvider, useBooking } from './context/BookingContext';
import { Navbar } from './components/Navbar';
import { HeroCarousel } from './components/HeroCarousel';
import { MovieFilters } from './components/MovieFilters';
import { MovieCard } from './components/MovieCard';
import { MovieDetailsModal } from './components/MovieDetailsModal';
import { ShowtimePicker } from './components/ShowtimePicker';
import { SeatMap } from './components/SeatMap';
import { ConcessionsSelector } from './components/ConcessionsSelector';
import { CheckoutModal } from './components/CheckoutModal';
import { TicketPassModal } from './components/TicketPassModal';
import { BookingHistoryModal } from './components/BookingHistoryModal';
import { AdminDashboard } from './components/AdminDashboard';
import { TrailerModal } from './components/TrailerModal';
import { AuthModal } from './components/AuthModal';
import { SuggestedMoviesSection } from './components/SuggestedMoviesSection';
import { api } from './api/client';
import { Movie, Booking } from './types';
import {
  Sparkles,
  Film,
  Award,
  Volume2,
  Tv,
  Utensils,
  ShieldCheck,
  Heart,
  ChevronRight,
  Info,
  Plus,
} from 'lucide-react';

function MainApp() {
  const { user } = useAuth();
  const {
    currentStep,
    setCurrentStep,
    startBookingForMovie,
    latestBooking,
    setLatestBooking,
    resetFlow,
  } = useBooking();

  // Data states
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState<boolean>(true);
  const [suggestedData, setSuggestedData] = useState<{
    suggested: Movie[];
    topPicks: Movie[];
    trending: Movie[];
    imaxExperience: Movie[];
  }>({
    suggested: [],
    topPicks: [],
    trending: [],
    imaxExperience: [],
  });

  // Filter states
  const [activeCity, setActiveCity] = useState<string>('All Cities');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'now_showing' | 'coming_soon' | 'all'>('now_showing');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedFormat, setSelectedFormat] = useState<string>('All');

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [adminOpen, setAdminOpen] = useState<boolean>(false);
  const [detailsMovie, setDetailsMovie] = useState<Movie | null>(null);
  const [trailerState, setTrailerState] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  }>({
    isOpen: false,
    url: '',
    title: '',
  });

  useEffect(() => {
    loadMovies();
    loadSuggestedMovies();
  }, [activeTab, selectedGenre, selectedLanguage, searchQuery]);

  const loadMovies = async () => {
    setLoadingMovies(true);
    try {
      const res = await api.getMovies({
        status: activeTab,
        genre: selectedGenre,
        language: selectedLanguage,
        search: searchQuery,
      });
      setMovies(res.movies || []);
    } catch (err) {
      console.error('Failed to load movies:', err);
    } finally {
      setLoadingMovies(false);
    }
  };

  const loadSuggestedMovies = async () => {
    try {
      const res = await api.getSuggestedMovies();
      setSuggestedData({
        suggested: res.suggested || [],
        topPicks: res.topPicks || [],
        trending: res.trending || [],
        imaxExperience: res.imaxExperience || [],
      });
    } catch (err) {
      console.error('Failed to load suggested movies:', err);
    }
  };

  const handleOpenTrailer = (trailerUrl: string, title: string) => {
    setTrailerState({
      isOpen: true,
      url: trailerUrl,
      title,
    });
  };

  const handleCloseTrailer = () => {
    setTrailerState({ isOpen: false, url: '', title: '' });
  };

  const handleResetFilters = () => {
    setActiveTab('now_showing');
    setSelectedGenre('All');
    setSelectedLanguage('All');
    setSelectedFormat('All');
    setSearchQuery('');
  };

  // Additional filter for format
  const displayMovies = selectedFormat === 'All'
    ? movies
    : movies.filter(m => m.formats.some(f => f.toLowerCase() === selectedFormat.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenHistory={() => setHistoryModalOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
        activeCity={activeCity}
        onChangeCity={setActiveCity}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Flow Controller */}
      <main className="flex-1">
        {currentStep === 'browse' && (
          <div>
            {/* Featured Hero Banner */}
            {!searchQuery && (
              <HeroCarousel
                movies={movies}
                onSelectMovie={movie => startBookingForMovie(movie)}
                onWatchTrailer={handleOpenTrailer}
              />
            )}

            {/* Movies Catalog Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              {/* Filter controls */}
              <MovieFilters
                activeTab={activeTab}
                onTabChange={setActiveTab}
                selectedGenre={selectedGenre}
                onGenreChange={setSelectedGenre}
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                selectedFormat={selectedFormat}
                onFormatChange={setSelectedFormat}
                onReset={handleResetFilters}
                totalCount={displayMovies.length}
                onAddMovie={() => setAdminOpen(true)}
              />

              {/* Suggested Movies Carousel / Curated Section */}
              <SuggestedMoviesSection
                suggestedMovies={suggestedData.suggested}
                topPicks={suggestedData.topPicks}
                trending={suggestedData.trending}
                imaxMovies={suggestedData.imaxExperience}
                onBook={startBookingForMovie}
                onViewDetails={setDetailsMovie}
                onWatchTrailer={handleOpenTrailer}
              />

              {/* Movies Grid Header */}
              <div className="flex items-center justify-between mb-6 pt-4 border-t border-slate-800/80">
                <div>
                  <h3 className="text-xl font-black text-white">
                    {activeTab === 'now_showing'
                      ? 'Now Showing in Theatres'
                      : activeTab === 'coming_soon'
                      ? 'Upcoming Blockbusters'
                      : 'All Cinema Releases'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select any title to explore showtimes and choose your seats
                  </p>
                </div>

                <button
                  onClick={() => setAdminOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-amber-400 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Movie</span>
                </button>
              </div>

              {/* Movies Grid */}
              {loadingMovies ? (
                <div className="py-24 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-slate-400">Loading cinema catalog & showtimes...</p>
                </div>
              ) : displayMovies.length === 0 ? (
                <div className="py-16 text-center rounded-3xl bg-slate-900/50 border border-slate-800 p-8 space-y-4">
                  <Film className="w-12 h-12 text-slate-600 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-slate-200">No movies match your criteria</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Try clearing or adjusting your search term, genre, or format filters above, or explore the suggested movies above.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleResetFilters}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 transition"
                    >
                      Reset All Filters
                    </button>
                    <button
                      onClick={() => setAdminOpen(true)}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Movie</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
                  {displayMovies.map(movie => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onBook={startBookingForMovie}
                      onViewDetails={setDetailsMovie}
                      onWatchTrailer={handleOpenTrailer}
                    />
                  ))}
                </div>
              )}

              {/* Cinema Experience Features Section */}
              <div className="mt-20 pt-12 border-t border-slate-800/80">
                <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    The IMovies Difference
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Unrivaled Cinematic Luxury
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Experience state-of-the-art audiovisual fidelity, premium plush seating, and warm gourmet concessions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-amber-500/40 transition">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                      <Tv className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">IMAX with Laser 4K</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Next-generation dual-4K laser projection delivering crystal-clear images, deeper contrast, and vivid colors.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-amber-500/40 transition">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Dolby Atmos Audio</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Immersive multidimensional sound that flows all around you, including overhead speakers for realism.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-amber-500/40 transition">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Heated VIP Recliners</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Electric motorized full-recline plush leather chairs with personal swivel tables and USB charging.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-amber-500/40 transition">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Artisan Concessions</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Warm caramel jumbo tubs, cheesy nachos, handcrafted hotdogs, and ice-cold fountain sodas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP: Showtime Selection */}
        {currentStep === 'showtime-select' && (
          <ShowtimePicker onBack={() => setCurrentStep('browse')} />
        )}

        {/* STEP: Interactive Seat Map */}
        {currentStep === 'seat-select' && (
          <SeatMap
            onBack={() => setCurrentStep('showtime-select')}
            onProceed={() => setCurrentStep('concessions')}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {/* STEP: Concessions */}
        {currentStep === 'concessions' && (
          <ConcessionsSelector
            onBack={() => setCurrentStep('seat-select')}
            onProceed={() => setCurrentStep('checkout')}
          />
        )}

        {/* STEP: Checkout & Payment */}
        {currentStep === 'checkout' && (
          <CheckoutModal
            onBack={() => setCurrentStep('concessions')}
            onSuccess={() => setCurrentStep('ticket-pass')}
          />
        )}

        {/* STEP: Ticket Pass */}
        {currentStep === 'ticket-pass' && (
          <TicketPassModal
            booking={latestBooking}
            onDone={resetFlow}
            onViewAllBookings={() => {
              resetFlow();
              setHistoryModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Global Modals */}
      <MovieDetailsModal
        movie={detailsMovie}
        onClose={() => setDetailsMovie(null)}
        onBook={movie => {
          setDetailsMovie(null);
          startBookingForMovie(movie);
        }}
        onWatchTrailer={handleOpenTrailer}
      />

      <TrailerModal
        isOpen={trailerState.isOpen}
        onClose={handleCloseTrailer}
        trailerUrl={trailerState.url}
        movieTitle={trailerState.title}
      />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {historyModalOpen && (
        <BookingHistoryModal
          onClose={() => setHistoryModalOpen(false)}
          onViewTicket={b => {
            setLatestBooking(b);
            setCurrentStep('ticket-pass');
          }}
        />
      )}

      {adminOpen && (
        <AdminDashboard
          onClose={() => setAdminOpen(false)}
          onRefreshData={() => loadMovies()}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-slate-950 font-bold text-xs">
              IM
            </div>
            <span className="font-bold text-white">IMovies Cinema & Entertainment Inc.</span>
            <span>•</span>
            <span>All rights reserved &copy; {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Terms of Service</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Censor Guidelines</span>
            <span>•</span>
            <button
              onClick={() => setAdminOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-semibold underline"
            >
              Admin Console
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <MainApp />
      </BookingProvider>
    </AuthProvider>
  );
}
