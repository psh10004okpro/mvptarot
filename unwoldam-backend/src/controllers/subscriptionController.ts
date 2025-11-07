import { Request, Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
import * as subscriptionService from '../services/subscriptionService';
import { sendSuccess, sendError } from '../utils/response';
import { validate, subscribeSchema } from '../utils/validation';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants';

export const getPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const plans = subscriptionService.getSubscriptionPlans();

    return sendSuccess(res, plans, '구독 플랜 목록 조회 완료');
  } catch (err) {
    next(err);
  }
};

export const subscribe = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    if (!req.user) {
      return sendError(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    // Validate request body
    const { error, value } = validate(subscribeSchema, req.body);

    if (error) {
      return sendError(res, error, HTTP_STATUS.BAD_REQUEST);
    }

    const result = await subscriptionService.subscribe(req.user.userId, value!);

    return sendSuccess(
      res,
      result,
      '구독이 시작되었습니다.',
      HTTP_STATUS.CREATED
    );
  } catch (err) {
    next(err);
  }
};

export const getStatus = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    if (!req.user) {
      return sendError(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const status = await subscriptionService.getSubscriptionStatus(req.user.userId);

    return sendSuccess(res, status, '구독 상태 조회 완료');
  } catch (err) {
    next(err);
  }
};

export const cancelSubscription = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    if (!req.user) {
      return sendError(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const { reason } = req.body;

    const result = await subscriptionService.cancelSubscription(
      req.user.userId,
      reason
    );

    return sendSuccess(res, result, '구독이 취소되었습니다.');
  } catch (err) {
    next(err);
  }
};

export const getHistory = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    if (!req.user) {
      return sendError(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }

    const history = await subscriptionService.getSubscriptionHistory(req.user.userId);

    return sendSuccess(res, history, '구독 히스토리 조회 완료');
  } catch (err) {
    next(err);
  }
};
