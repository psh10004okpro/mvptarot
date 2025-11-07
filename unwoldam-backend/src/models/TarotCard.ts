import mongoose, { Schema, Document, Model } from 'mongoose';
import { ARCANA_TYPES, SUITS } from '../config/constants';

export interface ITarotCardDocument extends Document {
  cardNumber: number;
  name: string;
  nameKo: string;
  arcana: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  keywords: string[];
  basicMeaning: {
    upright: string;
    reversed: string;
  };
  imageUrl?: string;
  description?: string;
}

interface ITarotCardModel extends Model<ITarotCardDocument> {
  findByNumber(cardNumber: number): Promise<ITarotCardDocument | null>;
  getRandomCards(count: number): Promise<ITarotCardDocument[]>;
  getMajorArcana(): Promise<ITarotCardDocument[]>;
  getMinorArcana(suit?: string): Promise<ITarotCardDocument[]>;
}

const tarotCardSchema = new Schema<ITarotCardDocument>(
  {
    cardNumber: {
      type: Number,
      required: true,
      unique: true,
      min: 0,
      max: 77
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    nameKo: {
      type: String,
      required: true,
      trim: true
    },
    arcana: {
      type: String,
      required: true,
      enum: Object.values(ARCANA_TYPES)
    },
    suit: {
      type: String,
      enum: [...Object.values(SUITS), null],
      required: function (this: ITarotCardDocument) {
        return this.arcana === ARCANA_TYPES.MINOR;
      }
    },
    keywords: {
      type: [String],
      default: []
    },
    basicMeaning: {
      upright: {
        type: String,
        required: true
      },
      reversed: {
        type: String,
        required: true
      }
    },
    imageUrl: {
      type: String
    },
    description: {
      type: String
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
tarotCardSchema.index({ cardNumber: 1 });
tarotCardSchema.index({ arcana: 1 });
tarotCardSchema.index({ suit: 1 });
tarotCardSchema.index({ name: 1 });
tarotCardSchema.index({ keywords: 1 });

// Static method to find by card number
tarotCardSchema.statics.findByNumber = function (cardNumber: number) {
  return this.findOne({ cardNumber });
};

// Static method to get random cards
tarotCardSchema.statics.getRandomCards = async function (count: number) {
  const cards = await this.aggregate([
    { $sample: { size: count } }
  ]);
  return cards;
};

// Static method to get all Major Arcana cards
tarotCardSchema.statics.getMajorArcana = function () {
  return this.find({ arcana: ARCANA_TYPES.MAJOR }).sort({ cardNumber: 1 });
};

// Static method to get Minor Arcana cards (optionally filtered by suit)
tarotCardSchema.statics.getMinorArcana = function (suit?: string) {
  const query: any = { arcana: ARCANA_TYPES.MINOR };
  if (suit) {
    query.suit = suit;
  }
  return this.find(query).sort({ cardNumber: 1 });
};

const TarotCard = mongoose.model<ITarotCardDocument, ITarotCardModel>(
  'TarotCard',
  tarotCardSchema
);

export default TarotCard;
