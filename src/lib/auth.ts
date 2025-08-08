import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';

// Función para decodificar JWT (sin verificar la firma, solo para extraer datos)
function decodeJWT(token: string) {
  try {
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload);
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export const tokenUtils = {
  setToken: (token: string) => {
    Cookies.set(TOKEN_KEY, token, {
      expires: 7, // 7 días
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  },

  getToken: (): string | undefined => {
    return Cookies.get(TOKEN_KEY);
  },

  removeToken: () => {
    Cookies.remove(TOKEN_KEY);
  },

  hasToken: (): boolean => {
    return !!Cookies.get(TOKEN_KEY);
  },

  // Función para extraer el email del JWT
  getEmailFromToken: (): string | null => {
    const token = Cookies.get(TOKEN_KEY);
    if (!token) return null;
    
    const decoded = decodeJWT(token);
    return decoded?.email || decoded?.sub || null;
  },

  // Función para extraer información completa del JWT
  getTokenData: () => {
    const token = Cookies.get(TOKEN_KEY);
    if (!token) return null;
    
    return decodeJWT(token);
  }
};
