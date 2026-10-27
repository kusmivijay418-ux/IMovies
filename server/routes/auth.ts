import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, User } from '../db.js';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Register new user
router.post('/register', async (req, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    const data = db.getData();
    const existing = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'user', // default role is user
      phone: phone?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    data.users.push(newUser);
    db.saveData(data);

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const data = db.getData();
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
    },
  });
});

export default router;
