'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { saasApi, type ProductDto } from '@/lib/api/saas'
import toast from 'react-hot-toast'

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductDto[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    saasApi.listProducts(0, 100)
      .then(p => setProducts(p.content))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ürünler</h1>
        <Link
          href="/urunler/yeni"
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          + Yeni Ürün
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Yükleniyor…</p>
      ) : products.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-950">
          <p className="text-gray-500">Henüz ürün yok. İlk ürününüzü ekleyin.</p>
        </div>
      ) : (
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
              {products.map(p => {
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
                      <span className={`rounded-full px-2 py-0.5 text-xs ${p.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
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
      )}
    </div>
  )
}
