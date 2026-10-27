import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all concessions
router.get('/concessions', (req, res: Response) => {
  try {
    const data = db.getData();
    res.json({ concessions: data.concessions });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch concessions' });
  }
});

// Validate promo code
router.post('/promos/validate', (req, res: Response): void => {
  try {
    const { code, subtotal, concessionsTotal } = req.body;
    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Promo code is required' });
      return;
    }

    const cleanCode = code.trim().toUpperCase();

    if (cleanCode === 'CINEMA20') {
      const discount = Number(((subtotal || 30) * 0.2).toFixed(2));
      res.json({
        valid: true,
        code: cleanCode,
        description: '20% Cinema Special Discount',
        discountAmount: discount,
      });
      return;
    }

    if (cleanCode === 'IMOVIES10') {
      const discount = Math.min(subtotal || 20, 10.0);
      res.json({
        valid: true,
        code: cleanCode,
        description: '$10 Instant Discount',
        discountAmount: discount,
      });
      return;
    }

    if (cleanCode === 'POPCORNFREE') {
      const discount = Math.min(concessionsTotal || 8.0, 8.0);
      res.json({
        valid: true,
        code: cleanCode,
        description: 'Free Popcorn Voucher ($8 value)',
        discountAmount: discount,
      });
      return;
    }

    res.status(400).json({
      valid: false,
      error: 'Invalid or expired promo code. Try "CINEMA20" or "IMOVIES10"',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Promo validation failed' });
  }
});

// GET notifications for current user
router.get('/notifications', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const data = db.getData();
    const userNotifications = data.notifications.filter(n => n.userId === user.id);
    res.json({ notifications: userNotifications });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    const data = db.getData();
    const notif = data.notifications.find(n => n.id === req.params.id && n.userId === user.id);
    if (!notif) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    notif.read = true;
    db.saveData(data);
    res.json({ message: 'Notification marked as read', notification: notif });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update notification' });
  }
});

export default router;
