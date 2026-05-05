import {
  getBrands,
  getCategories,
  getDeals,
  getFeaturedProducts,
  getNewArrivals,
} from '@/lib/api/public'
import InfoBar from '@/components/home/InfoBar'
import SiteHeader from '@/components/home/SiteHeader'
import CategoryBar from '@/components/home/CategoryBar'
import HeroCarousel from '@/components/home/HeroCarousel'
import CategoryGrid from '@/components/home/CategoryGrid'
import ProductSection from '@/components/home/ProductSection'
import PromoBanner from '@/components/home/PromoBanner'
import BrandStrip from '@/components/home/BrandStrip'
import TrustBadges from '@/components/home/TrustBadges'
import SiteFooter from '@/components/home/SiteFooter'
import PetMascot from '@/components/home/PetMascot'
import './home.css'

export const revalidate = 300

export default async function HomePage() {
  const [featured, newArrivals, deals, categories, brands] = await Promise.all([
    getFeaturedProducts(),
    getNewArrivals(),
    getDeals(),
    getCategories(),
    getBrands(),
  ])

  return (
    <>
      <InfoBar />
      <SiteHeader />
      <CategoryBar categories={categories} />
      <HeroCarousel />
      <main className="pt-page">
        <CategoryGrid categories={categories} />
        <ProductSection
          title="🔥 Çok Satanlar"
          href="/cok-satanlar"
          products={featured}
          emojiFallback="⭐"
        />
        <PromoBanner />
        <ProductSection
          title="✨ Yeni Gelenler"
          href="/yeni-gelenler"
          products={newArrivals}
          badge="new"
          emojiFallback="🆕"
        />
        <ProductSection
          title="💸 İndirimli Ürünler"
          href="/indirimli"
          products={deals}
          badge="sale"
          emojiFallback="🏷️"
        />
        <BrandStrip brands={brands} />
      </main>
      <TrustBadges />
      <SiteFooter />
      <PetMascot />
    </>
  )
}
