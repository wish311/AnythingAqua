import express from 'express';
import { prisma } from './prisma.js';
import { checkJellyfinHealth } from './services/jellyfinService.js';
import { authenticate } from './middleware/auth.js';

const router = express.Router();

let lastStatus = { db: null, jellyfin: null, timestamp: null };

async function runHealthCheck() {
  const results = { timestamp: new Date().toISOString() };
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.db = 'ok';
  } catch (err) {
    results.db = 'error';
  }
  try {
    const jellyfinOk = await checkJellyfinHealth();
    results.jellyfin = jellyfinOk ? 'ok' : 'error';
  } catch (err) {
    results.jellyfin = 'error';
  }
  lastStatus = results;
  return results;
}

setInterval(() => {
  runHealthCheck().catch(() => {});
}, 5 * 60 * 1000);

router.get('/health', async (_req, res) => {
  const status = lastStatus.timestamp ? lastStatus : await runHealthCheck();
  res.json(status);
});

router.get('/agent/status', authenticate, async (_req, res) => {
  const status = lastStatus.timestamp ? lastStatus : await runHealthCheck();
  res.json(status);
});

export { router as agentRouter, runHealthCheck };
