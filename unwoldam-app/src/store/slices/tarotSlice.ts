import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tarotService } from '../../services/tarotService';
import { TarotState, Reading, TarotCard, ReadingType } from '../../types/models';

const initialState: TarotState = {
  cards: [],
  readings: [],
  currentReading: null,
  dailyFortune: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
  },
};

// 비동기 Thunks
export const fetchAllCards = createAsyncThunk(
  'tarot/fetchAllCards',
  async (_, { rejectWithValue }) => {
    try {
      const cards = await tarotService.getAllCards();
      return cards;
    } catch (error: any) {
      return rejectWithValue(error.message || '카드 조회에 실패했습니다.');
    }
  }
);

export const fetchDailyFortune = createAsyncThunk(
  'tarot/fetchDailyFortune',
  async (_, { rejectWithValue }) => {
    try {
      const fortune = await tarotService.getDailyFortune();
      return fortune;
    } catch (error: any) {
      return rejectWithValue(error.message || '오늘의 운세 조회에 실패했습니다.');
    }
  }
);

export const createReading = createAsyncThunk(
  'tarot/createReading',
  async (
    params: { type: ReadingType; question?: string; context?: string },
    { rejectWithValue }
  ) => {
    try {
      const reading = await tarotService.createReading(params.type, params.question, params.context);
      return reading;
    } catch (error: any) {
      return rejectWithValue(error.message || '리딩 생성에 실패했습니다.');
    }
  }
);

export const fetchReadingHistory = createAsyncThunk(
  'tarot/fetchReadingHistory',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await tarotService.getReadingHistory(params.page, params.limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '리딩 히스토리 조회에 실패했습니다.');
    }
  }
);

export const fetchReadingById = createAsyncThunk(
  'tarot/fetchReadingById',
  async (id: string, { rejectWithValue }) => {
    try {
      const reading = await tarotService.getReadingById(id);
      return reading;
    } catch (error: any) {
      return rejectWithValue(error.message || '리딩 조회에 실패했습니다.');
    }
  }
);

const tarotSlice = createSlice({
  name: 'tarot',
  initialState,
  reducers: {
    setCurrentReading: (state, action: PayloadAction<Reading | null>) => {
      state.currentReading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentReading: (state) => {
      state.currentReading = null;
    },
    resetPagination: (state) => {
      state.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasMore: false,
      };
      state.readings = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch All Cards
    builder
      .addCase(fetchAllCards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllCards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cards = action.payload;
        state.error = null;
      })
      .addCase(fetchAllCards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Daily Fortune
    builder
      .addCase(fetchDailyFortune.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDailyFortune.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dailyFortune = action.payload;
        state.error = null;
      })
      .addCase(fetchDailyFortune.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Reading
    builder
      .addCase(createReading.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReading.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentReading = action.payload;
        state.readings = [action.payload, ...state.readings];
        state.error = null;
      })
      .addCase(createReading.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Reading History
    builder
      .addCase(fetchReadingHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReadingHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        const { data, pagination } = action.payload;

        // 첫 페이지면 교체, 아니면 추가 (무한 스크롤)
        if (pagination.currentPage === 1) {
          state.readings = data;
        } else {
          state.readings = [...state.readings, ...data];
        }

        state.pagination = pagination;
        state.error = null;
      })
      .addCase(fetchReadingHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Reading By ID
    builder
      .addCase(fetchReadingById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReadingById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentReading = action.payload;
        state.error = null;
      })
      .addCase(fetchReadingById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentReading, clearError, clearCurrentReading, resetPagination } = tarotSlice.actions;
export default tarotSlice.reducer;
