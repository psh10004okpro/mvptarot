import apiClient from './api';
import { User } from '@types/models';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  nickname?: string;
  birthDate?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);

    if (response.data.success && response.data.data) {
      // Store tokens
      await apiClient.setAccessToken(response.data.data.accessToken);
      await apiClient.setRefreshToken(response.data.data.refreshToken);

      return response.data.data;
    }

    throw new Error(response.data.error || '회원가입에 실패했습니다.');
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);

    if (response.data.success && response.data.data) {
      // Store tokens
      await apiClient.setAccessToken(response.data.data.accessToken);
      await apiClient.setRefreshToken(response.data.data.refreshToken);

      return response.data.data;
    }

    throw new Error(response.data.error || '로그인에 실패했습니다.');
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Always clear local tokens
      await apiClient.clearTokens();
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || '프로필 조회에 실패했습니다.');
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<string> {
    const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', {
      refreshToken,
    });

    if (response.data.success && response.data.data) {
      const { accessToken } = response.data.data;
      await apiClient.setAccessToken(accessToken);
      return accessToken;
    }

    throw new Error(response.data.error || '토큰 갱신에 실패했습니다.');
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getProfile();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
const authService = new AuthService();

export default authService;
