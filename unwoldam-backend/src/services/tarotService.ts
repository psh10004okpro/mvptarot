import { TarotCard, Reading, Interpretation, User } from '../models';
import { ICreateReadingDTO } from '../types';
import { AppError } from '../utils/response';
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  READING_TYPES,
  CARD_ORIENTATIONS,
  TAROT_POSITIONS
} from '../config/constants';

// Get random card orientation
const getRandomOrientation = (): 'upright' | 'reversed' => {
  return Math.random() > 0.5 ? CARD_ORIENTATIONS.UPRIGHT : CARD_ORIENTATIONS.REVERSED;
};

// Generate interpretation based on cards
const generateInterpretation = async (
  cards: any[],
  context: string,
  type: string
): Promise<string> => {
  let interpretation = '';

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const cardData = await TarotCard.findById(card.cardId);

    if (!cardData) continue;

    // Try to find specific interpretation from database
    const interpretations = await Interpretation.findByCard(
      card.cardId.toString(),
      card.orientation,
      context
    );

    let cardInterpretation = '';

    if (interpretations && interpretations.length > 0) {
      // Use high-quality interpretation from database
      cardInterpretation = interpretations[0].interpretation;
    } else {
      // Fall back to basic meaning
      cardInterpretation = card.orientation === CARD_ORIENTATIONS.UPRIGHT
        ? cardData.basicMeaning.upright
        : cardData.basicMeaning.reversed;
    }

    // Add position context for multi-card spreads
    if (type === READING_TYPES.THREE_CARD) {
      const positions = Object.values(TAROT_POSITIONS.THREE_CARD);
      const position = positions[i];
      interpretation += `\n\n**${position.name} - ${cardData.nameKo} (${card.orientation === 'upright' ? '정방향' : '역방향'})**\n${cardInterpretation}`;
    } else if (type === READING_TYPES.CELTIC_CROSS) {
      const positions = Object.values(TAROT_POSITIONS.CELTIC_CROSS);
      const position = positions[i];
      interpretation += `\n\n**${position.name} - ${cardData.nameKo} (${card.orientation === 'upright' ? '정방향' : '역방향'})**\n${cardInterpretation}`;
    } else {
      interpretation += `\n\n**${cardData.nameKo} (${card.orientation === 'upright' ? '정방향' : '역방향'})**\n${cardInterpretation}`;
    }
  }

  return interpretation.trim();
};

export const createReading = async (
  userId: string,
  data: ICreateReadingDTO
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Determine number of cards based on reading type
  let cardCount = 1;
  if (data.type === READING_TYPES.THREE_CARD) {
    cardCount = 3;
  } else if (data.type === READING_TYPES.CELTIC_CROSS) {
    cardCount = 10;
  }

  // Get random cards
  const randomCards = await TarotCard.getRandomCards(cardCount);

  if (randomCards.length < cardCount) {
    throw new AppError('Not enough cards in database', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  // Create reading cards with orientations
  const readingCards = randomCards.map((card, index) => ({
    position: index,
    cardId: card._id,
    orientation: getRandomOrientation()
  }));

  // Generate interpretation
  const interpretation = await generateInterpretation(
    readingCards,
    data.context || 'general',
    data.type
  );

  // Create reading
  const reading = await Reading.create({
    userId,
    type: data.type,
    cards: readingCards,
    question: data.question,
    interpretation,
    context: data.context || 'general',
    isVoiceReading: data.isVoiceReading || false
  });

  // Increment user's daily reading count
  await user.incrementReadingCount();

  // Populate card details
  await reading.populate('cards.cardId');

  return reading;
};

export const getDailyFortune = async (userId: string) => {
  // Check if user already has a daily reading today
  const existingReading = await Reading.getTodayReading(userId);

  if (existingReading) {
    return existingReading;
  }

  // Create new daily reading
  return createReading(userId, {
    type: READING_TYPES.DAILY,
    context: 'general'
  });
};

export const getReadingHistory = async (
  userId: string,
  limit: number = 10,
  page: number = 1
) => {
  const skip = (page - 1) * limit;

  const readings = await Reading.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('cards.cardId');

  const total = await Reading.countDocuments({ userId });

  return {
    readings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getReadingById = async (readingId: string, userId: string) => {
  const reading = await Reading.findOne({ _id: readingId, userId })
    .populate('cards.cardId');

  if (!reading) {
    throw new AppError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return reading;
};

export const getAllCards = async () => {
  const cards = await TarotCard.find().sort({ cardNumber: 1 });
  return cards;
};

export const getCardById = async (cardId: string) => {
  const card = await TarotCard.findById(cardId);

  if (!card) {
    throw new AppError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return card;
};

export const getCardCombinationInterpretation = async (
  cardIds: string[],
  context?: string
) => {
  if (cardIds.length < 2) {
    throw new AppError('At least 2 cards are required for combination', HTTP_STATUS.BAD_REQUEST);
  }

  const interpretations = await Interpretation.findByCombination(cardIds, context);

  return interpretations;
};
