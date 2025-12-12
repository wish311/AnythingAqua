import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscription.js';
import jellyfinRoutes from './routes/jellyfin.js';
import mediaRoutes from './routes/media.js';
import stripeWebhook from './routes/stripeWebhook.js';

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
// Stripe webhooks need the raw body, so mount before JSON parsing
app.use('/api/stripe', stripeWebhook);

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/jellyfin', jellyfinRoutes);
app.use('/api/media', mediaRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
