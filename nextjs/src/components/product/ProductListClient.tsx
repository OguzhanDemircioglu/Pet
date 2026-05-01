'use client'
import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ProductCard from './ProductCard'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { CatalogProduct, Category } from '@/types'

interface Props {
  products: CatalogProduct[]
  categories: Category[]
}

export default function ProductListClient({ products, categories }: Props) {
  const isMobile = useIsMobile()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slugParam = searchParams.get('slug') || searchParams.get('kategori') || ''
  const query = searchParams.get('q') || ''
  const [sort, setSort] = useState('default')

  const currentCat = useMemo(
    () => categories.find(c => c.category_slug === slugParam) ?? null,
    [categories, slugParam]
  )
  const parentCat = useMemo(
    () => (currentCat?.parent_id != null ? categories.find(c => c.category_id === currentCat!.parent_id) ?? null : null),
    [categories, currentCat]
  )

  const filtered = useMemo(() => {
    let list = products

    if (slugParam && currentCat) {
      list = list.filter(p => p.categoryId === currentCat.category_id)
    }

    if (query) {
      const q = query.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.brandName?.toLowerCase().includes(q) ?? false)
      )
    }

    if (sort === 'price_asc') list = [...list].sort((a, b) => a.basePrice - b.basePrice)
    else if (sort === 'price_desc') list = [...list].sort((a, b) => b.basePrice - a.basePrice)
    else if (sort === 'name_asc') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'tr'))

    return list
  }, [products, slugParam, currentCat, query, sort])

  const pageTitle = query
    ? `"${query}" için sonuçlar`
    : currentCat ? currentCat.category_name
    : 'Tüm Ürünler'

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '0 12px' : '0 24px' }}>

        <nav style={{ padding: '16px 0 10px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Link href="/" style={{ fontSize: 13, color: 'var(--text2)' }}>Ana Sayfa</Link>
          {parentCat && (
            <>
              <span style={{ color: 'var(--text3)', fontSize: 11 }}>›</span>
              <Link href={`/urunler?slug=${parentCat.category_slug}`} style={{ fontSize: 13, color: 'var(--text2)' }}>
                {parentCat.category_name}
              </Link>
            </>
          )}
          {currentCat ? (
            <>
              <span style={{ color: 'var(--text3)', fontSize: 11 }}>›</span>
              <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{currentCat.category_name}</span>
            </>
          ) : (
            <>
              <span style={{ color: 'var(--text3)', fontSize: 11 }}>›</span>
              <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{pageTitle}</span>
            </>
          )}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 10, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
              {currentCat?.emoji ? `${currentCat.emoji} ` : ''}{pageTitle}
            </h1>
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>{filtered.length} ürün bulundu</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Sırala:</label>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{
              height: 36, border: '1.5px solid var(--border)', borderRadius: 'var(--r)',
              background: 'var(--bg2)', color: 'var(--text)', fontSize: 13,
              padding: '0 10px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <option value="default">Önerilen</option>
              <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
              <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
              <option value="name_asc">İsim A-Z</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Ürün bulunamadı</div>
            <div style={{ fontSize: 14, color: 'var(--text2)' }}>Farklı bir arama deneyin veya filtreleri temizleyin.</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)',
            gap: isMobile ? 10 : 16,
            paddingBottom: 40,
          }}>
            {filtered.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
