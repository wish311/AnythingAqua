import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { fetchLibraryItems } from '../services/jellyfinService.js';

const router = express.Router();

router.get('/libraries', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user?.jellyfinAccessToken) {
    return res.status(400).json({ message: 'Jellyfin not provisioned' });
  }
  const data = await fetchLibraryItems(user.jellyfinAccessToken);
  res.json(data);
});

router.get('/items', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user?.jellyfinAccessToken) {
    return res.status(400).json({ message: 'Jellyfin not provisioned' });
  }
  const { parentId } = req.query;
  const data = await fetchLibraryItems(user.jellyfinAccessToken, parentId);
  res.json(data);
});

export default router;
