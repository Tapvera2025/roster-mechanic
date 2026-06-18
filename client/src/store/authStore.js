import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
};

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', user.role.toLowerCase());
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userEmail', user.email);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        clearAuthStorage();
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
