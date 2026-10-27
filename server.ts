import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './server/routes/auth.js';
import moviesRoutes from './server/routes/movies.js';
import theatresRoutes from './server/routes/theatres.js';
import showsRoutes from './server/routes/shows.js';
import bookingsRoutes from './server/routes/bookings.js';
import adminRoutes from './server/routes/admin.js';
import miscRoutes from './server/routes/misc.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Body parser middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Basic API request logger
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      service: 'IMovies Cinema API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API routers
  app.use('/api/auth', authRoutes);
  app.use('/api/movies', moviesRoutes);
  app.use('/api/theatres', theatresRoutes);
  app.use('/api/shows', showsRoutes);
  app.use('/api/bookings', bookingsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', miscRoutes);

  // Vite development integration or static dist serving
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err?.message || 'Unknown error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 IMovies Cinema Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
