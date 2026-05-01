import { fetchSiteSettings, fetchCategories } from '@/lib/api/server'
import { FALLBACK_SITE_SETTINGS } from '@/lib/fallbacks'
import InfoBar from '@/components/layout/InfoBar'
import Header from '@/components/layout/Header'
import CategoryBar from '@/components/layout/CategoryBar'
import Footer from '@/components/layout/Footer'
import PhoneGate from '@/components/auth/PhoneGate'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settingsData, categoriesData] = await Promise.all([
    fetchSiteSettings(),
    fetchCategories(),
  ])
  const settings = settingsData ?? FALLBACK_SITE_SETTINGS
  const categories = categoriesData ?? []

  return (
    <PhoneGate brandPart1={settings.brandPart1} brandPart2={settings.brandPart2}>
      <InfoBar settings={settings} />
      <Header settings={settings} categories={categories} />
      <CategoryBar categories={categories} />
      <main style={{ minHeight: 'calc(100vh - 148px)' }}>
        {children}
      </main>
      <Footer settings={settings} />
    </PhoneGate>
  )
}
