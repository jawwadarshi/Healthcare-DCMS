import { apiClient } from '../lib';
import type { ApiResponse } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    userId: string;
    email: string;
    name: string;
    role: 'admin' | 'doctor' | 'staff' | 'patient';
  };
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      credentials
    );
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Logout gracefully even if API fails
    }
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },

  refreshToken: async (): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/refresh');
    return response.data.data;
  },
};
