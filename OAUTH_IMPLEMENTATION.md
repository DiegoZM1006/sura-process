# Implementación OAuth con Gmail

## Resumen del Flujo

Se ha implementado la verificación OAuth con Gmail después del login exitoso, siguiendo el flujo especificado:

1. **Login tradicional** → Usuario se autentica con email/password
2. **Verificación OAuth** → Se verifica si está autorizado para Gmail
3. **Autorización** → Si no está autorizado, se redirige a Google OAuth
4. **Callback** → Se procesa la respuesta de Google
5. **Acceso** → Usuario accede al dashboard

## Archivos Implementados

### 1. Hook OAuth (`src/hooks/use-oauth.ts`)
- `checkOAuthStatus()` - Verifica estado OAuth con `GET /oauth/status`
- `authorizeWithGoogle()` - Redirige a `GET /oauth/google/authorize?token=JWT`

### 2. Componente OAuth Verifier (`src/components/oauth-verifier.tsx`)
- Verificación automática después del login
- Pantalla de autorización si no está autorizado
- Manejo de estados de carga y error

### 3. Página de Callback (`src/app/auth/callback/page.tsx`)
- Procesa la respuesta del backend después de OAuth
- Parsea parámetros `success` y `user`
- Redirige al dashboard en caso de éxito

### 4. Tipos y Servicios
- Tipos OAuth en `src/types/api.ts`
- Servicio OAuth en `src/services/api.ts`
- Middleware actualizado para rutas públicas

## Flujo Detallado

### Paso 1: Login Exitoso
```
POST /auth/login
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}

Response: {
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "1", "email": "usuario@ejemplo.com" }
}
```

### Paso 2: Verificación OAuth
```
GET /oauth/status
Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response: {
  "isAuthorized": false,
  "message": "Usuario no autorizado. Necesita completar OAuth."
}
```

### Paso 3: Redirección a Google (si no autorizado)
```
Frontend redirige a:
GET /oauth/google/authorize?token=eyJhbGciOiJIUzI1NiIs...

Backend redirige a Google:
Location: https://accounts.google.com/o/oauth2/v2/auth?
  access_type=offline&
  scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.send&
  state=USER_ID&
  prompt=consent&
  response_type=code&
  client_id=98873664998-ob442e0dd55vlmch6qlf895smkp2r0ac.apps.googleusercontent.com&
  redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Foauth%2Fgoogle%2Fcallback
```

### Paso 4: Callback de Google
```
Google redirige al backend:
GET /oauth/google/callback?code=4/0AeaYSHA8QxK7d...&state=USER_ID&scope=...

Backend procesa y redirige al frontend:
Location: http://localhost:3000/auth/callback?
  success=true&
  user=%7B%22email%22%3A%22usuario%40gmail.com%22%2C%22authorized%22%3Atrue%7D
```

### Paso 5: Procesamiento Frontend
```javascript
// Frontend parsea:
const user = JSON.parse(decodeURIComponent(userParam));
// user = { "email": "usuario@gmail.com", "authorized": true }

// Verifica autorización final:
GET /oauth/status
Response: {
  "isAuthorized": true,
  "message": "Usuario autorizado para Gmail"
}
```

## Estados de la Aplicación

### 1. **No autenticado**
- Muestra formulario de login
- No se ejecuta verificación OAuth

### 2. **Autenticado pero no autorizado OAuth**
- Muestra pantalla de autorización Gmail
- Botón "Autorizar Gmail" redirige a Google
- Botón "Verificar Estado" para comprobar nuevamente

### 3. **Autenticado y autorizado OAuth**
- Acceso completo al dashboard
- Todas las funcionalidades disponibles

### 4. **Procesando autorización**
- Pantalla de carga durante verificación
- Mensajes de estado durante proceso

## Componentes UI

### OAuthVerifier
- Envuelve toda la aplicación después del AuthProvider
- Verifica automáticamente el estado OAuth cuando el usuario está logueado
- Maneja el reenfoque de ventana después de OAuth

### Pantalla de Autorización
- Logo de la empresa
- Mensaje explicativo
- Botón de autorización con ícono de Google
- Botón de verificación manual

### Página de Callback
- Procesamiento automático de parámetros
- Estados visual (cargando, éxito, error)
- Redirección automática en caso de éxito
- Botones de acción en caso de error

## Variables de Entorno

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Testing

1. **Login normal** - Verifica que el login funcione
2. **Usuario no autorizado** - Debe mostrar pantalla de autorización
3. **Flujo OAuth completo** - Desde autorización hasta callback
4. **Usuario ya autorizado** - Debe ir directo al dashboard
5. **Errores de OAuth** - Manejo de errores de Google

## Logging y Debug

- Logs en consola para todos los pasos
- Parámetros de callback registrados
- Estado OAuth visible en desarrollo
- Errores capturados y mostrados al usuario
