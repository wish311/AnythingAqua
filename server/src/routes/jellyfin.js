import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { authenticateJellyfinUser, createJellyfinUser, setUserPolicy } from '../services/jellyfinService.js';

const router = express.Router();

router.post('/provision', authenticate, async (req, res) => {
  const { username, password, tier } = req.body;
  if (!username || !password || !['standard', 'premium'].includes(tier)) {
    return res.status(400).json({ message: 'Missing Jellyfin credentials or tier' });
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user?.subscriptionTier) {
    return res.status(403).json({ message: 'Active subscription required' });
  }
  let jellyfinUserId = user.jellyfinUserId;
  if (!jellyfinUserId) {
    const created = await createJellyfinUser(username, password);
    jellyfinUserId = created.Id;
  }
  await setUserPolicy(jellyfinUserId, tier || user.subscriptionTier);
  const auth = await authenticateJellyfinUser(username, password);
  const accessToken = auth.AccessToken;
  await prisma.user.update({
    where: { id: user.id },
    data: { jellyfinUserId, jellyfinAccessToken: accessToken, subscriptionTier: tier }
  });
  res.json({ message: 'Jellyfin user provisioned', jellyfinUserId });
});

export default router;
