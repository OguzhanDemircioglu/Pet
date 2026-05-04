import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import type { User } from '@/types'

const BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Backend access token: 15 dk TTL. 60s headroom — refresh kicks in at minute 14
// to absorb clock skew + the round-trip latency of the refresh call itself.
const ACCESS_TOKEN_TTL_MS = 14 * 60 * 1000

function unwrap<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  if (d && typeof d === 'object' && 'success' in d) {
    return (d.data ?? d) as T
  }
  return data as T
}

type TokenPair = { accessToken: string; refreshToken: string; user: User }

// Calls backend POST /auth/refresh and returns a fresh token bundle. Backend
// rotates the refresh token (old one revoked), so we replace both. Failure
// (network error or revoked refresh token) marks the JWT with an error so the
// client side interceptor signs the user out cleanly instead of pretending the
// session is still valid.
async function refreshAccessToken(token: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    })
    if (!res.ok) throw new Error(`refresh ${res.status}`)
    const json = await res.json()
    const tokens = unwrap<TokenPair>(json)
    if (!tokens.accessToken) throw new Error('refresh empty')
    return {
      ...token,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? token.refreshToken,
      accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL_MS,
      backendUser: tokens.user,
      error: undefined,
    }
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Production'da NEXTAUTH_URL set edilmeli; trustHost reverse-proxy
  // (Vercel, Nginx) arkasında doğru host header'ı kabul eder.
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-posta', type: 'email' },
        password: { label: 'Şifre', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          })
          if (!res.ok) return null
          const json = await res.json()
          const tokens = unwrap<{ accessToken: string; refreshToken: string; user: User }>(json)
          if (!tokens.accessToken) return null
          return {
            id: String(tokens.user.id),
            email: tokens.user.email,
            name: `${tokens.user.firstName} ${tokens.user.lastName}`,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            backendUser: tokens.user,
          }
        } catch {
          return null
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, account, user, trigger }) {
      // Google ilk login: Google access_token'ı backend /auth/google'a değiş, kendi JWT'mizi al.
      if (account?.provider === 'google' && account.access_token) {
        try {
          const res = await fetch(`${BASE_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: account.access_token }),
          })
          if (res.ok) {
            const json = await res.json()
            const tokens = unwrap<TokenPair>(json)
            token.accessToken = tokens.accessToken
            token.refreshToken = tokens.refreshToken
            token.backendUser = tokens.user
            token.accessTokenExpires = Date.now() + ACCESS_TOKEN_TTL_MS
          } else {
            console.error('[auth.jwt] backend /auth/google başarısız:', res.status)
          }
        } catch (err) {
          console.error('[auth.jwt] backend exchange exception:', err)
        }
      }
      if (user && account?.provider === 'credentials') {
        const u = user as Record<string, unknown>
        token.accessToken = u.accessToken as string
        token.refreshToken = u.refreshToken as string
        token.backendUser = u.backendUser as User
        token.accessTokenExpires = Date.now() + ACCESS_TOKEN_TTL_MS
      }
      // Client `update()` çağrısı: backend'den fresh user çek.
      if (trigger === 'update' && token.accessToken) {
        try {
          const res = await fetch(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token.accessToken as string}` },
          })
          if (res.ok) {
            const json = await res.json()
            token.backendUser = unwrap<User>(json)
          }
        } catch { /* token eski haliyle kalsın */ }
      }
      // Auto-refresh: access token TTL bitmek üzereyse refresh akışını çalıştır.
      // Initial sign-in (henüz expires set değil) ve update trigger'ı yukarıda
      // halledildi; bu blok sonraki request'lerde devreye girer.
      const expires = token.accessTokenExpires as number | undefined
      if (token.accessToken && expires && Date.now() >= expires) {
        return await refreshAccessToken(token)
      }
      return token
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      const u = token.backendUser as User
      if (u) {
        session.user = { ...session.user, ...u, id: String(u.id) } as typeof session.user
        ;(session as unknown as Record<string, unknown>).companyId = u.companyId
        ;(session as unknown as Record<string, unknown>).plan = u.plan
      }
      // Refresh failed → propagate so client interceptor can sign user out.
      if (token.error) {
        ;(session as unknown as Record<string, unknown>).error = token.error
      }
      return session
    },
  },

  pages: {
    signIn: '/giris',
  },

  session: { strategy: 'jwt' },
})
