import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
import { User } from '../models';
import { sendError } from '../utils/response';
import { HTTP_STATUS, ERROR_MESSAGES, DAILY_READING_LIMITS, MEMBERSHIP_TYPES } from '../config/constants';

export const checkReadingLimit = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    if (!req.user) {
      return sendError(
        res,
        ERROR_MESSAGES.UNAUTHORIZED,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return sendError(
        res,
        ERROR_MESSAGES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Check if daily count needs reset (KST 기준)
    const now = new Date();
    const lastReset = new Date(user.lastReadingReset);
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const kstLastReset = new Date(lastReset.getTime() + (9 * 60 * 60 * 1000));

    if (
      kstNow.getDate() !== kstLastReset.getDate() ||
      kstNow.getMonth() !== kstLastReset.getMonth() ||
      kstNow.getFullYear() !== kstLastReset.getFullYear()
    ) {
      await user.resetDailyCount();
    }

    // Get user's daily limit based on membership
    const dailyLimit = DAILY_READING_LIMITS[user.membershipType as keyof typeof DAILY_READING_LIMITS];

    // Check if user has reached daily limit
    if (user.dailyReadingCount >= dailyLimit) {
      return sendError(
        res,
        ERROR_MESSAGES.DAILY_LIMIT_REACHED,
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  } catch (error) {
    return sendError(
      res,
      ERROR_MESSAGES.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

export const requireSubscription = (requiredPlan: 'basic' | 'premium') => {
  return async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void | Response> => {
    try {
      if (!req.user) {
        return sendError(
          res,
          ERROR_MESSAGES.UNAUTHORIZED,
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      const user = await User.findById(req.user.userId);

      if (!user) {
        return sendError(
          res,
          ERROR_MESSAGES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      // Check if user has required subscription level
      if (requiredPlan === 'premium' && user.membershipType !== MEMBERSHIP_TYPES.PREMIUM) {
        return sendError(
          res,
          '이 기능은 프리미엄 구독이 필요합니다.',
          HTTP_STATUS.FORBIDDEN
        );
      }

      if (
        requiredPlan === 'basic' &&
        user.membershipType !== MEMBERSHIP_TYPES.BASIC &&
        user.membershipType !== MEMBERSHIP_TYPES.PREMIUM
      ) {
        return sendError(
          res,
          ERROR_MESSAGES.SUBSCRIPTION_REQUIRED,
          HTTP_STATUS.FORBIDDEN
        );
      }

      next();
    } catch (error) {
      return sendError(
        res,
        ERROR_MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  };
};
