import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = ["/"]

export function middleware(request: NextRequest) {
  const token = request.cookies.get("btl_token")?.value
  const { pathname } = request.nextUrl
  const isPublicPath = PUBLIC_PATHS.includes(pathname)

  if (!token && !isPublicPath) {
    const loginUrl = new URL("/", request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (token && isPublicPath) {
    const dashboardUrl = new URL("/dashboard", request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Excluye assets estáticos, la API interna de Next y el favicon.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
