import { Request, Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
import * as tarotService from '../services/tarotService';
import { sendSuccess, sendError, sendPaginatedResponse } from '../utils/response';
import { validate, createReadingSchema, paginationSchema } from '../utils/validation';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants';

export const getDailyFortune = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    if (!req.user) {
      return sendError(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const reading = await tarotService.getDailyFortune(req.user.userId);

    return sendSuccess(res, reading, '오늘의 운세입니다.');
  } catch (err) {
    next(err);
  }
};

export const createReading = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    if (!req.user) {
      return sendError(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    // Validate request body
    const { error, value } = validate(createReadingSchema, req.body);

    if (error) {
      return sendError(res, error, HTTP_STATUS.BAD_REQUEST);
    }

    const reading = await tarotService.createReading(req.user.userId, value!);

    return sendSuccess(
      res,
      reading,
      '타로 리딩이 완료되었습니다.',
      HTTP_STATUS.CREATED
    );
  } catch (err) {
    next(err);
  }
};

export const getReadingHistory = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    if (!req.user) {
      return sendError(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { error, value } = validate(paginationSchema, req.query);

    if (error) {
      return sendError(res, error, HTTP_STATUS.BAD_REQUEST);
    }

    const { page = 1, limit = 10 } = value!;

    const result = await tarotService.getReadingHistory(
      req.user.userId,
      limit,
      page
    );

    return sendPaginatedResponse(
      res,
      result.readings,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      '리딩 히스토리 조회 완료'
    );
  } catch (err) {
    next(err);
  }
};

export const getReadingById = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    if (!req.user) {
      return sendError(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { id } = req.params;

    const reading = await tarotService.getReadingById(id, req.user.userId);

    return sendSuccess(res, reading);
  } catch (err) {
    next(err);
  }
};
