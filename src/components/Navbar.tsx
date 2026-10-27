import React, { useState, useEffect } from 'react';
import {
  Film,
  Ticket,
  MapPin,
  Bell,
  User as UserIcon,
  LogOut,
  Shield,
  Search,
  Sparkles,
  CheckCircle2,
  Calendar,
  X,
  Menu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { api } from '../api/client';
import { NotificationItem } from '../types';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenHistory: () => void;
  onOpenAdmin: () => void;
  activeCity: string;
  onChangeCity: (city: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenHistory,
  onOpenAdmin,
  activeCity,
  onChangeCity,
  searchQuery,
  onSearchChange,
}) => {
  const { user, logout, loginAsDemoAdmin, loginAsDemoUser } = useAuth();
  const { resetFlow } = useBooking();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cities = ['All Cities', 'New York', 'Los Angeles', 'Chicago', 'San Francisco'];

  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => {
                resetFlow();
              }}
              className="flex items-center gap-3 group text-left focus:outline-none"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 p-[2px] shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all duration-300">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Film className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-amber-100 to-amber-400 bg-clip-text text-transparent">
                  IMovies
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Cinema
                </span>
              </div>
            </button>

            {/* City Selector */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 transition">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={activeCity}
                onChange={e => onChangeCity(e.target.value)}
                className="bg-transparent border-none text-slate-200 text-xs focus:outline-none cursor-pointer pr-1"
              >
                {cities.map(c => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search movies, genre, directors, actors..."
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/60 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            {/* My Bookings CTA */}
            {user && (
              <button
                onClick={onOpenHistory}
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-medium text-slate-200 hover:text-white transition"
              >
                <Ticket className="w-4 h-4 text-amber-400" />
                <span>My Tickets</span>
              </button>
            )}

            {/* Admin Dashboard Button if admin */}
            {user?.role === 'admin' && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-semibold transition"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Panel</span>
              </button>
            )}

            {/* Notifications Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <h4 className="text-sm font-bold text-white">Notifications</h4>
                      </div>
                      <span className="text-xs text-slate-400">{notifications.length} updates</span>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 mt-2">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkRead(n.id)}
                            className={`py-3 px-2 rounded-lg cursor-pointer transition ${
                              n.read ? 'opacity-70 hover:bg-slate-800/40' : 'bg-slate-800/70 hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-amber-300">{n.title}</p>
                              {!n.read && <span className="w-2 h-2 rounded-full bg-amber-400 mt-1" />}
                            </div>
                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-500 mt-1.5 block">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Auth Section */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 p-1.5 pl-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-medium transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-xs font-bold text-black">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-slate-200">
                    {user.name.split(' ')[0]}
                  </span>
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenHistory();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      >
                        <Ticket className="w-3.5 h-3.5 text-amber-400" />
                        My Bookings & Tickets
                      </button>

                      {user.role === 'admin' && (
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            onOpenAdmin();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-400 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Cinema Admin Console
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Quick Demo Mode Switcher Bar */}
            <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-slate-800 text-xs">
              <span className="text-[11px] text-slate-500">Quick Test:</span>
              <button
                onClick={loginAsDemoAdmin}
                className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] text-amber-300 font-medium transition"
                title="Sign in with admin credentials"
              >
                ⚡ Admin
              </button>
              <button
                onClick={loginAsDemoUser}
                className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 font-medium transition"
                title="Sign in with demo user credentials"
              >
                👤 User
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800 space-y-3">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search movies, genre, cast..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">City:</span>
              <select
                value={activeCity}
                onChange={e => onChangeCity(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
              >
                {cities.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={loginAsDemoAdmin}
                className="flex-1 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20"
              >
                ⚡ Switch to Admin
              </button>
              <button
                onClick={loginAsDemoUser}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium"
              >
                👤 Switch to User
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
