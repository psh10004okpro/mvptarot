import { Request, Response, NextFunction } from 'express';
import * as tarotService from '../services/tarotService';
import { sendSuccess, sendError } from '../utils/response';
import { HTTP_STATUS } from '../config/constants';

export const getAllCards = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const cards = await tarotService.getAllCards();

    return sendSuccess(res, cards, '전체 카드 목록 조회 완료');
  } catch (err) {
    next(err);
  }
};

export const getCardById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { id } = req.params;

    const card = await tarotService.getCardById(id);

    return sendSuccess(res, card);
  } catch (err) {
    next(err);
  }
};

export const getCardCombination = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const { cardIds, context } = req.query;

    if (!cardIds) {
      return sendError(
        res,
        'cardIds parameter is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Parse cardIds (should be comma-separated)
    const cardIdsArray = typeof cardIds === 'string'
      ? cardIds.split(',')
      : Array.isArray(cardIds)
        ? cardIds
        : [];

    if (cardIdsArray.length < 2) {
      return sendError(
        res,
        'At least 2 card IDs are required',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const interpretations = await tarotService.getCardCombinationInterpretation(
      cardIdsArray as string[],
      context as string | undefined
    );

    return sendSuccess(res, interpretations, '카드 조합 해석 조회 완료');
  } catch (err) {
    next(err);
  }
};
