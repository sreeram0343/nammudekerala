import { apiFetch } from './api';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  profile_image: string | null;
  constituency_id: number | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export const authService = {
  signup: async (userData: any): Promise<UserResponse> => {
    return apiFetch<UserResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: any): Promise<TokenResponse> => {
    return apiFetch<TokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getMe: async (): Promise<UserResponse> => {
    return apiFetch<UserResponse>('/api/auth/me', {
      method: 'GET',
    });
  },
};
