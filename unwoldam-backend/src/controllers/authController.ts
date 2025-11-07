import { Request, Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
import * as authService from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';
import { validate, registerSchema, loginSchema } from '../utils/validation';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    // Validate request body
    const { error, value } = validate(registerSchema, req.body);

    if (error) {
      return sendError(res, error, HTTP_STATUS.BAD_REQUEST);
    }

    // Register user
    const result = await authService.registerUser(value!);

    return sendSuccess(
      res,
      result,
      '회원가입이 완료되었습니다.',
      HTTP_STATUS.CREATED
    );
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    // Validate request body
    const { error, value } = validate(loginSchema, req.body);

    if (error) {
      return sendError(res, error, HTTP_STATUS.BAD_REQUEST);
    }

    // Login user
    const result = await authService.loginUser(value!);

    return sendSuccess(res, result, '로그인 성공');
  } catch (err) {
    next(err);
  }
};

export const getMe = async (
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

    const userProfile = await authService.getUserProfile(req.user.userId);

    return sendSuccess(res, userProfile);
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(
        res,
        'Refresh token is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const result = await authService.refreshAccessToken(refreshToken);

    return sendSuccess(res, result, 'Token refreshed successfully');
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    // In a stateless JWT system, logout is handled on the client side
    // by removing the token. Here we just send a success response.
    // For a more robust solution, you could implement token blacklisting.

    return sendSuccess(res, null, '로그아웃 되었습니다.');
  } catch (err) {
    next(err);
  }
};
