import { Router, Response } from 'express';
import { db, Show, generateDefaultSeats } from '../db.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET shows by movie, theatre, and date
router.get('/', (req, res: Response) => {
  try {
    const data = db.getData();
    let shows = [...data.shows];

    const { movieId, theatreId, date } = req.query;

    if (movieId && typeof movieId === 'string') {
      shows = shows.filter(s => s.movieId === movieId);
    }

    if (theatreId && typeof theatreId === 'string') {
      shows = shows.filter(s => s.theatreId === theatreId);
    }

    if (date && typeof date === 'string') {
      shows = shows.filter(s => s.date === date);
    }

    // Attach movie & theatre summary to each show for convenience
    const enrichedShows = shows.map(s => {
      const movie = data.movies.find(m => m.id === s.movieId);
      const theatre = data.theatres.find(t => t.id === s.theatreId);
      const bookedCount = s.seatLayout.filter(seat => seat.status === 'booked').length;
      const totalSeats = s.seatLayout.length;

      return {
        ...s,
        movieTitle: movie?.title || 'Unknown Movie',
        moviePoster: movie?.posterUrl || '',
        movieDuration: movie?.duration || 120,
        theatreName: theatre?.name || 'Unknown Theatre',
        theatreCity: theatre?.city || '',
        theatreAddress: theatre?.address || '',
        availableSeatsCount: totalSeats - bookedCount,
        totalSeatsCount: totalSeats,
      };
    });

    res.json({ shows: enrichedShows });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch shows' });
  }
});

// GET single show with real-time seat layout
router.get('/:id', (req, res: Response): void => {
  try {
    const data = db.getData();
    const show = data.shows.find(s => s.id === req.params.id);
    if (!show) {
      res.status(404).json({ error: 'Show not found' });
      return;
    }

    const movie = data.movies.find(m => m.id === show.movieId);
    const theatre = data.theatres.find(t => t.id === show.theatreId);

    res.json({
      show,
      movie,
      theatre,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch show' });
  }
});

// Real-time: Lock seats temporarily (5 minutes) while user is checking out
router.post('/:id/lock-seats', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { seats } = req.body; // Array of { row: string, number: number }
    if (!Array.isArray(seats) || seats.length === 0) {
      res.status(400).json({ error: 'Seats array is required' });
      return;
    }

    const data = db.getData();
    const show = data.shows.find(s => s.id === req.params.id);
    if (!show) {
      res.status(404).json({ error: 'Show not found' });
      return;
    }

    const userId = req.user?.id || 'anonymous';
    const lockUntil = Date.now() + 5 * 60 * 1000; // 5 mins hold

    // Check availability first
    for (const requested of seats) {
      const seat = show.seatLayout.find(s => s.row === requested.row && s.number === requested.number);
      if (!seat) {
        res.status(400).json({ error: `Seat ${requested.row}${requested.number} does not exist` });
        return;
      }
      if (seat.status === 'booked') {
        res.status(409).json({ error: `Seat ${requested.row}${requested.number} has already been reserved` });
        return;
      }
      if (seat.status === 'locked' && seat.lockedByUserId !== userId && seat.lockedUntil && seat.lockedUntil > Date.now()) {
        res.status(409).json({ error: `Seat ${requested.row}${requested.number} is currently on hold by another guest` });
        return;
      }
    }

    // Apply lock
    for (const requested of seats) {
      const seat = show.seatLayout.find(s => s.row === requested.row && s.number === requested.number);
      if (seat) {
        seat.status = 'locked';
        seat.lockedUntil = lockUntil;
        seat.lockedByUserId = userId;
      }
    }

    db.saveData(data);
    res.json({ message: 'Seats held successfully', lockedUntil: lockUntil, seatLayout: show.seatLayout });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to lock seats' });
  }
});

// Unlock seats
router.post('/:id/unlock-seats', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { seats } = req.body;
    const data = db.getData();
    const show = data.shows.find(s => s.id === req.params.id);
    if (!show) {
      res.status(404).json({ error: 'Show not found' });
      return;
    }

    const userId = req.user?.id;
    if (Array.isArray(seats)) {
      for (const requested of seats) {
        const seat = show.seatLayout.find(s => s.row === requested.row && s.number === requested.number);
        if (seat && seat.status === 'locked' && seat.lockedByUserId === userId) {
          seat.status = 'available';
          delete seat.lockedUntil;
          delete seat.lockedByUserId;
        }
      }
    }

    db.saveData(data);
    res.json({ message: 'Seats released', seatLayout: show.seatLayout });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to unlock seats' });
  }
});

// Admin: Add new show
router.post('/', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const { movieId, theatreId, screenId, date, startTime, basePrices } = req.body;
    if (!movieId || !theatreId || !screenId || !date || !startTime) {
      res.status(400).json({ error: 'Movie, theatre, screen, date, and startTime are required' });
      return;
    }

    const data = db.getData();
    const movie = data.movies.find(m => m.id === movieId);
    const theatre = data.theatres.find(t => t.id === theatreId);
    if (!movie || !theatre) {
      res.status(400).json({ error: 'Invalid movie or theatre ID' });
      return;
    }

    const screen = theatre.screens.find(sc => sc.id === screenId) || theatre.screens[0];
    const prices = basePrices || (
      screen.format === 'IMAX 3D' ? { VIP: 24, Premium: 19, Standard: 15 } :
      screen.format === '4DX' ? { VIP: 26, Premium: 21, Standard: 17 } :
      { VIP: 20, Premium: 16, Standard: 12 }
    );

    const newShow: Show = {
      id: `show_${Date.now()}`,
      movieId,
      theatreId,
      screenId: screen.id,
      screenName: screen.name,
      screenFormat: screen.format,
      date,
      startTime,
      endTime: '11:45 PM',
      basePrices: prices,
      seatLayout: generateDefaultSeats(prices),
    };

    data.shows.push(newShow);
    db.saveData(data);

    res.status(201).json({ message: 'Show scheduled successfully', show: newShow });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create show' });
  }
});

// Admin: Delete show
router.delete('/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const data = db.getData();
    const index = data.shows.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Show not found' });
      return;
    }

    data.shows.splice(index, 1);
    db.saveData(data);

    res.json({ message: 'Show deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete show' });
  }
});

export default router;
