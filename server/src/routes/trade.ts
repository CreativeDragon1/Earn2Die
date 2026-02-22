import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const CURRENCIES = ['diamonds', 'iron', 'gold', 'emeralds', 'other'] as const;

const createListingSchema = z.object({
  itemName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['weapons', 'armor', 'tools', 'blocks', 'food', 'potions', 'enchants', 'misc']).optional(),
  quantity: z.number().int().positive().optional(),
  townId: z.string().optional(),
  // Currency trade
  isBarter: z.boolean().optional().default(false),
  price: z.number().min(0).optional().default(0),
  preferredCurrency: z.enum(CURRENCIES).optional().default('diamonds'),
  // Resource-for-resource barter
  barterItemName: z.string().max(100).optional(),
  barterQuantity: z.number().int().positive().optional(),
}).refine(data => {
  if (data.isBarter) return !!data.barterItemName && !!data.barterQuantity;
  return data.price > 0;
}, { message: 'Currency trades require a positive price; barter trades require barterItemName and barterQuantity' });

// GET /api/trade - List marketplace items
router.get('/', async (req, res: Response) => {
  try {
    const category = req.query.category as string | undefined as string | undefined;
    const search = req.query.search as string | undefined as string | undefined;
    const minPrice = req.query.minPrice as string | undefined as string | undefined;
    const maxPrice = req.query.maxPrice as string | undefined as string | undefined;
    const where: any = { status: 'active' };

    if (category) where.category = category;
    if (search) where.itemName = { contains: search as string };
    if (minPrice) where.price = { ...where.price, gte: Number(minPrice) };
    if (maxPrice) where.price = { ...where.price, lte: Number(maxPrice) };

    const listings = await prisma.tradeListing.findMany({
      where,
      include: {
        seller: { select: { id: true, username: true } },
        town: { select: { id: true, name: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(listings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trade/:id
router.get('/:id', async (req, res: Response) => {
  try {
    const listing = await prisma.tradeListing.findUnique({
      where: { id: (req.params as Record<string, string>).id },
      include: {
        seller: { select: { id: true, username: true, reputation: true } },
        town: { select: { id: true, name: true } },
        transactions: {
          include: { buyer: { select: { id: true, username: true } } },
          orderBy: { completedAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }
    res.json(listing);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trade - Create listing
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const data = createListingSchema.parse(req.body);

    const listing = await prisma.tradeListing.create({
      data: {
        ...data,
        sellerId: req.player!.id,
      },
      include: {
        seller: { select: { id: true, username: true } },
      },
    });
    res.status(201).json(listing);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trade/:id/buy - Purchase item (currency trade only; barter trades are arranged in-game)
router.post('/:id/buy', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const quantity = z.object({ quantity: z.number().int().positive() }).parse(req.body).quantity;

    const listing = await prisma.tradeListing.findUnique({ where: { id: (req.params as Record<string, string>).id } });
    if (!listing || listing.status !== 'active') {
      res.status(404).json({ error: 'Listing not found or no longer active' });
      return;
    }
    if (listing.isBarter) {
      res.status(400).json({
        error: 'This is a barter listing. Arrange the exchange in-game then record the transaction with the seller.',
      });
      return;
    }
    if (listing.sellerId === req.player!.id) {
      res.status(400).json({ error: 'Cannot buy your own listing' });
      return;
    }
    if (quantity > listing.quantity) {
      res.status(400).json({ error: 'Not enough quantity available' });
      return;
    }

    const totalPrice = listing.price * quantity;
    const buyer = await prisma.player.findUnique({ where: { id: req.player!.id } });
    if (!buyer || buyer.balance < totalPrice) {
      res.status(400).json({ error: `Insufficient balance. Need ${totalPrice} ${listing.preferredCurrency}, have ${buyer?.balance ?? 0}` });
      return;
    }

    const [transaction] = await prisma.$transaction([
      prisma.tradeTransaction.create({
        data: {
          listingId: listing.id,
          buyerId: req.player!.id,
          sellerId: listing.sellerId,
          quantity,
          totalPrice,
        },
      }),
      prisma.player.update({ where: { id: req.player!.id }, data: { balance: { decrement: totalPrice } } }),
      prisma.player.update({ where: { id: listing.sellerId }, data: { balance: { increment: totalPrice } } }),
      prisma.tradeListing.update({
        where: { id: listing.id },
        data: {
          quantity: { decrement: quantity },
          ...(quantity >= listing.quantity ? { status: 'sold' } : {}),
        },
      }),
    ]);

    res.status(201).json(transaction);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/trade/:id - Cancel listing
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const listing = await prisma.tradeListing.findUnique({ where: { id: (req.params as Record<string, string>).id } });
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }
    if (listing.sellerId !== req.player!.id && req.player!.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await prisma.tradeListing.update({
      where: { id: (req.params as Record<string, string>).id },
      data: { status: 'cancelled' },
    });
    res.json({ message: 'Listing cancelled' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { router as tradeRouter };
