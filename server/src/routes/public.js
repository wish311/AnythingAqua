import express from 'express';
import rateLimit from 'express-rate-limit';
import { fetchPublicMediaStats } from '../services/jellyfinService.js';

const router = express.Router();

const publicLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

router.get('/media-stats', publicLimiter, async (_req, res) => {
  try {
    const stats = await fetchPublicMediaStats();
    res.json({
      movies: stats.movies,
      tvShows: stats.series,
      episodes: stats.episodes
    });
  } catch (err) {
    res.status(503).json({ message: 'Media stats unavailable' });
  }
});

export default router;
