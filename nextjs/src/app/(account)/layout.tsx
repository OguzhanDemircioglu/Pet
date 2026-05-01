import { fetchSiteSettings, fetchCategories } from '@/lib/api/server'
import { FALLBACK_SITE_SETTINGS } from '@/lib/fallbacks'
import InfoBar from '@/components/layout/InfoBar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [settingsData, categoriesData] = await Promise.all([
    fetchSiteSettings(),
    fetchCategories(),
  ])
  const settings = settingsData ?? FALLBACK_SITE_SETTINGS
  const categories = categoriesData ?? []

  return (
    <>
      <InfoBar settings={settings} />
      <Header settings={settings} categories={categories} />
      <main style={{ minHeight: 'calc(100vh - 148px)' }}>
        {children}
      </main>
      <Footer settings={settings} />
    </>
  )
}
