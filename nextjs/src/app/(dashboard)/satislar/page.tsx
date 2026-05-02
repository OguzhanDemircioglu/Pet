'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { saasApi } from '@/lib/api/saas'
import { Search, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

const PAGE_SIZE = 20

export default function SalesPage() {
  const [page, setPage] = useState(0)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [q, setQ] = useState('')
  const [appliedQ, setAppliedQ] = useState({ from: '', to: '', q: '' })

  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: ['saas', 'sales', page, appliedQ.from, appliedQ.to, appliedQ.q],
    queryFn: () => saasApi.searchSales({
      page, size: PAGE_SIZE,
      from: appliedQ.from || undefined,
      to: appliedQ.to || undefined,
      q: appliedQ.q || undefined,
    }),
    staleTime: 30_000,
  })
  const sales = data?.content ?? []
  const totalPages = data?.totalPages ?? 1

  const apply = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    setAppliedQ({ from, to, q })
  }
  const reset = () => {
    setFrom(''); setTo(''); setQ('')
    setAppliedQ({ from: '', to: '', q: '' })
    setPage(0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Satışlar</h1>
        <Link href="/satislar/yeni" className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
          + Yeni Satış
        </Link>
      </div>

      <form onSubmit={apply} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        <Field label="Başlangıç">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
        </Field>
        <Field label="Bitiş">
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={input} />
        </Field>
        <Field label="Müşteri / Sipariş No" wide>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ali, PT24..." className={`${input} pl-9 w-full`} />
          </div>
        </Field>
        <button type="submit" className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
          Filtrele
        </button>
        {(appliedQ.from || appliedQ.to || appliedQ.q) && (
          <button type="button" onClick={reset}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <RotateCcw className="h-3.5 w-3.5" /> Temizle
          </button>
        )}
      </form>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{(error as Error).message}</div>}

      {isLoading ? <p className="text-gray-500">Yükleniyor…</p> :
        sales.length === 0 ? (
          <p className="text-gray-500">{appliedQ.from || appliedQ.to || appliedQ.q ? 'Filtrelere uyan satış yok.' : 'Henüz satış yok.'}</p>
        ) :
        <>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Toplam {data?.totalElements ?? 0} satış — sayfa {page + 1}/{totalPages}
                {isFetching && <span className="ml-2 italic text-gray-400">güncelleniyor…</span>}
              </span>
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
      }
    </div>
  )
}

const input = 'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900'

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? 'flex-1 min-w-[200px]' : ''}>
      <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
      {children}
    </label>
  )
}
