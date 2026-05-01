import type { Metadata } from 'next'
import { fetchPublicCatalog, fetchCategories } from '@/lib/api/server'
import ProductListClient from '@/components/product/ProductListClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tüm Ürünler',
  description: 'Evcil hayvan ürünleri toptan satış kataloğu. Mama, aksesuar, sağlık ve bakım ürünleri.',
}

export default async function ProductsPage() {
  const [catalog, categories] = await Promise.all([
    fetchPublicCatalog(),
    fetchCategories(),
  ])

  return <ProductListClient products={catalog?.products ?? []} categories={categories ?? []} />
}
