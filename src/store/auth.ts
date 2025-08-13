import { create } from 'zustand';
import { tokenUtils } from '@/lib/auth';
import { User } from '@/types/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
  checkAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },

  setToken: (token: string) => {
    tokenUtils.setToken(token);
  },

  logout: () => {
    tokenUtils.removeToken();
    
    // Limpiar cache de OAuth
    if (typeof window !== 'undefined') {
      localStorage.removeItem('oauth_status_cache');
    }
    
    set({ user: null, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  },

  checkAuth: () => {
    set({ isLoading: true });
    
    const hasToken = tokenUtils.hasToken();
    
    if (!hasToken) {
      set({ isAuthenticated: false, user: null, isLoading: false });
      return;
    }

    try {
      // Extraer el email del JWT
      const emailFromToken = tokenUtils.getEmailFromToken();
      
      // Si hay token, crear usuario con el email del JWT
      const user = {
        id: '1',
        email: emailFromToken || 'usuario@btllegal.com',
        name: emailFromToken || 'usuario@btllegal.com' // Usar el email también como nombre
      };
      
      set({ 
        isAuthenticated: true, 
        user: user, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Error checking auth:', error);
      // Si hay error, limpiar la autenticación
      tokenUtils.removeToken();
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));
