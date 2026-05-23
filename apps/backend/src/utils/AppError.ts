import type { ErrorCode } from '@vakiloncall/shared';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  // Convenience factory methods for common errors
  static badRequest(code: ErrorCode, message: string): AppError {
    return new AppError(400, code, message);
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(401, 'AUTH_UNAUTHORIZED', message);
  }

  static forbidden(message = 'Access denied'): AppError {
    return new AppError(403, 'AUTH_UNAUTHORIZED', message);
  }

  static notFound(code: ErrorCode, message: string): AppError {
    return new AppError(404, code, message);
  }

  static conflict(code: ErrorCode, message: string): AppError {
    return new AppError(409, code, message);
  }

  static tooManyRequests(message = 'Too many requests'): AppError {
    return new AppError(429, 'RATE_LIMIT_EXCEEDED', message);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(500, 'INTERNAL_ERROR', message, false);
  }
}
