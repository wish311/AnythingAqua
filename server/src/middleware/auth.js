import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

export function authenticate(req, res, next) {
  try {
    const bearer = req.headers.authorization;
    const token = bearer?.startsWith('Bearer ')
      ? bearer.replace('Bearer ', '')
      : req.cookies?.accessToken;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const payload = jwt.verify(token, config.accessSecret);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, config.refreshSecret);
}
