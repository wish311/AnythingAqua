import { prisma } from '../prisma.js';

export function requireSubscription(tier) {
  return async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.subscriptionTier) {
      return res.status(403).json({ message: 'Active subscription required' });
    }
    if (tier && user.subscriptionTier !== tier) {
      return res.status(403).json({ message: 'Insufficient subscription tier' });
    }
    next();
  };
}
