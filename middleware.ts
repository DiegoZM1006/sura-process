import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  console.log(`🔍 Middleware checking: ${pathname}, Token: ${token ? 'present' : 'missing'}`);

  // Rutas públicas que NO requieren autenticación
  const publicPaths = ['/'];

  // Verificar si la ruta actual es pública
  const isPublicPath = publicPaths.includes(pathname);

  console.log(`📍 Route analysis: isPublic: ${isPublicPath}`);

  // Si está en una ruta pública
  if (isPublicPath) {
    // Si tiene token y está en login, redirigir al dashboard
    if (token) {
      console.log(`↩️ Redirecting authenticated user from login to dashboard`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    console.log(`✅ Allowing access to public route: ${pathname}`);
    return NextResponse.next();
  }

  // Para TODAS las demás rutas (que no son públicas), verificar autenticación
  if (!token) {
    console.log(`🔒 Redirecting from protected route: ${pathname} to login`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Si tiene token, permitir acceso
  console.log(`✅ Allowing authenticated access to: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
