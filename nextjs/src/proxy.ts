import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const dashboardPaths = ['/dashboard', '/urunler', '/satislar', '/kullanicilar', '/audit', '/ayarlar']
// Auth'suz public sayfalar — giriş'liyken bu sayfaları görenler /dashboard'a yönlendirilir
const authOnlyVisitorPaths = ['/giris', '/kayit', '/sifre-unuttum']
// /sifre-sifirla?token=... emaildeki linkten geldiği için auth'lu da görebilir, redirect etme

const proPaths = ['/satislar', '/kullanicilar', '/audit']
const proPlusPaths = ['/shop-settings']

function startsWithAny(path: string, list: string[]) {
  return list.some(p => path === p || path.startsWith(p + '/'))
}

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth as unknown as
    | { user?: unknown; plan?: 'FREE' | 'PRO' | 'PRO_PLUS' | null }
    | null
  const isLoggedIn = !!session?.user
  const plan = session?.plan ?? null
  const path = nextUrl.pathname

  if (isLoggedIn && startsWithAny(path, authOnlyVisitorPaths)) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  if (startsWithAny(path, dashboardPaths) && !isLoggedIn) {
    const url = new URL('/giris', nextUrl)
    url.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(url)
  }

  if (isLoggedIn && startsWithAny(path, proPaths) && plan === 'FREE') {
    const url = new URL('/dashboard', nextUrl)
    url.searchParams.set('upgrade', '1')
    return NextResponse.redirect(url)
  }

  if (isLoggedIn && startsWithAny(path, proPlusPaths) && plan !== 'PRO_PLUS') {
    const url = new URL('/dashboard', nextUrl)
    url.searchParams.set('upgrade', '1')
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.svg|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)'],
}
