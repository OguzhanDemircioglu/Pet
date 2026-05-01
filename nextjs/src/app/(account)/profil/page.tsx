import type { Metadata } from 'next'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Hesabım',
  robots: { index: false, follow: false },
}

export default function ProfilePage() {
  return <ProfileClient />
}
