import type { Metadata } from 'next'
import { fetchFeaturedProducts, fetchDeals, fetchBestSellers, fetchNewArrivals, fetchActiveCampaigns, fetchSiteSettings } from '@/lib/api/server'
import { FALLBACK_SITE_SETTINGS } from '@/lib/fallbacks'
import HomePageClient from '@/components/home/HomePageClient'

export const revalidate = 3600

export const metadata: Metadata = {
  title: "PetToptan — Türkiye'nin Toptan Pet Mağazası",
  description: 'Türkiye genelinde evcil hayvan ürünleri toptan satış. Mama, aksesuar, sağlık ürünleri ve daha fazlası için en uygun toptan fiyatlar.',
  openGraph: {
    title: "PetToptan — Türkiye'nin Toptan Pet Mağazası",
    description: 'Türkiye genelinde evcil hayvan ürünleri toptan satış. B2B fiyatlar.',
  },
}

export default async function HomePage() {
  const [featured, deals, bestSellers, newArrivals, slides, settings] = await Promise.all([
    fetchFeaturedProducts(),
    fetchDeals(),
    fetchBestSellers(),
    fetchNewArrivals(),
    fetchActiveCampaigns(),
    fetchSiteSettings(),
  ])

  return (
    <HomePageClient
      featured={featured ?? []}
      deals={deals ?? []}
      bestSellers={bestSellers ?? []}
      newArrivals={newArrivals ?? []}
      slides={slides ?? []}
      settings={settings ?? FALLBACK_SITE_SETTINGS}
    />
  )
}
