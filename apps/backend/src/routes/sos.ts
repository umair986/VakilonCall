import { Router } from 'express';
import { sosContactsSchema, sosFireSchema, SOS_CONFIG } from '@vakiloncall/shared';
import { validateBody } from '../middleware/validate';
import { authMiddleware, requireRegistered } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import type { Request, Response } from 'express';

export const sosRouter = Router();

// GET /api/v1/sos/contacts — Get user's emergency contacts
sosRouter.get(
  '/contacts',
  authMiddleware,
  requireRegistered,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const contacts = await prisma.emergencyContact.findMany({
        where: { user_id: req.user!.id },
        orderBy: { priority: 'asc' },
      });

      sendSuccess(
        res,
        contacts.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          relation: c.relation,
          priority: c.priority,
        }))
      );
    } catch (err) {
      logger.error({ err }, 'get sos contacts error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch emergency contacts');
    }
  }
);

// PUT /api/v1/sos/contacts — Set/replace emergency contacts (1-3)
sosRouter.put(
  '/contacts',
  authMiddleware,
  requireRegistered,
  validateBody(sosContactsSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { contacts } = req.body as {
        contacts: Array<{ name: string; phone: string; relation?: string }>;
      };

      // Delete existing and insert new in a transaction
      const result = await prisma.$transaction(async (tx) => {
        await tx.emergencyContact.deleteMany({
          where: { user_id: req.user!.id },
        });

        const created = await Promise.all(
          contacts.map((contact, index) =>
            tx.emergencyContact.create({
              data: {
                user_id: req.user!.id,
                name: contact.name,
                phone: contact.phone,
                relation: contact.relation ?? null,
                priority: (index + 1) as 1 | 2 | 3,
              },
            })
          )
        );

        return created;
      });

      sendSuccess(
        res,
        result.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          relation: c.relation,
          priority: c.priority,
        }))
      );
    } catch (err) {
      logger.error({ err }, 'set sos contacts error');
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to save emergency contacts');
    }
  }
);

// POST /api/v1/sos/fire — Fire SOS alert to all emergency contacts
sosRouter.post(
  '/fire',
  authMiddleware,
  requireRegistered,
  validateBody(sosFireSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { latitude, longitude, officer_name, officer_badge } = req.body as {
        latitude: number;
        longitude: number;
        officer_name?: string;
        officer_badge?: string;
      };

      // Get emergency contacts
      const contacts = await prisma.emergencyContact.findMany({
        where: { user_id: req.user!.id },
        orderBy: { priority: 'asc' },
      });

      if (contacts.length === 0) {
        sendError(res, 400, 'SOS_NO_CONTACTS', 'No emergency contacts set up. Please add contacts first.');
        return;
      }

      // Get user name for SMS
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { full_name: true, phone: true },
      });

      const userName = user?.full_name ?? user?.phone ?? 'Someone';
      const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      // Prepare SMS messages (Exotel SMS API will be wired in production)
      const contactResults = contacts.map((contact) => ({
        name: contact.name,
        phone: contact.phone,
        sms_status: 'pending' as const,
        message: SOS_CONFIG.SMS_TEMPLATE(userName, latitude, longitude, timestamp),
      }));

      // TODO: In production, send actual SMS via Exotel SMS API here
      // For now, mark all as 'sent' (simulated)
      const sentResults = contactResults.map((c) => ({
        ...c,
        sms_status: 'sent' as const,
      }));

      // Record the SOS alert
      const sosAlert = await prisma.sosAlert.create({
        data: {
          user_id: req.user!.id,
          latitude,
          longitude,
          contacts_notified: sentResults,
          officer_name,
          officer_badge,
        },
      });

      sendSuccess(res, {
        id: sosAlert.id,
        contacts_notified: sentResults.length,
        contacts: sentResults.map((c) => ({
          name: c.name,
          phone: c.phone.replace(/(\+91)(\d{4})(\d{4})(\d{2})/, '$1****$3**'),
          sms_status: c.sms_status,
        })),
        message: 'SOS alert sent to all emergency contacts.',
      }, 201);
    } catch (err) {
      logger.error({ err }, 'sos fire error');
      sendError(res, 500, 'SOS_SEND_FAILED', 'Failed to send SOS alert');
    }
  }
);
