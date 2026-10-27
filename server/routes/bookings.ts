import { Router, Response } from 'express';
import { db, Booking, Notification } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET bookings for current user (or all bookings if admin)
router.get('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const data = db.getData();
    const user = req.user!;

    let bookings = [...data.bookings];
    if (user.role !== 'admin') {
      bookings = bookings.filter(b => b.userId === user.id);
    }

    // Sort descending by bookingDate
    bookings.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());

    res.json({ bookings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch bookings' });
  }
});

// GET booking by ID
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const data = db.getData();
    const user = req.user!;
    const booking = data.bookings.find(b => b.id === req.params.id);

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (user.role !== 'admin' && booking.userId !== user.id) {
      res.status(403).json({ error: 'Unauthorized to view this booking' });
      return;
    }

    res.json({ booking });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch booking' });
  }
});

// CREATE new booking
router.post('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const {
      showId,
      seats, // Array of { row: string, number: number, tier: string, price: number }
      concessions, // Array of { id: string, name: string, quantity: number, price: number }
      paymentMethod,
      promoCode,
    } = req.body;

    if (!showId || !Array.isArray(seats) || seats.length === 0) {
      res.status(400).json({ error: 'Show ID and at least one seat are required' });
      return;
    }

    const data = db.getData();
    const show = data.shows.find(s => s.id === showId);
    if (!show) {
      res.status(404).json({ error: 'Show not found' });
      return;
    }

    const movie = data.movies.find(m => m.id === show.movieId);
    const theatre = data.theatres.find(t => t.id === show.theatreId);

    // Validate that all seats are either available or locked by this user
    for (const seatReq of seats) {
      const seat = show.seatLayout.find(s => s.row === seatReq.row && s.number === seatReq.number);
      if (!seat) {
        res.status(400).json({ error: `Seat ${seatReq.row}${seatReq.number} does not exist in auditorium` });
        return;
      }
      if (seat.status === 'booked') {
        res.status(409).json({ error: `Seat ${seatReq.row}${seatReq.number} is already booked` });
        return;
      }
      if (seat.status === 'locked' && seat.lockedByUserId && seat.lockedByUserId !== user.id) {
        res.status(409).json({ error: `Seat ${seatReq.row}${seatReq.number} is on hold by another guest` });
        return;
      }
    }

    // Mark seats as booked
    for (const seatReq of seats) {
      const seat = show.seatLayout.find(s => s.row === seatReq.row && s.number === seatReq.number);
      if (seat) {
        seat.status = 'booked';
        delete seat.lockedUntil;
        delete seat.lockedByUserId;
      }
    }

    // Calculations
    const seatsTotal = seats.reduce((sum, s) => sum + (s.price || 0), 0);
    const concessionsTotal = (Array.isArray(concessions) ? concessions : []).reduce(
      (sum, c) => sum + (c.price * c.quantity || 0),
      0
    );
    const subtotal = seatsTotal + concessionsTotal;
    const convenienceFee = Number((seats.length * 1.75).toFixed(2));

    let discountAmount = 0;
    if (promoCode) {
      const code = String(promoCode).toUpperCase().trim();
      if (code === 'CINEMA20') {
        discountAmount = Number((subtotal * 0.2).toFixed(2));
      } else if (code === 'IMOVIES10') {
        discountAmount = Math.min(subtotal, 10.0);
      } else if (code === 'POPCORNFREE') {
        discountAmount = Math.min(concessionsTotal, 8.0);
      }
    }

    const totalAmount = Number(Math.max(0, subtotal + convenienceFee - discountAmount).toFixed(2));
    const bookingId = `IMV-${Math.floor(10000 + Math.random() * 90000)}`;
    const paymentId = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const seatLabels = seats.map(s => `${s.row}${s.number}`).join(', ');

    const newBooking: Booking = {
      id: bookingId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      showId: show.id,
      movieId: show.movieId,
      movieTitle: movie?.title || 'IMovies Feature',
      moviePoster: movie?.posterUrl || '',
      theatreId: show.theatreId,
      theatreName: theatre?.name || 'Grand Cinema',
      theatreAddress: theatre?.address || '',
      screenName: show.screenName,
      screenFormat: show.screenFormat,
      showDate: show.date,
      showTime: show.startTime,
      seats,
      concessions: Array.isArray(concessions) ? concessions : [],
      subtotal,
      convenienceFee,
      discountAmount,
      totalAmount,
      promoCode: promoCode || undefined,
      paymentMethod: paymentMethod || 'card',
      paymentId,
      status: 'confirmed',
      bookingDate: new Date().toISOString(),
      qrCodeData: `IMOVIES:TICKET:${bookingId}:${movie?.slug || 'MOV'}:${seatLabels}:VERIFIED`,
    };

    data.bookings.unshift(newBooking);

    // Create user notification
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      userId: user.id,
      title: 'Booking Confirmed!',
      message: `Your reservation for ${newBooking.movieTitle} (${seatLabels}) at ${newBooking.theatreName} is confirmed!`,
      type: 'booking',
      read: false,
      createdAt: new Date().toISOString(),
    };
    data.notifications.unshift(notification);

    db.saveData(data);

    res.status(201).json({
      message: 'Booking completed successfully',
      booking: newBooking,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Booking creation failed' });
  }
});

// CANCEL booking
router.post('/:id/cancel', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const data = db.getData();
    const booking = data.bookings.find(b => b.id === req.params.id);

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (user.role !== 'admin' && booking.userId !== user.id) {
      res.status(403).json({ error: 'Unauthorized to cancel this booking' });
      return;
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({ error: 'This booking has already been cancelled' });
      return;
    }

    // Release seats in the show
    const show = data.shows.find(s => s.id === booking.showId);
    if (show) {
      for (const bookedSeat of booking.seats) {
        const seat = show.seatLayout.find(s => s.row === bookedSeat.row && s.number === bookedSeat.number);
        if (seat) {
          seat.status = 'available';
          delete seat.lockedUntil;
          delete seat.lockedByUserId;
        }
      }
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date().toISOString();
    // 100% refund of tickets and concessions (convenience fee retained per cinema terms)
    booking.refundAmount = Number(Math.max(0, booking.totalAmount - booking.convenienceFee).toFixed(2));

    // Create cancellation notification
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      userId: booking.userId,
      title: 'Booking Cancelled & Refunded',
      message: `Booking #${booking.id} for ${booking.movieTitle} was cancelled. A refund of $${booking.refundAmount.toFixed(2)} has been initiated to your original payment method.`,
      type: 'cancellation',
      read: false,
      createdAt: new Date().toISOString(),
    };
    data.notifications.unshift(notification);

    db.saveData(data);

    res.json({
      message: 'Booking cancelled successfully and seats released',
      booking,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to cancel booking' });
  }
});

export default router;
