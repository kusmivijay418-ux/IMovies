import { Router, Response } from 'express';
import { db, Theatre } from '../db.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all theatres
router.get('/', (req, res: Response) => {
  try {
    const data = db.getData();
    res.json({ theatres: data.theatres });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch theatres' });
  }
});

// Admin: Add theatre
router.post('/', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const { name, city, address, screens, amenities } = req.body;
    if (!name || !city || !address) {
      res.status(400).json({ error: 'Name, city, and address are required' });
      return;
    }

    const data = db.getData();
    const newTheatre: Theatre = {
      id: `th_${Date.now()}`,
      name: name.trim(),
      city: city.trim(),
      address: address.trim(),
      amenities: Array.isArray(amenities) ? amenities : ['Dolby Atmos', 'Recliner Seating'],
      screens: Array.isArray(screens) && screens.length > 0 ? screens : [
        { id: `sc_${Date.now()}_1`, name: 'Auditorium 1', format: 'Dolby Atmos', totalSeats: 96, rows: 8, cols: 12 },
      ],
    };

    data.theatres.push(newTheatre);
    db.saveData(data);

    res.status(201).json({ message: 'Theatre added successfully', theatre: newTheatre });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add theatre' });
  }
});

// Admin: Update theatre
router.put('/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const data = db.getData();
    const index = data.theatres.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Theatre not found' });
      return;
    }

    const existing = data.theatres[index];
    const updated: Theatre = {
      ...existing,
      ...req.body,
      id: existing.id,
    };

    data.theatres[index] = updated;
    db.saveData(data);

    res.json({ message: 'Theatre updated successfully', theatre: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update theatre' });
  }
});

export default router;
