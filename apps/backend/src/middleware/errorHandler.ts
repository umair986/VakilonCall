import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message);
    if (!err.isOperational) {
      logger.error({ err }, 'Non-operational AppError');
    }
    return;
  }

  // Unexpected errors — log full stack, return generic message
  logger.error({ err, stack: err.stack }, 'Unhandled error');
  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}
