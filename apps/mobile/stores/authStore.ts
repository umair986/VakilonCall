import { create } from 'zustand';
import type { IUser } from '@vakiloncall/shared';

interface IAuthState {
  // State
  user: IUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isNewUser: boolean;

  // Actions
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: IUser) => void;
  setIsNewUser: (isNew: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<IAuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  isNewUser: false,

  setTokens: (accessToken: string, refreshToken: string): void => {
    set({ accessToken, refreshToken, isAuthenticated: true });
  },

  setUser: (user: IUser): void => {
    set({ user, isAuthenticated: true, isLoading: false });
  },

  setIsNewUser: (isNew: boolean): void => {
    set({ isNewUser: isNew });
  },

  setLoading: (loading: boolean): void => {
    set({ isLoading: loading });
  },

  logout: (): void => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isNewUser: false,
    });
  },
}));
