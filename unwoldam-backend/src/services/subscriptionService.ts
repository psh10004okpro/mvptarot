import { Subscription, User } from '../models';
import { ISubscribeDTO } from '../types';
import { AppError } from '../utils/response';
import {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUS,
  MEMBERSHIP_TYPES
} from '../config/constants';

export const getSubscriptionPlans = () => {
  return Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
    id: key.toLowerCase(),
    ...plan
  }));
};

export const subscribe = async (userId: string, data: ISubscribeDTO) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // Check if user already has an active subscription
  const existingSubscription = await Subscription.findActiveByUser(userId);

  if (existingSubscription) {
    throw new AppError(
      '이미 활성화된 구독이 있습니다.',
      HTTP_STATUS.CONFLICT
    );
  }

  // Get plan details
  const planKey = data.plan.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS;
  const planDetails = SUBSCRIPTION_PLANS[planKey];

  if (!planDetails) {
    throw new AppError('Invalid subscription plan', HTTP_STATUS.BAD_REQUEST);
  }

  // Calculate subscription dates (30 days)
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  // Create subscription
  const subscription = await Subscription.create({
    userId,
    plan: data.plan,
    startDate,
    endDate,
    paymentMethod: data.paymentMethod,
    amount: planDetails.price,
    currency: planDetails.currency,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    transactionId: `TXN-${Date.now()}-${userId.substring(0, 8)}`
  });

  // Update user membership type
  user.membershipType = data.plan as 'basic' | 'premium';
  await user.save();

  return {
    subscription,
    user: {
      id: user._id,
      membershipType: user.membershipType
    }
  };
};

export const getSubscriptionStatus = async (userId: string) => {
  const activeSubscription = await Subscription.findActiveByUser(userId);

  if (!activeSubscription) {
    return {
      hasSubscription: false,
      plan: null,
      status: null
    };
  }

  return {
    hasSubscription: true,
    plan: activeSubscription.plan,
    status: activeSubscription.status,
    startDate: activeSubscription.startDate,
    endDate: activeSubscription.endDate,
    remainingDays: activeSubscription.remainingDays,
    autoRenew: activeSubscription.autoRenew
  };
};

export const cancelSubscription = async (userId: string, reason?: string) => {
  const activeSubscription = await Subscription.findActiveByUser(userId);

  if (!activeSubscription) {
    throw new AppError(
      '활성화된 구독이 없습니다.',
      HTTP_STATUS.NOT_FOUND
    );
  }

  const cancelledSubscription = await Subscription.cancelSubscription(
    activeSubscription._id.toString(),
    reason
  );

  // Update user membership type to free
  const user = await User.findById(userId);
  if (user) {
    user.membershipType = MEMBERSHIP_TYPES.FREE;
    await user.save();
  }

  return cancelledSubscription;
};

export const getSubscriptionHistory = async (userId: string) => {
  const subscriptions = await Subscription.findByUser(userId);
  return subscriptions;
};

// Background job to check and expire subscriptions
export const checkExpiredSubscriptions = async () => {
  await Subscription.checkExpired();

  // Update users whose subscriptions have expired
  const expiredSubscriptions = await Subscription.find({
    status: SUBSCRIPTION_STATUS.EXPIRED,
    updatedAt: { $gte: new Date(Date.now() - 60000) } // Updated in last minute
  });

  for (const subscription of expiredSubscriptions) {
    const user = await User.findById(subscription.userId);
    if (user && user.membershipType !== MEMBERSHIP_TYPES.FREE) {
      user.membershipType = MEMBERSHIP_TYPES.FREE;
      await user.save();
      console.log(`✅ User ${user.email} membership updated to FREE`);
    }
  }
};
