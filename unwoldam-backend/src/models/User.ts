import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { MEMBERSHIP_TYPES } from '../config/constants';

export interface IUserDocument extends Document {
  email: string;
  password: string;
  name: string;
  nickname?: string;
  birthDate?: Date;
  membershipType: 'free' | 'basic' | 'premium';
  dailyReadingCount: number;
  lastReadingReset: Date;
  preferences: {
    favoriteSpread?: string;
    notificationEnabled: boolean;
  };
  createdAt: Date;
  lastLoginAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  incrementReadingCount(): Promise<void>;
  resetDailyCount(): Promise<void>;
}

interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    nickname: {
      type: String,
      trim: true,
      maxlength: [20, 'Nickname cannot exceed 20 characters']
    },
    birthDate: {
      type: Date
    },
    membershipType: {
      type: String,
      enum: Object.values(MEMBERSHIP_TYPES),
      default: MEMBERSHIP_TYPES.FREE
    },
    dailyReadingCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastReadingReset: {
      type: Date,
      default: Date.now
    },
    preferences: {
      favoriteSpread: {
        type: String
      },
      notificationEnabled: {
        type: Boolean,
        default: true
      }
    },
    lastLoginAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes for optimization
userSchema.index({ email: 1 });
userSchema.index({ membershipType: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to increment reading count
userSchema.methods.incrementReadingCount = async function (): Promise<void> {
  const now = new Date();
  const lastReset = new Date(this.lastReadingReset);

  // Reset count if it's a new day (KST 기준)
  const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const kstLastReset = new Date(lastReset.getTime() + (9 * 60 * 60 * 1000));

  if (
    kstNow.getDate() !== kstLastReset.getDate() ||
    kstNow.getMonth() !== kstLastReset.getMonth() ||
    kstNow.getFullYear() !== kstLastReset.getFullYear()
  ) {
    this.dailyReadingCount = 0;
    this.lastReadingReset = now;
  }

  this.dailyReadingCount += 1;
  await this.save();
};

// Instance method to reset daily count
userSchema.methods.resetDailyCount = async function (): Promise<void> {
  this.dailyReadingCount = 0;
  this.lastReadingReset = new Date();
  await this.save();
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Virtual for checking if user has active subscription
userSchema.virtual('hasActiveSubscription').get(function () {
  return this.membershipType !== MEMBERSHIP_TYPES.FREE;
});

const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;
