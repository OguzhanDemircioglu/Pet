import type { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'Giriş Yap',
  description: 'PetToptan hesabınıza giriş yapın veya ücretsiz üye olun.',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return <LoginClient />
}
