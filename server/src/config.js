import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripePriceStandard: process.env.STRIPE_STANDARD_PRICE_ID,
  stripePricePremium: process.env.STRIPE_PREMIUM_PRICE_ID,
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4000',
  jellyfinBaseUrl: process.env.JELLYFIN_BASE_URL,
  jellyfinApiToken: process.env.JELLYFIN_API_TOKEN,
  cookieSecure: process.env.COOKIE_SECURE === 'true'
};
