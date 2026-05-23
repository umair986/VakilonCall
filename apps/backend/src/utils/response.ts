import type { Response } from 'express';
import type { IApiSuccessResponse, IApiErrorResponse, IApiPaginationMeta } from '@vakiloncall/shared';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: IApiPaginationMeta
): void {
  const response: IApiSuccessResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string
): void {
  const response: IApiErrorResponse = {
    success: false,
    error: {
      code: code as IApiErrorResponse['error']['code'],
      message,
    },
  };
  res.status(statusCode).json(response);
}
