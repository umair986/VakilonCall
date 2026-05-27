import { Router } from 'express';
import { createTokenOrderSchema, verifyPaymentSchema } from '@vakiloncall/shared';
import { validateBody } from '../middleware/validate';
import { authMiddleware, requireRegistered } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import type { Request, Response } from 'express';

export const tokenRouter = Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID ?? '',
  key_secret: process.env.RAZORPAY_KEY_SECRET ?? '',
});

// GET /api/v1/tokens/packs
tokenRouter.get('/packs', async (_req: Request, res: Response): Promise<void> => {
  try {
    const packs = await prisma.tokenPack.findMany({
      where: { is_active: true },
      orderBy: { tokens: 'asc' },
    });

    sendSuccess(
      res,
      packs.map((p: typeof packs[number]) => ({
        id: p.id,
        name: p.name,
        tokens: p.tokens,
        price_inr: Number(p.price_inr),
      }))
    );
  } catch (err) {
    logger.error({ err }, 'fetch token packs error');
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch token packs');
  }
});

// POST /api/v1/tokens/create-order
tokenRouter.post(
  '/create-order',
  authMiddleware,
  requireRegistered,
  validateBody(createTokenOrderSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { pack_id } = req.body as { pack_id: string };

      const pack = await prisma.tokenPack.findUnique({
        where: { id: pack_id, is_active: true },
      });

      if (!pack) {
        sendError(res, 404, 'TOKEN_PACK_NOT_FOUND', 'Token pack not found or no longer available');
        return;
      }

      // Create Razorpay order (amount in paise)
      const order = await razorpay.orders.create({
        amount: Number(pack.price_inr) * 100,
        currency: 'INR',
        receipt: `voc_${req.user!.id}_${Date.now()}`,
        notes: {
          user_id: req.user!.id,
          pack_id: pack.id,
          tokens: pack.tokens.toString(),
        },
      });

      sendSuccess(res, {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        pack_name: pack.name,
        tokens: pack.tokens,
        razorpay_key_id: process.env.RAZORPAY_KEY_ID,
      });
    } catch (err) {
      logger.error({ err }, 'create order error');
      sendError(res, 500, 'PAYMENT_FAILED', 'Failed to create payment order');
    }
  }
);

// POST /api/v1/tokens/verify-payment
tokenRouter.post(
  '/verify-payment',
  authMiddleware,
  requireRegistered,
  validateBody(verifyPaymentSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      };

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET ?? '')
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        sendError(res, 400, 'PAYMENT_SIGNATURE_INVALID', 'Payment verification failed');
        return;
      }

      // Fetch order details from Razorpay to get token count
      const order = await razorpay.orders.fetch(razorpay_order_id);
      const packId = (order.notes as Record<string, string>)?.pack_id;
      const tokensStr = (order.notes as Record<string, string>)?.tokens;

      if (!packId || !tokensStr) {
        sendError(res, 400, 'PAYMENT_FAILED', 'Invalid order metadata');
        return;
      }

      const tokensToAdd = parseInt(tokensStr, 10);

      // Atomic: credit tokens + record transaction in a single DB transaction
      const result = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: req.user!.id },
          data: { token_balance: { increment: tokensToAdd } },
        });

        const transaction = await tx.tokenTransaction.create({
          data: {
            user_id: req.user!.id,
            type: 'purchase',
            tokens: tokensToAdd,
            razorpay_order_id,
            razorpay_payment_id,
            token_pack_id: packId,
            metadata: { verified_at: new Date().toISOString() },
          },
        });

        return { updatedUser, transaction };
      });

      sendSuccess(res, {
        token_balance: result.updatedUser.token_balance,
        tokens_added: tokensToAdd,
        transaction_id: result.transaction.id,
      });
    } catch (err) {
      logger.error({ err }, 'verify payment error');
      sendError(res, 500, 'PAYMENT_FAILED', 'Payment verification failed');
    }
  }
);
