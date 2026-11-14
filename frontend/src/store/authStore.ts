import { create } from 'zustand';
import { User } from '../types';
import { apiClient } from '../lib/api';
import { storage } from '../lib/storage';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initAuth: () => Promise<void>;
  login: (userData: User, token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

const getStoredUser = (): User | null => {
  const cached = storage.getSync('user_data');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: storage.getSync('access_token'),
  isAuthenticated: !!storage.getSync('access_token'),
  isLoading: false,

  initAuth: async () => {
    await storage.init();
    const token = await storage.getItem('access_token');
    const rawUser = await storage.getItem('user_data');
    let user: User | null = null;
    if (rawUser) {
      try {
        user = JSON.parse(rawUser);
      } catch {
        user = null;
      }
    }
    set({ token, user, isAuthenticated: !!token });
  },

  login: async (userData: User, token: string, refreshToken: string) => {
    await Promise.all([
      storage.setItem('access_token', token),
      storage.setItem('refresh_token', refreshToken),
      storage.setItem('user_data', JSON.stringify(userData)),
    ]);
    set({ user: userData, token, isAuthenticated: true });
  },

  logout: async () => {
    await Promise.all([
      storage.removeItem('access_token'),
      storage.removeItem('refresh_token'),
      storage.removeItem('user_data'),
    ]);
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const response: any = await apiClient.get('/users/me');
      if (response?.data) {
        await storage.setItem('user_data', JSON.stringify(response.data));
        set({ user: response.data, isAuthenticated: true, isLoading: false });
      }
    } catch {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: async (updatedUser: User) => {
    await storage.setItem('user_data', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
}));
