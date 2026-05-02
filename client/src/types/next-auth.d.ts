import type { User } from './index'

declare module 'next-auth' {
  interface Session {
    accessToken: string
    user: User & { id: string }
  }
  interface JWT {
    accessToken: string
    refreshToken: string
    user: User
  }
}
