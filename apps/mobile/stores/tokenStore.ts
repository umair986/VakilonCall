import { create } from 'zustand';

interface ITokenState {
  balance: number;
  isLoading: boolean;

  setBalance: (balance: number) => void;
  setLoading: (loading: boolean) => void;
  decrementBalance: () => void;
  incrementBalance: (amount: number) => void;
}

export const useTokenStore = create<ITokenState>((set) => ({
  balance: 0,
  isLoading: false,

  setBalance: (balance: number): void => {
    set({ balance });
  },

  setLoading: (loading: boolean): void => {
    set({ isLoading: loading });
  },

  decrementBalance: (): void => {
    set((state) => ({ balance: Math.max(0, state.balance - 1) }));
  },

  incrementBalance: (amount: number): void => {
    set((state) => ({ balance: state.balance + amount }));
  },
}));
