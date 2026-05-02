'use client'
import { use } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { saasApi } from '@/lib/api/saas'
import { ChevronLeft, Receipt } from 'lucide-react'

export default function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: s, error, isLoading } = useQuery({
    queryKey: ['saas', 'sales', 'detail', id],
    queryFn: () => saasApi.getSale(Number(id)),
    staleTime: 60_000,
  })

  if (isLoading) return <p className="text-gray-500">Yükleniyor…</p>
  if (error || !s) return (
    <div className="space-y-4">
      <Link href="/satislar" className="inline-flex items-center gap-1 text-sm text-sky-700 hover:underline">
        <ChevronLeft className="h-4 w-4" /> Satışlara dön
      </Link>
      <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
        {error ? (error as Error).message : 'Satış bulunamadı'}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <Link href="/satislar" className="inline-flex items-center gap-1 text-sm text-sky-700 hover:underline">
        <ChevronLeft className="h-4 w-4" /> Satışlara dön
      </Link>

      <div className="flex items-center gap-3">
        <Receipt className="h-7 w-7 text-red-600" />
        <h1 className="text-2xl font-bold">Satış Detayı</h1>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">Sipariş</h2>
          <Row label="Sipariş No" value={s.orderNumber} mono />
          <Row label="Tarih" value={new Date(s.createdAt).toLocaleString('tr-TR')} />
          <Row label="Müşteri" value={s.customerName ?? '—'} />
          <Row label="Kalem Sayısı" value={String(s.itemCount)} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">Tutar</h2>
          <div className="text-3xl font-bold text-red-600">{s.total.toFixed(2)} ₺</div>
          <p className="mt-1 text-xs text-gray-500">Toplam {s.itemCount} kalem ürün</p>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <h2 className="border-b border-gray-100 px-5 py-3 text-lg font-semibold dark:border-gray-800">Kalemler</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900">
            <tr>
              <th className="px-5 py-2">Ürün</th>
              <th className="px-5 py-2">Adet</th>
              <th className="px-5 py-2">Birim Fiyat</th>
              <th className="px-5 py-2 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {s.items.map((it, i) => (
              <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-5 py-3 font-medium">{it.name}</td>
                <td className="px-5 py-3">{it.qty}</td>
                <td className="px-5 py-3">{it.unitPrice.toFixed(2)} ₺</td>
                <td className="px-5 py-3 text-right font-semibold">{it.lineTotal.toFixed(2)} ₺</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
            <tr>
              <td colSpan={3} className="px-5 py-3 text-right font-semibold">Toplam</td>
              <td className="px-5 py-3 text-right text-lg font-bold">{s.total.toFixed(2)} ₺</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <button onClick={() => window.print()}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
        🖨 Yazdır
      </button>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-2 last:border-0 dark:border-gray-800">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className={`text-sm ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  )
}
