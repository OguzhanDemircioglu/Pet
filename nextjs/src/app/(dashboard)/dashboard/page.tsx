'use client'
import { useEffect, useState } from 'react'
import StatCard from '@/components/dashboard/StatCard'
import { saasApi, type DashboardStats } from '@/lib/api/saas'
import { useSearchParams } from 'next/navigation'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const params = useSearchParams()
  const upgradeHint = params.get('upgrade') === '1'

  useEffect(() => {
    saasApi.dashboard().then(setStats).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="text-red-600">Hata: {error}</div>
  if (!stats) return <div className="text-gray-500">Yükleniyor…</div>

  const limitText = stats.productLimit < 0 ? 'sınırsız' : `/ ${stats.productLimit} limit`

  return (
    <div className="space-y-6">
      {upgradeHint && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Bu özellik için <strong>PRO</strong> plana yükseltme gereklidir.
        </div>
      )}

      <h1 className="text-2xl font-bold">Pano</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Toplam Ürün" value={stats.productCount} hint={limitText} />
        <StatCard label="Toplam Satış" value={stats.salesCount} />
        <StatCard label="Düşük Stok" value={stats.lowStock.length} tone={stats.lowStock.length > 0 ? 'warn' : 'default'} hint="≤ 5 adet" />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Düşük Stoklu Ürünler</h2>
        {stats.lowStock.length === 0 ? (
          <p className="text-sm text-gray-500">Tüm ürünler yeterli stokta.</p>
        ) : (
          <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm dark:border-gray-800 dark:bg-gray-950">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-2">Ürün</th>
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">Stok</th>
              </tr>
            </thead>
            <tbody>
              {stats.lowStock.map(p => (
                <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-2 font-semibold text-amber-700">{p.stock - p.reserved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Son Satışlar</h2>
        {stats.recentSales.length === 0 ? (
          <p className="text-sm text-gray-500">Henüz satış yok.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-950">
            {stats.recentSales.map(s => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="font-mono text-xs text-gray-500">{s.orderNumber}</div>
                  <div>{s.customerName ?? '—'} ({s.itemCount} kalem)</div>
                </div>
                <div className="font-semibold">{s.total.toFixed(2)} ₺</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
