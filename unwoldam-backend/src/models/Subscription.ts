import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { MEMBERSHIP_TYPES, SUBSCRIPTION_STATUS } from '../config/constants';

export interface ISubscriptionDocument extends Document {
  userId: Types.ObjectId;
  plan: 'basic' | 'premium';
  startDate: Date;
  endDate: Date;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: 'active' | 'cancelled' | 'expired';
  autoRenew: boolean;
  cancelledAt?: Date;
  cancellationReason?: string;
  transactionId?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface ISubscriptionModel extends Model<ISubscriptionDocument> {
  findActiveByUser(userId: string): Promise<ISubscriptionDocument | null>;
  findByUser(userId: string): Promise<ISubscriptionDocument[]>;
  checkExpired(): Promise<void>;
  cancelSubscription(subscriptionId: string, reason?: string): Promise<ISubscriptionDocument>;
}

const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    plan: {
      type: String,
      enum: [MEMBERSHIP_TYPES.BASIC, MEMBERSHIP_TYPES.PREMIUM],
      required: true
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: true
    },
    paymentMethod: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'KRW'
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.ACTIVE,
      index: true
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true
    },
    metadata: {
      type: Schema.Types.Mixed
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

// Indexes for optimization
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });
subscriptionSchema.index({ transactionId: 1 });

// Static method to find active subscription by user
subscriptionSchema.statics.findActiveByUser = function (userId: string) {
  return this.findOne({
    userId,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    endDate: { $gt: new Date() }
  }).populate('userId');
};

// Static method to find all subscriptions by user
subscriptionSchema.statics.findByUser = function (userId: string) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .populate('userId');
};

// Static method to check and update expired subscriptions
subscriptionSchema.statics.checkExpired = async function () {
  const now = new Date();
  const result = await this.updateMany(
    {
      status: SUBSCRIPTION_STATUS.ACTIVE,
      endDate: { $lte: now }
    },
    {
      $set: { status: SUBSCRIPTION_STATUS.EXPIRED }
    }
  );

  console.log(`✅ Updated ${result.modifiedCount} expired subscriptions`);
};

// Static method to cancel a subscription
subscriptionSchema.statics.cancelSubscription = async function (
  subscriptionId: string,
  reason?: string
) {
  const subscription = await this.findById(subscriptionId);

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
    throw new Error('Subscription is not active');
  }

  subscription.status = SUBSCRIPTION_STATUS.CANCELLED;
  subscription.cancelledAt = new Date();
  subscription.autoRenew = false;

  if (reason) {
    subscription.cancellationReason = reason;
  }

  await subscription.save();
  return subscription;
};

// Pre-save hook to validate dates
subscriptionSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

// Virtual to check if subscription is currently active
subscriptionSchema.virtual('isActive').get(function () {
  return (
    this.status === SUBSCRIPTION_STATUS.ACTIVE &&
    this.endDate > new Date()
  );
});

// Virtual to get remaining days
subscriptionSchema.virtual('remainingDays').get(function () {
  if (!this.isActive) return 0;
  const now = new Date();
  const diff = this.endDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

const Subscription = mongoose.model<ISubscriptionDocument, ISubscriptionModel>(
  'Subscription',
  subscriptionSchema
);

export default Subscription;
