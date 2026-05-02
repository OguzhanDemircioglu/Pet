'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saasApi, type ProductDto } from '@/lib/api/saas'
import { Plus, Minus, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  product: ProductDto
  onClose: () => void
}

export default function StockAdjustModal({ product, onClose }: Props) {
  const qc = useQueryClient()
  const [delta, setDelta] = useState<number>(0)
  const [note, setNote] = useState('')
  const available = product.stock - product.reserved

  const mut = useMutation({
    mutationFn: () => saasApi.adjustStock(product.id, delta, note || undefined),
    onSuccess: () => {
      toast.success(delta >= 0 ? `+${delta} stok eklendi` : `${delta} stok düşüldü`)
      qc.invalidateQueries({ queryKey: ['saas'] })
      onClose()
    },
    onError: (e) => toast.error((e as Error).message),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (delta === 0) return toast.error('Değişim 0 olamaz')
    mut.mutate()
  }

  const projected = product.stock + delta
  const overflow = projected < 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-950"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="stock-modal-title"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-800">
          <h2 id="stock-modal-title" className="font-semibold">Stok Ayarla</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Kapat">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="font-mono text-xs text-gray-500">{product.sku}</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Mevcut stok: <strong>{product.stock}</strong>{product.reserved > 0 && ` (rezerve: ${product.reserved}, kullanılabilir: ${available})`}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Değişim</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDelta(d => d - 1)}
                className="rounded-md border border-gray-300 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                aria-label="Azalt"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-center font-mono text-lg dark:border-gray-700 dark:bg-gray-900"
              />
              <button
                type="button"
                onClick={() => setDelta(d => d + 1)}
                className="rounded-md border border-gray-300 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                aria-label="Artır"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {[5, 10, 50, 100].map(n => (
                <button
                  key={`p${n}`}
                  type="button"
                  onClick={() => setDelta(d => d + n)}
                  className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200"
                >+{n}</button>
              ))}
              {[-5, -10].map(n => (
                <button
                  key={`m${n}`}
                  type="button"
                  onClick={() => setDelta(d => d + n)}
                  className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200"
                >{n}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Not (opsiyonel)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="örn. tedarikçiden geldi, fire vb."
              maxLength={500}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>

          <div className={`rounded-md border px-3 py-2 text-sm ${overflow ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'}`}>
            Yeni stok: <strong>{projected}</strong>
            {overflow && <span className="ml-2">— eksiye düşemez!</span>}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
              İptal
            </button>
            <button type="submit" disabled={mut.isPending || delta === 0 || overflow}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
              {mut.isPending ? 'Kaydediliyor…' : 'Uygula'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
