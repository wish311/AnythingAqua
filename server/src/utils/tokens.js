import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function generateTokens(payload) {
  const accessToken = jwt.sign(payload, config.accessSecret, { expiresIn: config.accessExpiry });
  const refreshToken = jwt.sign(payload, config.refreshSecret, { expiresIn: config.refreshExpiry });
  return { accessToken, refreshToken };
}

export function setAuthCookies(res, tokens) {
  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: 15 * 60 * 1000
  });
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.cookieSecure,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearAuthCookies(res) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
}
