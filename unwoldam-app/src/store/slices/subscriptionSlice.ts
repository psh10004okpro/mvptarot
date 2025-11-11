import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { subscriptionService } from '../../services/subscriptionService';
import { SubscriptionState, Subscription, SubscriptionPlan } from '../../types/models';

const initialState: SubscriptionState = {
  currentSubscription: null,
  plans: [],
  isLoading: false,
  error: null,
};

// 비동기 Thunks
export const fetchSubscriptionPlans = createAsyncThunk(
  'subscription/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      const plans = await subscriptionService.getPlans();
      return plans;
    } catch (error: any) {
      return rejectWithValue(error.message || '구독 플랜 조회에 실패했습니다.');
    }
  }
);

export const fetchSubscriptionStatus = createAsyncThunk(
  'subscription/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const subscription = await subscriptionService.getSubscriptionStatus();
      return subscription;
    } catch (error: any) {
      return rejectWithValue(error.message || '구독 상태 조회에 실패했습니다.');
    }
  }
);

export const subscribe = createAsyncThunk(
  'subscription/subscribe',
  async (
    params: { plan: 'basic' | 'premium'; paymentMethod: string },
    { rejectWithValue }
  ) => {
    try {
      const subscription = await subscriptionService.subscribe(params.plan, params.paymentMethod);
      return subscription;
    } catch (error: any) {
      return rejectWithValue(error.message || '구독에 실패했습니다.');
    }
  }
);

export const cancelSubscription = createAsyncThunk(
  'subscription/cancel',
  async (subscriptionId: string, { rejectWithValue }) => {
    try {
      await subscriptionService.cancelSubscription(subscriptionId);
      return subscriptionId;
    } catch (error: any) {
      return rejectWithValue(error.message || '구독 취소에 실패했습니다.');
    }
  }
);

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscription: (state, action: PayloadAction<Subscription | null>) => {
      state.currentSubscription = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Plans
    builder
      .addCase(fetchSubscriptionPlans.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plans = action.payload;
        state.error = null;
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Status
    builder
      .addCase(fetchSubscriptionStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSubscription = action.payload;
        state.error = null;
      })
      .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Subscribe
    builder
      .addCase(subscribe.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(subscribe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSubscription = action.payload;
        state.error = null;
      })
      .addCase(subscribe.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Cancel Subscription
    builder
      .addCase(cancelSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state) => {
        state.isLoading = false;
        if (state.currentSubscription) {
          state.currentSubscription = {
            ...state.currentSubscription,
            status: 'cancelled',
          };
        }
        state.error = null;
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSubscription, clearError } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
