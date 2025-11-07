import authService from '../../src/services/authService';
import apiClient from '../../src/services/api';

// Mock apiClient
jest.mock('../../src/services/api');

describe('AuthService', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              _id: 'user123',
              email: 'test@example.com',
              name: '테스트',
              membershipType: 'free',
            },
            accessToken: 'access_token_123',
            refreshToken: 'refresh_token_123',
          },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse as any);
      mockApiClient.setAccessToken = jest.fn().mockResolvedValue(undefined);
      mockApiClient.setRefreshToken = jest.fn().mockResolvedValue(undefined);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password123!',
        name: '테스트',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('access_token_123');
      expect(mockApiClient.setAccessToken).toHaveBeenCalledWith('access_token_123');
      expect(mockApiClient.setRefreshToken).toHaveBeenCalledWith('refresh_token_123');
    });

    it('should throw error on registration failure', async () => {
      const mockResponse = {
        data: {
          success: false,
          error: '이미 사용 중인 이메일입니다.',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse as any);

      await expect(
        authService.register({
          email: 'duplicate@example.com',
          password: 'Password123!',
          name: '테스트',
        })
      ).rejects.toThrow('이미 사용 중인 이메일입니다.');
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              _id: 'user123',
              email: 'login@example.com',
              membershipType: 'free',
            },
            accessToken: 'access_token_456',
            refreshToken: 'refresh_token_456',
          },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse as any);
      mockApiClient.setAccessToken = jest.fn().mockResolvedValue(undefined);
      mockApiClient.setRefreshToken = jest.fn().mockResolvedValue(undefined);

      const result = await authService.login({
        email: 'login@example.com',
        password: 'Password123!',
      });

      expect(result.user.email).toBe('login@example.com');
      expect(result.accessToken).toBe('access_token_456');
    });

    it('should throw error on invalid credentials', async () => {
      const mockResponse = {
        data: {
          success: false,
          error: '인증 정보가 올바르지 않습니다.',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse as any);

      await expect(
        authService.login({
          email: 'wrong@example.com',
          password: 'WrongPassword!',
        })
      ).rejects.toThrow('인증 정보가 올바르지 않습니다.');
    });
  });

  describe('logout', () => {
    it('should logout and clear tokens', async () => {
      mockApiClient.post.mockResolvedValue({ data: { success: true } } as any);
      mockApiClient.clearTokens = jest.fn().mockResolvedValue(undefined);

      await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(mockApiClient.clearTokens).toHaveBeenCalled();
    });

    it('should clear tokens even if API call fails', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network error'));
      mockApiClient.clearTokens = jest.fn().mockResolvedValue(undefined);

      await authService.logout();

      expect(mockApiClient.clearTokens).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should get user profile', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            _id: 'user123',
            email: 'profile@example.com',
            name: '프로필',
            membershipType: 'premium',
            dailyReadingCount: 5,
          },
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse as any);

      const result = await authService.getProfile();

      expect(result.email).toBe('profile@example.com');
      expect(result.membershipType).toBe('premium');
      expect(result.dailyReadingCount).toBe(5);
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'new_access_token',
          },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse as any);
      mockApiClient.setAccessToken = jest.fn().mockResolvedValue(undefined);

      const result = await authService.refreshToken('old_refresh_token');

      expect(result).toBe('new_access_token');
      expect(mockApiClient.setAccessToken).toHaveBeenCalledWith('new_access_token');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { _id: 'user123', email: 'auth@example.com' },
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse as any);

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when user is not authenticated', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Unauthorized'));

      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});
