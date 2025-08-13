import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { tokenUtils } from '@/lib/auth';

interface OAuthStatus {
  isAuthorized: boolean;
  message: string;
}

const OAUTH_CACHE_KEY = 'oauth_status_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

interface CachedOAuthStatus {
  status: OAuthStatus;
  timestamp: number;
  userEmail: string;
}

export const useOAuth = () => {
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { showError } = useToast();

  // Obtener estado del cache
  const getCachedStatus = useCallback((): OAuthStatus | null => {
    try {
      const currentUser = tokenUtils.getEmailFromToken();
      if (!currentUser) return null;

      const cached = localStorage.getItem(OAUTH_CACHE_KEY);
      if (!cached) return null;

      const parsedCache: CachedOAuthStatus = JSON.parse(cached);
      
      // Verificar si el cache es del mismo usuario y no ha expirado
      const isExpired = Date.now() - parsedCache.timestamp > CACHE_DURATION;
      const isSameUser = parsedCache.userEmail === currentUser;
      
      if (isSameUser && !isExpired && parsedCache.status.isAuthorized) {
        console.log('Using cached OAuth status for user:', currentUser);
        return parsedCache.status;
      }
      
      return null;
    } catch (error) {
      console.error('Error reading OAuth cache:', error);
      return null;
    }
  }, []);

  // Guardar estado en cache
  const setCachedStatus = useCallback((status: OAuthStatus) => {
    try {
      const currentUser = tokenUtils.getEmailFromToken();
      if (!currentUser) return;

      const cacheData: CachedOAuthStatus = {
        status,
        timestamp: Date.now(),
        userEmail: currentUser,
      };
      
      localStorage.setItem(OAUTH_CACHE_KEY, JSON.stringify(cacheData));
      console.log('OAuth status cached for user:', currentUser);
    } catch (error) {
      console.error('Error caching OAuth status:', error);
    }
  }, []);

  // Limpiar cache
  const clearOAuthCache = useCallback(() => {
    localStorage.removeItem(OAUTH_CACHE_KEY);
    console.log('OAuth cache cleared');
  }, []);

  // Verificar el estado de OAuth (solo si no está en cache)
  const checkOAuthStatus = useCallback(async (forceCheck = false): Promise<OAuthStatus | null> => {
    // Si no es verificación forzada, intentar usar cache primero
    if (!forceCheck) {
      const cachedStatus = getCachedStatus();
      if (cachedStatus) {
        return cachedStatus;
      }
    }

    setIsCheckingStatus(true);
    try {
      console.log('Checking OAuth status from server...');
      const response = await apiClient.get<OAuthStatus>('/oauth/status');
      
      // Solo cachear si está autorizado
      if (response.isAuthorized) {
        setCachedStatus(response);
      } else {
        // Si no está autorizado, limpiar cualquier cache existente
        clearOAuthCache();
      }
      
      return response;
    } catch (error) {
      console.error('Error checking OAuth status:', error);
      showError('Error al verificar el estado de autorización');
      return null;
    } finally {
      setIsCheckingStatus(false);
    }
  }, [getCachedStatus, setCachedStatus, clearOAuthCache, showError]);

  // Redirigir a Google OAuth con token
  const authorizeWithGoogle = useCallback(() => {
    try {
      const token = tokenUtils.getToken();
      if (!token) {
        showError('No se encontró token de autenticación');
        return;
      }

      // Limpiar cache antes de iniciar nueva autorización
      clearOAuthCache();

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const authorizeUrl = `${backendUrl}/oauth/google/authorize?token=${token}`;
      
      console.log('Redirecting to OAuth authorization:', authorizeUrl);
      window.location.href = authorizeUrl;
    } catch (error) {
      console.error('Error redirecting to OAuth:', error);
      showError('Error al iniciar autorización con Google');
    }
  }, [clearOAuthCache, showError]);

  return {
    isCheckingStatus,
    checkOAuthStatus,
    authorizeWithGoogle,
    clearOAuthCache,
    getCachedStatus,
  };
};
