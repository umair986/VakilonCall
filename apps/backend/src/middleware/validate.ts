import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { sendError } from '../utils/response';

// Validates request body against a Zod schema
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      sendError(
        _res,
        400,
        'VALIDATION_ERROR',
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

// Validates query parameters against a Zod schema
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      sendError(
        _res,
        400,
        'VALIDATION_ERROR',
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
      );
      return;
    }
    req.query = result.data;
    next();
  };
}

// Validates route params against a Zod schema
export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      sendError(
        _res,
        400,
        'VALIDATION_ERROR',
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
      );
      return;
    }
    req.params = result.data;
    next();
  };
}
