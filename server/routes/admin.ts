import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET admin dashboard analytics
router.get('/stats', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const data = db.getData();

    const confirmedBookings = data.bookings.filter(b => b.status === 'confirmed');
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalTicketsSold = confirmedBookings.reduce((sum, b) => sum + b.seats.length, 0);
    const totalCancelledBookings = data.bookings.filter(b => b.status === 'cancelled').length;

    // Calculate total capacity across all shows vs booked seats
    let totalSeatsAcrossShows = 0;
    let bookedSeatsAcrossShows = 0;

    for (const show of data.shows) {
      totalSeatsAcrossShows += show.seatLayout.length;
      bookedSeatsAcrossShows += show.seatLayout.filter(s => s.status === 'booked').length;
    }

    const overallOccupancyRate = totalSeatsAcrossShows > 0
      ? Number(((bookedSeatsAcrossShows / totalSeatsAcrossShows) * 100).toFixed(1))
      : 0;

    // Movie revenue breakdown
    const movieStatsMap: { [movieId: string]: { id: string; title: string; revenue: number; tickets: number } } = {};

    for (const movie of data.movies) {
      movieStatsMap[movie.id] = {
        id: movie.id,
        title: movie.title,
        revenue: 0,
        tickets: 0,
      };
    }

    for (const booking of confirmedBookings) {
      if (movieStatsMap[booking.movieId]) {
        movieStatsMap[booking.movieId].revenue += booking.totalAmount;
        movieStatsMap[booking.movieId].tickets += booking.seats.length;
      }
    }

    const topMovies = Object.values(movieStatsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Theatre occupancy breakdown
    const theatreStats = data.theatres.map(th => {
      const theatreShows = data.shows.filter(s => s.theatreId === th.id);
      let tSeats = 0;
      let tBooked = 0;
      for (const s of theatreShows) {
        tSeats += s.seatLayout.length;
        tBooked += s.seatLayout.filter(st => st.status === 'booked').length;
      }
      return {
        id: th.id,
        name: th.name,
        city: th.city,
        totalShows: theatreShows.length,
        occupancyRate: tSeats > 0 ? Number(((tBooked / tSeats) * 100).toFixed(1)) : 0,
      };
    });

    res.json({
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalBookings: data.bookings.length,
      confirmedBookingsCount: confirmedBookings.length,
      cancelledBookingsCount: totalCancelledBookings,
      totalTicketsSold,
      activeMoviesCount: data.movies.filter(m => m.status === 'now_showing').length,
      activeShowsCount: data.shows.length,
      totalTheatresCount: data.theatres.length,
      overallOccupancyRate,
      topMovies,
      theatreStats,
      recentBookings: data.bookings.slice(0, 10),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch admin stats' });
  }
});

// Reset database to initial seed data
router.post('/reset-data', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    db.initializeDefaultDatabase();
    res.json({ message: 'Database reset to default seed data successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reset database' });
  }
});

export default router;
