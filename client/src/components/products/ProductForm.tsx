'use client'
import { useState } from 'react'

export interface ProductFormValues {
  name: string
  sku?: string
  price: number
  stock: number
  active?: boolean
}

interface Props {
  initial?: Partial<ProductFormValues>
  showSku?: boolean
  showActive?: boolean
  submitLabel?: string
  onSubmit: (values: ProductFormValues) => Promise<void>
}

export default function ProductForm({ initial, showSku = true, showActive = false, submitLabel = 'Kaydet', onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [sku, setSku] = useState(initial?.sku ?? '')
  const [price, setPrice] = useState<number>(initial?.price ?? 0)
  const [stock, setStock] = useState<number>(initial?.stock ?? 0)
  const [active, setActive] = useState<boolean>(initial?.active ?? true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setErr('Ad zorunlu')
    if (showSku && !sku.trim()) return setErr('SKU zorunlu')
    setErr(null)
    setBusy(true)
    try {
      await onSubmit({ name, sku: showSku ? sku : undefined, price: Number(price), stock: Number(stock), active: showActive ? active : undefined })
    } catch {
      // API errors are surfaced by the caller via Swal — keep this banner for
      // client-side validation only (e.g. "Ad zorunlu") so we don't show the
      // same message twice.
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handle} className="max-w-xl space-y-4">
      {err && <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      <Field label="Ad">
        <input value={name} onChange={(e) => setName(e.target.value)} className={input} maxLength={255} />
      </Field>
      {showSku && (
        <Field label="SKU">
          <input value={sku} onChange={(e) => setSku(e.target.value)} className={input + ' font-mono'} maxLength={100} />
        </Field>
      )}
      <Field label="Fiyat (₺)">
        <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(Number(e.target.value))} className={input} />
      </Field>
      <Field label="Stok (adet)">
        <input type="number" min="0" value={stock} onChange={(e) => setStock(Number(e.target.value))} className={input} />
      </Field>
      {showActive && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Aktif
        </label>
      )}
      <button type="submit" disabled={busy} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
        {busy ? 'Kaydediliyor…' : submitLabel}
      </button>
    </form>
  )
}

const input = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </label>
  )
}
