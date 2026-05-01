import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import type { User } from '@/types'

const BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

function unwrap<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  if (d && typeof d === 'object' && 'success' in d) {
    return (d.data ?? d) as T
  }
  return data as T
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
          console.log('[auth.jwt] google → backend exchange başlıyor')
          const res = await fetch(`${BASE_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: account.access_token }),
          })
          console.log('[auth.jwt] backend /auth/google status:', res.status)
          if (res.ok) {
            const json = await res.json()
            const tokens = unwrap<{ accessToken: string; refreshToken: string; user: User }>(json)
            token.accessToken = tokens.accessToken
            token.refreshToken = tokens.refreshToken
            token.backendUser = tokens.user
            console.log('[auth.jwt] backend tokens alındı, accessToken length:', tokens.accessToken?.length, 'phone:', tokens.user?.phone)
          } else {
            const text = await res.text().catch(() => '')
            console.error('[auth.jwt] backend /auth/google başarısız:', text.slice(0, 200))
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
      }
      // Client `update()` çağrısı: backend'den fresh user çek, token'ı yenile.
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
      return token
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      const u = token.backendUser as User
      if (u) {
        session.user = { ...session.user, ...u, id: String(u.id) } as typeof session.user
      }
      return session
    },
  },

  pages: {
    signIn: '/giris',
  },

  session: { strategy: 'jwt' },
})
