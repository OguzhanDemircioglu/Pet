'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saasApi, type ProductDto } from '@/lib/api/saas'
import toast from 'react-hot-toast'
import { swalError } from '@/lib/swal'

interface Line { productId: number; quantity: number }

export default function NewSalePage() {
  const router = useRouter()
  const [products, setProducts] = useState<ProductDto[]>([])
  const [customer, setCustomer] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    saasApi.listProducts(0, 100).then(p => setProducts(p.content))
  }, [])

  const addLine = () => setLines([...lines, { productId: products[0]?.id ?? 0, quantity: 1 }])
  const update = (i: number, l: Line) => setLines(lines.map((x, idx) => idx === i ? l : x))
  const remove = (i: number) => setLines(lines.filter((_, idx) => idx !== i))

  const total = lines.reduce((acc, l) => {
    const p = products.find(p => p.id === l.productId)
    return acc + (p ? p.price * l.quantity : 0)
  }, 0)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lines.length === 0) { swalError('En az bir ürün ekleyin'); return }
    setBusy(true)
    try {
      await saasApi.createSale({ customerName: customer || undefined, items: lines })
      toast.success('Satış kaydedildi')
      router.push('/satislar')
    } catch (e) {
      swalError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Yeni Satış</h1>
      <form onSubmit={submit} className="max-w-2xl space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Müşteri (opsiyonel)</span>
          <input value={customer} onChange={(e) => setCustomer(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900" />
        </label>

        <div className="space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={l.productId}
                onChange={(e) => update(i, { ...l, productId: Number(e.target.value) })}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (stok: {p.stock - p.reserved})</option>
                ))}
              </select>
              <input
                type="number" min="1"
                value={l.quantity}
                onChange={(e) => update(i, { ...l, quantity: Number(e.target.value) })}
                className="w-24 rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              />
              <button type="button" onClick={() => remove(i)} className="text-sm text-red-600">Sil</button>
            </div>
          ))}
          <button type="button" onClick={addLine} disabled={products.length === 0} className="text-sm text-sky-700 hover:underline disabled:opacity-50">
            + Ürün ekle
          </button>
        </div>

        <div className="border-t pt-3 text-right text-lg font-semibold">Toplam: {total.toFixed(2)} ₺</div>

        <button type="submit" disabled={busy || lines.length === 0} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
          {busy ? 'Kaydediliyor…' : 'Satışı Kaydet'}
        </button>
      </form>
    </div>
  )
}
