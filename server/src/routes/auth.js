import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { generateTokens, setAuthCookies, clearAuthCookies } from '../utils/tokens.js';
import { verifyRefreshToken, authRateLimiter } from '../middleware/auth.js';

const router = express.Router();

function validateEmail(email) {
  return /.+@.+\..+/.test(email);
}

router.post('/signup', authRateLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || !validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'User already exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  const tokens = generateTokens({ id: user.id, email: user.email });
  setAuthCookies(res, tokens);
  res.json({ user: { id: user.id, email: user.email } });
});

router.post('/login', authRateLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });
  const tokens = generateTokens({ id: user.id, email: user.email });
  setAuthCookies(res, tokens);
  res.json({ user: { id: user.id, email: user.email, subscriptionTier: user.subscriptionTier } });
});

router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'Missing refresh token' });
    const payload = verifyRefreshToken(token);
    const tokens = generateTokens({ id: payload.id, email: payload.email });
    setAuthCookies(res, tokens);
    res.json({ message: 'Refreshed' });
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookies(res);
  res.json({ message: 'Logged out' });
});

export default router;
