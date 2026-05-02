import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface ProductDto {
  id: number
  name: string
  sku: string
  price: number
  stock: number
  reserved: number
  active: boolean
}

interface PublicShop {
  name: string
  slug: string
  products: ProductDto[]
}

async function fetchShop(slug: string): Promise<PublicShop | null> {
  try {
    const res = await fetch(`${BASE_URL}/public/shop/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const json = await res.json()
    return (json?.data ?? json) as PublicShop
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const shop = await fetchShop(slug)
  return { title: shop ? `${shop.name} — Vitrin` : 'Vitrin bulunamadı' }
}

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const shop = await fetchShop(slug)
  if (!shop) notFound()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-800">
        <h1 className="text-4xl font-bold">{shop.name}</h1>
        <p className="mt-1 text-sm text-gray-500">/{shop.slug}</p>
      </header>

      {shop.products.length === 0 ? (
        <p className="text-gray-500">Henüz ürün yok.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shop.products.map(p => {
            const inStock = p.stock - p.reserved > 0
            return (
              <li key={p.id} className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="mt-1 font-mono text-xs text-gray-500">{p.sku}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xl font-bold text-red-600">{Number(p.price).toFixed(2)} ₺</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                    {inStock ? 'Stokta' : 'Tükendi'}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <footer className="mt-12 text-center text-xs text-gray-400">
        PetToptan SaaS ile oluşturuldu
      </footer>
    </div>
  )
}
