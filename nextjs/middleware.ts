import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const protectedPaths = ['/profil']

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const isLoggedIn = !!session?.user

  const isProtected = protectedPaths.some(p => nextUrl.pathname.startsWith(p))

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/giris', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.svg|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)'],
}
