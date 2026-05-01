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
    async signIn({ account, profile: _profile }) {
      if (account?.provider === 'google') {
        try {
          const res = await fetch(`${BASE_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: account.access_token }),
          })
          if (!res.ok) return false
          const json = await res.json()
          const tokens = unwrap<{ accessToken: string; refreshToken: string; user: User }>(json)
          ;(account as Record<string, unknown>).backendAccessToken = tokens.accessToken
          ;(account as Record<string, unknown>).backendRefreshToken = tokens.refreshToken
          ;(account as Record<string, unknown>).backendUser = tokens.user
        } catch {
          return false
        }
      }
      return true
    },

    async jwt({ token, account, user }) {
      if (account?.provider === 'google') {
        const acc = account as Record<string, unknown>
        token.accessToken = acc.backendAccessToken as string
        token.refreshToken = acc.backendRefreshToken as string
        token.backendUser = acc.backendUser as User
      }
      if (user && account?.provider === 'credentials') {
        const u = user as Record<string, unknown>
        token.accessToken = u.accessToken as string
        token.refreshToken = u.refreshToken as string
        token.backendUser = u.backendUser as User
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
