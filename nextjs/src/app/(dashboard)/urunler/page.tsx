'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { saasApi, type ProductDto } from '@/lib/api/saas'
import toast from 'react-hot-toast'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 20

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<ProductDto[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    saasApi.listProducts(0, 1000)
      .then(p => setAllProducts(p.content))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allProducts
    return allProducts.filter(p =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    )
  }, [allProducts, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const visible = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  useEffect(() => { setPage(0) }, [search])

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" ürününü silmek istiyor musunuz?`)) return
    try {
      await saasApi.deleteProduct(id)
      toast.success('Ürün silindi')
      load()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Ürünler</h1>
        <Link
          href="/urunler/yeni"
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          + Yeni Ürün
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Ürün adı veya SKU ile ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Yükleniyor…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-950">
          <p className="text-gray-500">
            {search ? 'Aramaya uyan ürün yok.' : 'Henüz ürün yok. İlk ürününüzü ekleyin.'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3">Ad</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Fiyat</th>
                  <th className="px-4 py-3">Stok</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 w-32"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map(p => {
                  const available = p.stock - p.reserved
                  const low = available <= 5
                  return (
                    <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                      <td className="px-4 py-3">{p.price.toFixed(2)} ₺</td>
                      <td className={`px-4 py-3 font-semibold ${low ? 'text-amber-600' : ''}`}>
                        {available} {low && '⚠'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${p.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                          {p.active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/urunler/${p.id}`} className="text-sm text-sky-700 hover:underline">Düzenle</Link>
                        <button onClick={() => handleDelete(p.id, p.name)} className="ml-3 text-sm text-red-600 hover:underline">Sil</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Toplam {filtered.length} ürün — sayfa {safePage + 1}/{totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" /> Önceki
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage >= totalPages - 1}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  Sonraki <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
