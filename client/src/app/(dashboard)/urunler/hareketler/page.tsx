'use client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { saasApi } from '@/lib/api/saas'
import { ChevronLeft, ChevronRight, ArrowDown, ArrowUp } from 'lucide-react'

const PAGE_SIZE = 50

export default function StockMovementsPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading, error } = useQuery({
    queryKey: ['saas', 'stock-movements', page],
    queryFn: () => saasApi.listAudit({
      page, size: PAGE_SIZE,
      action: 'STOCK_ADJUST',
      resourceType: 'product',
    }),
    staleTime: 30_000,
  })
  const logs = data?.content ?? []
  const totalPages = data?.totalPages ?? 1

  // details "delta=+5 8→13 note=geldi" formatından parse
  const parse = (details: string | null) => {
    if (!details) return { delta: '', oldStock: '', newStock: '', note: '' }
    const m = details.match(/delta=(-?\d+)\s+(\d+)→(\d+)(?:\s+note=(.*))?/)
    if (!m) return { delta: '', oldStock: '', newStock: '', note: details }
    return { delta: m[1], oldStock: m[2], newStock: m[3], note: m[4] ?? '' }
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/urunler" className="inline-flex items-center gap-1 text-sm text-sky-700 hover:underline">
          <ChevronLeft className="h-4 w-4" /> Ürünlere dön
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Stok Hareketleri</h1>
        <p className="mt-1 text-sm text-gray-500">Tüm ürünlerdeki manuel stok ekleme/düşme işlemleri (PRO+)</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-500">Yükleniyor…</p>
      ) : logs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-950">
          <p className="text-gray-500">Henüz stok hareketi kaydı yok.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Ürün</th>
                  <th className="px-4 py-3">Değişim</th>
                  <th className="px-4 py-3">Önce → Sonra</th>
                  <th className="px-4 py-3">Not</th>
                  <th className="px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const p = parse(log.details)
                  const deltaNum = Number(p.delta)
                  const positive = deltaNum > 0
                  return (
                    <tr key={log.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString('tr-TR')}
                      </td>
                      <td className="px-4 py-3">
                        {log.resourceId ? (
                          <Link href={`/urunler/${log.resourceId}`} className="font-mono text-xs text-sky-700 hover:underline">
                            #{log.resourceId}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {p.delta && (
                          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                            positive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {positive ? '+' : ''}{p.delta}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {p.oldStock && p.newStock ? `${p.oldStock} → ${p.newStock}` : '—'}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-xs text-gray-600 dark:text-gray-400" title={p.note}>
                        {p.note || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.ip ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Sayfa {page + 1}/{totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800">
                  <ChevronLeft className="h-4 w-4" /> Önceki
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800">
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
