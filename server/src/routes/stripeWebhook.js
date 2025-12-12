import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import { disableUser, setUserPolicy } from '../services/jellyfinService.js';

const router = express.Router();
const stripe = new Stripe(config.stripeSecretKey);

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const data = event.data.object;
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const metadata = data.metadata || {};
    const userId = parseInt(metadata.userId);
    const tier = metadata.tier;
    if (!userId || !tier) {
      return res.json({ received: true });
    }
    const status = data.status;
    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: data.id },
      update: {
        status,
        tier,
        currentPeriodEnd: new Date(data.current_period_end * 1000)
      },
      create: {
        stripeSubscriptionId: data.id,
        userId,
        tier,
        status,
        currentPeriodEnd: new Date(data.current_period_end * 1000)
      }
    });
    await prisma.user.update({ where: { id: userId }, data: { subscriptionTier: tier } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.jellyfinUserId) {
      await setUserPolicy(user.jellyfinUserId, tier);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const metadata = data.metadata || {};
    const userId = parseInt(metadata.userId);
    if (userId) {
      await prisma.user.update({ where: { id: userId }, data: { subscriptionTier: null } });
      await prisma.subscription.updateMany({ where: { stripeSubscriptionId: data.id }, data: { status: 'canceled' } });
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.jellyfinUserId) {
        await disableUser(user.jellyfinUserId);
      }
    }
  }

  res.json({ received: true });
});

export default router;
