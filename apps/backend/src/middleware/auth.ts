import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../utils/supabase';
import { prisma } from '../utils/prisma';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';
import type { IUser } from '@vakiloncall/shared';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Authenticates requests using Supabase JWT from Authorization header
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      sendError(res, 401, 'AUTH_UNAUTHORIZED', 'Missing or invalid authorization header');
      return;
    }

    const token = authHeader.substring(7);

    // Verify the JWT with Supabase
    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !supabaseUser) {
      sendError(res, 401, 'AUTH_UNAUTHORIZED', 'Invalid or expired token');
      return;
    }

    // Get the user from our database
    const dbUser = await prisma.user.findUnique({
      where: { phone: supabaseUser.phone ?? '' },
    });

    if (!dbUser) {
      // User exists in Supabase Auth but not in our DB yet (first login, role not set)
      // Attach minimal info so set-role endpoint can create the user
      req.user = {
        id: '',
        phone: supabaseUser.phone ?? '',
        full_name: null,
        role: 'user',
        language_pref: 'en',
        token_balance: 0,
        is_active: true,
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      next();
      return;
    }

    if (dbUser.is_banned) {
      sendError(res, 403, 'USER_BANNED', 'Your account has been suspended');
      return;
    }

    if (!dbUser.is_active) {
      sendError(res, 403, 'USER_BANNED', 'Your account is deactivated');
      return;
    }

    req.user = {
      id: dbUser.id,
      phone: dbUser.phone,
      full_name: dbUser.full_name,
      role: dbUser.role as IUser['role'],
      language_pref: dbUser.language_pref as IUser['language_pref'],
      token_balance: dbUser.token_balance,
      is_active: dbUser.is_active,
      is_banned: dbUser.is_banned,
      created_at: dbUser.created_at.toISOString(),
      updated_at: dbUser.updated_at.toISOString(),
    };

    next();
  } catch (err) {
    logger.error({ err }, 'Auth middleware error');
    sendError(res, 500, 'INTERNAL_ERROR', 'Authentication failed');
  }
}

// Ensures the authenticated user has the 'lawyer' role
export function requireLawyer(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'lawyer') {
    sendError(res, 403, 'AUTH_UNAUTHORIZED', 'Lawyer access required');
    return;
  }
  next();
}

// Ensures the authenticated user has been identified (has a DB record with an id)
export function requireRegistered(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.id) {
    sendError(res, 403, 'AUTH_UNAUTHORIZED', 'Please complete registration first');
    return;
  }
  next();
}
