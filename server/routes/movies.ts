import { Router, Response } from 'express';
import { db, Movie } from '../db.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET all movies with search & filters
router.get('/', (req, res: Response) => {
  try {
    const data = db.getData();
    let movies = [...data.movies];

    const { status, genre, language, search, theatreId } = req.query;

    if (status && typeof status === 'string' && status !== 'all') {
      movies = movies.filter(m => m.status === status);
    }

    if (genre && typeof genre === 'string' && genre !== 'all') {
      movies = movies.filter(m => m.genres.some(g => g.toLowerCase() === genre.toLowerCase()));
    }

    if (language && typeof language === 'string' && language !== 'all') {
      movies = movies.filter(m => m.languages.some(l => l.toLowerCase() === language.toLowerCase()));
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      movies = movies.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.director.toLowerCase().includes(q) ||
        m.cast.some(c => c.name.toLowerCase().includes(q)) ||
        m.genres.some(g => g.toLowerCase().includes(q))
      );
    }

    if (theatreId && typeof theatreId === 'string' && theatreId !== 'all') {
      // Find movies that have shows scheduled at this theatre
      const activeMovieIds = new Set(
        data.shows.filter(s => s.theatreId === theatreId).map(s => s.movieId)
      );
      movies = movies.filter(m => activeMovieIds.has(m.id));
    }

    res.json({ movies, total: movies.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch movies' });
  }
});

// GET suggested & recommended movies for dashboard
router.get('/suggested', (req, res: Response) => {
  try {
    const data = db.getData();
    const all = data.movies;

    const enriched = all.map(m => {
      let suggestedReason = 'Critically Acclaimed Experience';
      let matchScore = 90;

      if (m.rating >= 8.8) {
        suggestedReason = 'Masterpiece • 99% Critic Score';
        matchScore = 99;
      } else if (m.formats.includes('IMAX 3D')) {
        suggestedReason = 'IMAX Laser 4K Visual Spectacle';
        matchScore = 96;
      } else if (m.votesCount > 400000) {
        suggestedReason = 'Audience Favorite • Trending #1';
        matchScore = 95;
      } else if (m.genres.includes('Action') || m.genres.includes('Sci-Fi')) {
        suggestedReason = 'High Octane Cinematic Rush';
        matchScore = 92;
      }

      return {
        ...m,
        suggestedReason,
        matchScore,
      };
    });

    const topPicks = [...enriched].sort((a, b) => b.rating - a.rating).slice(0, 6);
    const trending = [...enriched].sort((a, b) => b.votesCount - a.votesCount).slice(0, 6);
    const imaxExperience = enriched.filter(m => m.formats.includes('IMAX 3D')).slice(0, 6);
    const recommendations = enriched.filter(m => m.featured || m.rating >= 8.4).slice(0, 8);

    res.json({
      suggested: recommendations,
      topPicks,
      trending,
      imaxExperience,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch suggested movies' });
  }
});

// GET movie by ID
router.get('/:id', (req, res: Response): void => {
  try {
    const data = db.getData();
    const movie = data.movies.find(m => m.id === req.params.id);
    if (!movie) {
      res.status(404).json({ error: 'Movie not found' });
      return;
    }

    // Include available show dates & theatres for this movie
    const shows = data.shows.filter(s => s.movieId === movie.id);
    const availableDates = Array.from(new Set(shows.map(s => s.date))).sort();
    const availableTheatreIds = Array.from(new Set(shows.map(s => s.theatreId)));
    const theatres = data.theatres.filter(t => availableTheatreIds.includes(t.id));

    res.json({ movie, availableDates, theatres, totalShowsCount: shows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch movie' });
  }
});

// Admin: Add new movie
router.post('/', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const {
      title,
      tagline,
      synopsis,
      posterUrl,
      backdropUrl,
      trailerUrl,
      duration,
      releaseDate,
      genres,
      languages,
      censorRating,
      rating,
      director,
      cast,
      formats,
      status,
      featured,
    } = req.body;

    if (!title || !duration || !genres || !posterUrl) {
      res.status(400).json({ error: 'Title, duration, genres, and posterUrl are required' });
      return;
    }

    const data = db.getData();
    const newMovie: Movie = {
      id: `m_${Date.now()}`,
      title: title.trim(),
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      tagline: tagline?.trim() || '',
      synopsis: synopsis?.trim() || '',
      posterUrl: posterUrl.trim(),
      backdropUrl: backdropUrl?.trim() || posterUrl.trim(),
      trailerUrl: trailerUrl?.trim() || 'https://www.youtube.com/embed/Way9Dexny3w',
      duration: Number(duration) || 120,
      releaseDate: releaseDate || new Date().toISOString().split('T')[0],
      genres: Array.isArray(genres) ? genres : [genres],
      languages: Array.isArray(languages) ? languages : ['English'],
      censorRating: censorRating || 'PG-13',
      rating: Number(rating) || 8.0,
      votesCount: 1,
      director: director?.trim() || 'Director',
      cast: Array.isArray(cast) ? cast : [{ name: 'Lead Actor', role: 'Protagonist' }],
      formats: Array.isArray(formats) ? formats : ['2D', 'Dolby Atmos'],
      status: status || 'now_showing',
      featured: Boolean(featured),
    };

    data.movies.unshift(newMovie);
    db.saveData(data);

    res.status(201).json({ message: 'Movie added successfully', movie: newMovie });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add movie' });
  }
});

// Admin: Update movie
router.put('/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const data = db.getData();
    const index = data.movies.findIndex(m => m.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Movie not found' });
      return;
    }

    const existing = data.movies[index];
    const updated: Movie = {
      ...existing,
      ...req.body,
      id: existing.id, // prevent ID change
    };

    data.movies[index] = updated;
    db.saveData(data);

    res.json({ message: 'Movie updated successfully', movie: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update movie' });
  }
});

// Admin: Delete movie
router.delete('/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response): void => {
  try {
    const data = db.getData();
    const index = data.movies.findIndex(m => m.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Movie not found' });
      return;
    }

    const deleted = data.movies.splice(index, 1)[0];
    // Also remove associated shows
    data.shows = data.shows.filter(s => s.movieId !== deleted.id);
    db.saveData(data);

    res.json({ message: 'Movie and associated shows deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete movie' });
  }
});

export default router;
