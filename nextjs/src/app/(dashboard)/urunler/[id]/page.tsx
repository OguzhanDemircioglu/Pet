'use client'
import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import ProductForm from '@/components/products/ProductForm'
import StockAdjustModal from '@/components/products/StockAdjustModal'
import { saasApi } from '@/lib/api/saas'
import toast from 'react-hot-toast'
import { History, SlidersHorizontal } from 'lucide-react'

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const productId = Number(id)
  const router = useRouter()
  const [stockModal, setStockModal] = useState(false)

  const { data: p, refetch, error: pErr } = useQuery({
    queryKey: ['saas', 'products', 'detail', productId],
    queryFn: () => saasApi.getProduct(productId),
    staleTime: 30_000,
  })

  // Bu ürüne ait audit geçmişi (PRO+) — hata olursa sessizce gizle
  const { data: history } = useQuery({
    queryKey: ['saas', 'audit', 'product', productId],
    queryFn: () => saasApi.listAudit({ resourceType: 'product', resourceId: productId, size: 30 }),
    staleTime: 30_000,
    enabled: !!p,
    retry: false,
  })

  if (pErr) return <p className="text-red-600">{(pErr as Error).message}</p>
  if (!p) return <p className="text-gray-500">Yükleniyor…</p>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{p.name}</h1>
          <p className="mt-1 font-mono text-xs text-gray-500">{p.sku}</p>
        </div>
        <button
          onClick={() => setStockModal(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <SlidersHorizontal className="h-4 w-4" /> Stok Ayarla
        </button>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
        <h2 className="mb-4 text-lg font-semibold">Düzenle</h2>
        <ProductForm
          initial={{ name: p.name, sku: p.sku, price: p.price, stock: p.stock, active: p.active }}
          showSku={false}
          showActive
          submitLabel="Güncelle"
          onSubmit={async (v) => {
            await saasApi.updateProduct(p.id, { name: v.name, price: v.price, stock: v.stock, active: v.active })
            toast.success('Güncellendi')
            router.push('/urunler')
          }}
        />
      </section>

      {history && history.content.length > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <History className="h-5 w-5 text-gray-500" /> Hareket Geçmişi
          </h2>
          <ul className="space-y-2 text-sm">
            {history.content.map(h => (
              <li key={h.id} className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2 last:border-0 dark:border-gray-800">
                <div>
                  <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-medium ${actionCls(h.action)}`}>
                    {actionLabel(h.action)}
                  </span>
                  <span className="font-mono text-xs text-gray-500">{h.details ?? ''}</span>
                </div>
                <span className="whitespace-nowrap text-xs text-gray-500">
                  {new Date(h.createdAt).toLocaleString('tr-TR')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stockModal && (
        <StockAdjustModal
          product={p}
          onClose={() => { setStockModal(false); refetch() }}
        />
      )}
    </div>
  )
}

function actionLabel(a: string): string {
  switch (a) {
    case 'PRODUCT_CREATE': return 'Eklendi'
    case 'PRODUCT_UPDATE': return 'Güncellendi'
    case 'PRODUCT_DELETE': return 'Silindi'
    case 'STOCK_ADJUST':   return 'Stok Hareketi'
    default: return a
  }
}

function actionCls(a: string): string {
  switch (a) {
    case 'PRODUCT_CREATE': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
    case 'PRODUCT_UPDATE': return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
    case 'PRODUCT_DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'STOCK_ADJUST':   return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}
