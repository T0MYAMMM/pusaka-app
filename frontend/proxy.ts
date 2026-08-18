import { NextRequest, NextResponse } from 'next/server'

// Auth pages — redirect authenticated users away
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/accept-invite']

// Marketing / public pages — always accessible regardless of auth state
const MARKETING_PATHS = ['/', '/pricing']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value

  const isMarketing = MARKETING_PATHS.includes(pathname)
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p))

  // Marketing pages are always public
  if (isMarketing) return NextResponse.next()

  // Unauthenticated users can't access protected pages
  if (!token && !isAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Authenticated users don't need the auth pages
  if (token && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
