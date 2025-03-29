import { create } from 'zustand';
import { auth } from '../lib/api';

interface AuthState {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signIn: async (email, password) => {
    const data = await auth.login(email, password);
    set({ user: data.user });
  },
  signUp: async (email, password) => {
    const data = await auth.signup(email, password);
    set({ user: data.user });
  },
  signOut: () => {
    auth.logout();
    set({ user: null });
  },
}));