import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { authenticateJellyfinUser, createJellyfinUser, setUserPolicy } from '../services/jellyfinService.js';

const router = express.Router();

const rules = [
  body('username').isLength({ min: 3 }).trim(),
  body('password').isLength({ min: 8 })
];

router.post('/provision', authenticate, rules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Invalid Jellyfin credentials' });
  }
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user?.subscriptionTier) {
    return res.status(403).json({ message: 'Active subscription required' });
  }
  let jellyfinUserId = user.jellyfinUserId;
  if (!jellyfinUserId) {
    const created = await createJellyfinUser(username, password);
    jellyfinUserId = created.Id;
  }
  await setUserPolicy(jellyfinUserId, user.subscriptionTier);
  const auth = await authenticateJellyfinUser(username, password);
  const accessToken = auth.AccessToken;
  await prisma.user.update({
    where: { id: user.id },
    data: { jellyfinUserId, jellyfinAccessToken: accessToken }
  });
  res.json({ message: 'Jellyfin user provisioned', jellyfinUserId });
});

export default router;
