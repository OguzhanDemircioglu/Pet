'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { saasApi } from '@/lib/api/saas'

export default function SalesPage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['saas', 'sales'],
    queryFn: () => saasApi.listSales(0, 100),
    staleTime: 30_000,
  })
  const sales = data?.content ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Satışlar</h1>
        <Link href="/satislar/yeni" className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
          + Yeni Satış
        </Link>
      </div>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{(error as Error).message}</div>}
      {isLoading ? <p className="text-gray-500">Yükleniyor…</p> :
        sales.length === 0 ? <p className="text-gray-500">Henüz satış yok.</p> :
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Sipariş No</th>
                <th className="px-4 py-3">Müşteri</th>
                <th className="px-4 py-3">Kalem</th>
                <th className="px-4 py-3">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3">{new Date(s.createdAt).toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.orderNumber}</td>
                  <td className="px-4 py-3">{s.customerName ?? '—'}</td>
                  <td className="px-4 py-3">{s.itemCount}</td>
                  <td className="px-4 py-3 font-semibold">{s.total.toFixed(2)} ₺</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </div>
  )
}
