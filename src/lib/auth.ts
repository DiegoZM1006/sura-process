/**
 * Manejo de sesión en el cliente.
 *
 * El backend (btl-sura-backend) autentica con JWT (Bearer token), no con
 * cookies de sesión. Para poder:
 *  1) adjuntar el token en cada llamada fetch al backend, y
 *  2) proteger rutas en el middleware de Next.js (que corre en el edge y no
 *     tiene acceso a localStorage),
 * guardamos el token en dos lugares en el login:
 *  - localStorage: lo usa `api-client.ts` para el header Authorization.
 *  - una cookie no-httpOnly: la lee `middleware.ts` para saber si hay sesión.
 */

export interface AuthUser {
  id: string
  email: string
  fullName: string
  phone: string
  role: "USER" | "SYSTEM"
}

export interface AuthSession {
  accessToken: string
  user: AuthUser
}

const STORAGE_KEY = "btl_auth"
const COOKIE_NAME = "btl_token"
// Debe coincidir con signOptions.expiresIn del backend (auth.module.ts -> 24h)
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24

export function saveSession(session: AuthSession) {
  if (typeof window === "undefined") return

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))

  // Cookie legible por el middleware para proteger rutas.
  // No es httpOnly porque se define desde el cliente tras el login;
  // no reemplaza al JWT como mecanismo de autenticación de la API.
  document.cookie = `${COOKIE_NAME}=${session.accessToken}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function getAccessToken(): string | null {
  return getSession()?.accessToken ?? null
}

export function clearSession() {
  if (typeof window === "undefined") return

  window.localStorage.removeItem(STORAGE_KEY)
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
}
