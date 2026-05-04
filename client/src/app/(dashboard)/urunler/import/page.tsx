'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saasApi, type BulkImportResult } from '@/lib/api/saas'
import { Upload, FileText, AlertCircle, CheckCircle2, PlusCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { swalError } from '@/lib/swal'

const SAMPLE_CREATE = `name,sku,price,stock
Royal Canin Kedi Maması 2kg,RC-CAT-2,189.90,42
"Whiskas Kuru Mama, 5kg",WHS-DRY-5,289.50,30
Pedigree Köpek Maması,PED-DOG-1,79.90,150`

const SAMPLE_UPDATE = `sku,price,stock
RC-CAT-2,199.90,55
WHS-DRY-5,,40
PED-DOG-1,89.90,`

type Mode = 'create' | 'update'

export default function ImportPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<Mode>('create')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<BulkImportResult | null>(null)

  const importMut = useMutation({
    mutationFn: (file: File) => mode === 'create' ? saasApi.importProductsCsv(file) : saasApi.updateProductsCsv(file),
    onSuccess: (r) => {
      setResult(r)
      qc.invalidateQueries({ queryKey: ['saas'] })
      const verb = mode === 'create' ? 'eklendi' : 'güncellendi'
      if (r.createdCount > 0) toast.success(`${r.createdCount} ürün ${verb}`)
    },
    onError: (e) => swalError((e as Error).message),
  })

  const downloadSample = () => {
    const sample = mode === 'create' ? SAMPLE_CREATE : SAMPLE_UPDATE
    const filename = mode === 'create' ? 'pettoptan-yeni-urunler.csv' : 'pettoptan-guncelle.csv'
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) { swalError('CSV dosyası seçin'); return }
    importMut.mutate(selectedFile)
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setSelectedFile(null)
    setResult(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Toplu CSV İşlem</h1>
        <p className="mt-1 text-sm text-gray-500">Yeni ürünleri içe aktar veya mevcut ürünleri SKU bazlı güncelle</p>
      </div>

      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-950">
        <button
          onClick={() => switchMode('create')}
          className={`inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === 'create' ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          <PlusCircle className="h-4 w-4" /> Yeni Ürün Ekle
        </button>
        <button
          onClick={() => switchMode('update')}
          className={`inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === 'update' ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          <RefreshCw className="h-4 w-4" /> Mevcut Ürünleri Güncelle
        </button>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        <h2 className="mb-3 text-lg font-semibold">Format</h2>
        {mode === 'create' ? (
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            UTF-8, başlık satırı zorunlu (<code>name,sku,price,stock</code>). Ayraç: virgül veya noktalı virgül.
            Maksimum 1000 satır. Aynı SKU varsa atlanır.
          </p>
        ) : (
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            <code>sku</code> sütunu zorunlu, diğer sütunlar opsiyonel. Boş bırakılan alanlar mevcut değeri korur.
            Sadece sizin ürünleriniz güncellenir (cross-tenant koruma).
          </p>
        )}
        <pre className="overflow-x-auto rounded bg-gray-50 p-3 font-mono text-xs dark:bg-gray-900">
          {mode === 'create' ? SAMPLE_CREATE : SAMPLE_UPDATE}
        </pre>
        <button onClick={downloadSample} className="mt-3 inline-flex items-center gap-1.5 text-sm text-sky-700 hover:underline">
          <FileText className="h-4 w-4" /> Örnek CSV indir
        </button>
      </section>

      <form onSubmit={submit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-center gap-3">
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => { setSelectedFile(e.target.files?.[0] ?? null); setResult(null) }}
            className="block text-sm file:mr-4 file:rounded-md file:border-0 file:bg-red-600 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-red-700"
          />
        </div>
        {selectedFile && (
          <p className="text-sm text-gray-500">
            Seçilen: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
        <button
          type="submit"
          disabled={!selectedFile || importMut.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {importMut.isPending ? 'İşleniyor…' : (mode === 'create' ? 'Yeni Ürünleri Yükle' : 'Mevcut Ürünleri Güncelle')}
        </button>
        <Link href="/urunler" className="ml-3 text-sm text-gray-500 hover:underline">İptal</Link>
      </form>

      {result && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-4 text-lg font-semibold">Sonuç</h2>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Toplam Satır" value={result.totalRows} />
            <Stat label={mode === 'create' ? 'Eklenen' : 'Güncellenen'} value={result.createdCount} tone="success" />
            <Stat label="Atlanan" value={result.skippedCount} tone={result.skippedCount > 0 ? 'warn' : 'default'} />
          </div>

          {result.errors.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                <AlertCircle className="h-4 w-4" /> Atlanan satırlar ({result.errors.length})
              </h3>
              <ul className="max-h-64 space-y-1 overflow-y-auto rounded border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-900 dark:bg-amber-950/40">
                {result.errors.map((e, i) => (
                  <li key={i} className="font-mono">
                    <span className="text-amber-700">satır {e.row}:</span> {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.createdCount > 0 && (
            <button
              onClick={() => router.push('/urunler')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" /> Ürün listesine git
            </button>
          )}
        </section>
      )}
    </div>
  )
}

function Stat({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'success' | 'warn' }) {
  const cls = tone === 'success' ? 'text-emerald-600' : tone === 'warn' ? 'text-amber-600' : 'text-gray-900 dark:text-gray-100'
  return (
    <div className="rounded-lg border border-gray-100 p-3 text-center dark:border-gray-800">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${cls}`}>{value}</div>
    </div>
  )
}
