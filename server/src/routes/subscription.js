import express from 'express';
import Stripe from 'stripe';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { config } from '../config.js';

const router = express.Router();
const stripe = new Stripe(config.stripeSecretKey);

router.get('/status', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json({
    tier: user?.subscriptionTier,
    subscription
  });
});

router.post('/checkout', authenticate, async (req, res) => {
  const { tier } = req.body;
  if (!['standard', 'premium'].includes(tier)) {
    return res.status(400).json({ message: 'Invalid tier' });
  }
  const priceId = tier === 'standard' ? config.stripePriceStandard : config.stripePricePremium;
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: req.user.email,
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    metadata: {
      userId: req.user.id,
      tier
    },
    subscription_data: {
      metadata: {
        userId: req.user.id,
        tier
      }
    },
    success_url: `${config.frontendUrl}/subscribe/success?tier=${tier}`,
    cancel_url: `${config.frontendUrl}/subscribe`
  });
  res.json({ url: session.url });
});

export default router;
