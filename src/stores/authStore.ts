"use client";

import type { User } from '@/types';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, pass: string, role: 'guest' | 'admin') => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, pass: string) => Promise<boolean>;
  hydrated: boolean;
  setHydrated: () => void;
}

// Mock users
const mockUsers: User[] = [
  { id: 'guest1', name: 'John Doe', email: 'guest@example.com', role: 'guest' },
  { id: 'admin1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      login: async (email, password, role) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        const foundUser = mockUsers.find(u => u.email === email && u.role === role);
        
        if (foundUser) {
          // In a real app, password would be checked against a hash
          const mockToken = `mock-token-${foundUser.id}-${Date.now()}`;
          set({ user: foundUser, token: mockToken });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ user: null, token: null });
      },
      register: async (name, email, password) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        if (mockUsers.some(u => u.email === email)) {
          return false; // User already exists
        }
        const newUser: User = { id: `guest-${Date.now()}`, name, email, role: 'guest' };
        mockUsers.push(newUser); // Add to mock DB
        const mockToken = `mock-token-${newUser.id}-${Date.now()}`;
        set({ user: newUser, token: mockToken });
        return true;
      },
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated();
      }
    }
  )
);

// Hook to ensure Zustand is hydrated before rendering UI that depends on persisted state
export const useHydratedAuthStore = <T>(selector: (state: AuthState) => T) => {
  const state = useAuthStore(selector);
  const hydrated = useAuthStore((s) => s.hydrated);
  return hydrated ? state : (selector(useAuthStore.getState()) as T); // Return default or server state until hydrated
};
