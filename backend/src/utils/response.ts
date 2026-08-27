import { Response } from 'express';
import { StandardResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message: string = 'Success',
  statusCode: number = 200,
  meta?: StandardResponse['meta']
): Response => {
  const response: StandardResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string = 'Error',
  statusCode: number = 500,
  errors?: Array<{ field: string; message: string }>
): Response => {
  const response: StandardResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = 'Success'
): Response => {
  return sendSuccess(res, data, message, 200, {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit),
  });
};
