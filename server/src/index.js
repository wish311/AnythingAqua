import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscription.js';
import jellyfinRoutes from './routes/jellyfin.js';
import mediaRoutes from './routes/media.js';
import stripeWebhook from './routes/stripeWebhook.js';
import publicRoutes from './routes/public.js';
import { agentRouter } from './agent.js';

const app = express();

const corsOrigins = (config.frontendUrl || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use('/api/', apiLimiter);

app.use('/api/stripe', stripeWebhook);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/jellyfin', jellyfinRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/public', publicRoutes);
app.use('/api', agentRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
