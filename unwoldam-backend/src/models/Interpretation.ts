import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { CARD_ORIENTATIONS, READING_CONTEXTS } from '../config/constants';

export interface IInterpretationDocument extends Document {
  cardId: Types.ObjectId;
  combinationIds?: Types.ObjectId[];
  context: string;
  orientation: 'upright' | 'reversed';
  interpretation: string;
  keywords: string[];
  mzStyle: boolean;
  qualityScore: number;
  tags?: string[];
  metadata?: {
    author?: string;
    source?: string;
    verified?: boolean;
  };
}

interface IInterpretationModel extends Model<IInterpretationDocument> {
  findByCard(
    cardId: string,
    orientation: string,
    context?: string
  ): Promise<IInterpretationDocument[]>;
  findByCombination(
    cardIds: string[],
    context?: string
  ): Promise<IInterpretationDocument[]>;
  getHighQualityInterpretations(
    minScore: number
  ): Promise<IInterpretationDocument[]>;
  getMZStyleInterpretations(): Promise<IInterpretationDocument[]>;
}

const interpretationSchema = new Schema<IInterpretationDocument>(
  {
    cardId: {
      type: Schema.Types.ObjectId,
      ref: 'TarotCard',
      required: true,
      index: true
    },
    combinationIds: {
      type: [Schema.Types.ObjectId],
      ref: 'TarotCard',
      default: []
    },
    context: {
      type: String,
      required: true,
      enum: [...Object.values(READING_CONTEXTS), 'combination'],
      index: true
    },
    orientation: {
      type: String,
      required: true,
      enum: Object.values(CARD_ORIENTATIONS),
      index: true
    },
    interpretation: {
      type: String,
      required: true
    },
    keywords: {
      type: [String],
      default: [],
      index: true
    },
    mzStyle: {
      type: Boolean,
      default: false,
      index: true
    },
    qualityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50,
      index: true
    },
    tags: {
      type: [String],
      default: []
    },
    metadata: {
      author: String,
      source: String,
      verified: {
        type: Boolean,
        default: false
      }
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

// Compound indexes for optimization
interpretationSchema.index({ cardId: 1, orientation: 1, context: 1 });
interpretationSchema.index({ qualityScore: -1, mzStyle: 1 });
interpretationSchema.index({ keywords: 1, context: 1 });
interpretationSchema.index({ combinationIds: 1 });

// Static method to find interpretations by card
interpretationSchema.statics.findByCard = function (
  cardId: string,
  orientation: string,
  context?: string
) {
  const query: any = { cardId, orientation };
  if (context) {
    query.context = context;
  }
  return this.find(query)
    .sort({ qualityScore: -1 })
    .populate('cardId');
};

// Static method to find interpretations by card combination
interpretationSchema.statics.findByCombination = function (
  cardIds: string[],
  context?: string
) {
  const query: any = {
    combinationIds: { $all: cardIds }
  };
  if (context) {
    query.context = context;
  }
  return this.find(query)
    .sort({ qualityScore: -1 })
    .populate('cardId combinationIds');
};

// Static method to get high quality interpretations
interpretationSchema.statics.getHighQualityInterpretations = function (
  minScore: number = 70
) {
  return this.find({ qualityScore: { $gte: minScore } })
    .sort({ qualityScore: -1 })
    .populate('cardId');
};

// Static method to get MZ style interpretations
interpretationSchema.statics.getMZStyleInterpretations = function () {
  return this.find({ mzStyle: true })
    .sort({ qualityScore: -1 })
    .populate('cardId');
};

const Interpretation = mongoose.model<IInterpretationDocument, IInterpretationModel>(
  'Interpretation',
  interpretationSchema
);

export default Interpretation;
