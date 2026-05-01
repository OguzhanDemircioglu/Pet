import { fetchSiteSettings } from '@/lib/api/server'
import { FALLBACK_SITE_SETTINGS } from '@/lib/fallbacks'
import InfoBar from '@/components/layout/InfoBar'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = (await fetchSiteSettings()) ?? FALLBACK_SITE_SETTINGS
  return (
    <>
      <InfoBar settings={settings} />
      <main>{children}</main>
    </>
  )
}
