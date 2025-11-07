import apiClient from './api';
import { Subscription, SubscriptionPlan } from '@types/models';

interface SubscribeData {
  plan: 'basic' | 'premium';
  paymentMethod: string;
}

interface SubscriptionStatus {
  hasSubscription: boolean;
  plan: string | null;
  status: string | null;
  startDate?: string;
  endDate?: string;
  remainingDays?: number;
  autoRenew?: boolean;
}

class SubscriptionService {
  /**
   * Get available subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await apiClient.get<SubscriptionPlan[]>('/subscription/plans');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || '플랜 정보를 불러오는데 실패했습니다.');
  }

  /**
   * Subscribe to a plan
   */
  async subscribe(data: SubscribeData): Promise<{
    subscription: Subscription;
    user: { id: string; membershipType: string };
  }> {
    const response = await apiClient.post<{
      subscription: Subscription;
      user: { id: string; membershipType: string };
    }>('/subscription/subscribe', data);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || '구독에 실패했습니다.');
  }

  /**
   * Get subscription status
   */
  async getStatus(): Promise<SubscriptionStatus> {
    const response = await apiClient.get<SubscriptionStatus>('/subscription/status');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || '구독 상태 조회에 실패했습니다.');
  }

  /**
   * Cancel subscription
   */
  async cancel(reason?: string): Promise<Subscription> {
    const response = await apiClient.put<Subscription>('/subscription/cancel', {
      reason,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || '구독 취소에 실패했습니다.');
  }

  /**
   * Get subscription history
   */
  async getHistory(): Promise<Subscription[]> {
    const response = await apiClient.get<Subscription[]>('/subscription/history');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || '구독 히스토리 조회에 실패했습니다.');
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return status.hasSubscription && status.status === 'active';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user can access feature
   */
  canAccessFeature(
    feature: 'basic-spread' | 'premium-spread' | 'voice-reading' | 'unlimited-readings',
    membershipType: 'free' | 'basic' | 'premium'
  ): boolean {
    const featureAccess: Record<string, string[]> = {
      'basic-spread': ['free', 'basic', 'premium'],
      'premium-spread': ['premium'],
      'voice-reading': ['premium'],
      'unlimited-readings': ['premium'],
    };

    return featureAccess[feature]?.includes(membershipType) || false;
  }

  /**
   * Get feature availability message
   */
  getFeatureMessage(
    feature: string,
    membershipType: 'free' | 'basic' | 'premium'
  ): string {
    if (this.canAccessFeature(feature as any, membershipType)) {
      return '이 기능을 사용할 수 있습니다.';
    }

    const messages: Record<string, string> = {
      'premium-spread': '켈틱 크로스는 프리미엄 회원만 이용할 수 있습니다.',
      'voice-reading': '음성 타로는 프리미엄 회원만 이용할 수 있습니다.',
      'unlimited-readings': '무제한 리딩은 프리미엄 회원만 이용할 수 있습니다.',
    };

    return messages[feature] || '이 기능은 구독이 필요합니다.';
  }
}

// Singleton instance
const subscriptionService = new SubscriptionService();

export default subscriptionService;
