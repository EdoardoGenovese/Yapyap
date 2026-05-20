import { NextRequest, NextResponse } from 'next/server'

const publicRoutes = ['/login', '/register']

export function proxy(req: NextRequest) {
  const token = req.cookies.get('accessToken')?.value
  const pathname = req.nextUrl.pathname

  const isPublic = publicRoutes.some((route) => pathname.startsWith(route))

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}