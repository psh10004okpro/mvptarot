import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { READING_TYPES, READING_CONTEXTS, CARD_ORIENTATIONS } from '../config/constants';

interface IReadingCard {
  position: number;
  cardId: Types.ObjectId;
  orientation: 'upright' | 'reversed';
  positionName?: string;
}

export interface IReadingDocument extends Document {
  userId: Types.ObjectId;
  type: 'daily' | 'single' | 'three-card' | 'celtic-cross';
  cards: IReadingCard[];
  question?: string;
  interpretation: string;
  context: 'general' | 'love' | 'career' | 'health' | 'spiritual';
  isVoiceReading: boolean;
  voiceUrl?: string;
  createdAt: Date;
}

interface IReadingModel extends Model<IReadingDocument> {
  findByUser(userId: string, limit?: number): Promise<IReadingDocument[]>;
  getTodayReading(userId: string): Promise<IReadingDocument | null>;
  getReadingsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IReadingDocument[]>;
}

const readingCardSchema = new Schema<IReadingCard>(
  {
    position: {
      type: Number,
      required: true
    },
    cardId: {
      type: Schema.Types.ObjectId,
      ref: 'TarotCard',
      required: true
    },
    orientation: {
      type: String,
      enum: Object.values(CARD_ORIENTATIONS),
      required: true
    },
    positionName: {
      type: String
    }
  },
  { _id: false }
);

const readingSchema = new Schema<IReadingDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(READING_TYPES),
      required: true
    },
    cards: {
      type: [readingCardSchema],
      required: true,
      validate: {
        validator: function (cards: IReadingCard[]) {
          return cards.length > 0 && cards.length <= 10;
        },
        message: 'Cards array must have between 1 and 10 cards'
      }
    },
    question: {
      type: String,
      trim: true,
      maxlength: 500
    },
    interpretation: {
      type: String,
      required: true
    },
    context: {
      type: String,
      enum: Object.values(READING_CONTEXTS),
      default: READING_CONTEXTS.GENERAL
    },
    isVoiceReading: {
      type: Boolean,
      default: false
    },
    voiceUrl: {
      type: String
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes for optimization
readingSchema.index({ userId: 1, createdAt: -1 });
readingSchema.index({ type: 1 });
readingSchema.index({ context: 1 });
readingSchema.index({ createdAt: -1 });

// Static method to find readings by user
readingSchema.statics.findByUser = function (
  userId: string,
  limit: number = 10
) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('cards.cardId');
};

// Static method to get today's daily reading
readingSchema.statics.getTodayReading = function (userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.findOne({
    userId,
    type: READING_TYPES.DAILY,
    createdAt: { $gte: today, $lt: tomorrow }
  }).populate('cards.cardId');
};

// Static method to get readings by date range
readingSchema.statics.getReadingsByDateRange = function (
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    userId,
    createdAt: { $gte: startDate, $lte: endDate }
  })
    .sort({ createdAt: -1 })
    .populate('cards.cardId');
};

// Virtual to populate card details
readingSchema.virtual('cardDetails', {
  ref: 'TarotCard',
  localField: 'cards.cardId',
  foreignField: '_id'
});

const Reading = mongoose.model<IReadingDocument, IReadingModel>(
  'Reading',
  readingSchema
);

export default Reading;
