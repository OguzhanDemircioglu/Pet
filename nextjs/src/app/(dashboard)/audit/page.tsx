'use client'
import { useQuery } from '@tanstack/react-query'
import { saasApi, type AuditLogDto } from '@/lib/api/saas'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

const ACTION_BADGE: Record<string, { label: string; cls: string }> = {
  PRODUCT_CREATE:      { label: 'Ürün ekle',        cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  PRODUCT_UPDATE:      { label: 'Ürün güncelle',    cls: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200' },
  PRODUCT_DELETE:      { label: 'Ürün sil',         cls: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  PRODUCT_BULK_IMPORT: { label: 'Toplu içe aktar',  cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  PRODUCT_BULK_UPDATE: { label: 'Toplu güncelle',   cls: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  STOCK_ADJUST:        { label: 'Stok ayarı',       cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  SALE_CREATE:         { label: 'Satış',            cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  USER_INVITE:         { label: 'Kullanıcı ekle',   cls: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200' },
  USER_DEACTIVATE:     { label: 'Kullanıcı pasif',  cls: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  PLAN_CHANGE:         { label: 'Plan değişimi',    cls: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  DATA_EXPORT:         { label: 'Veri export',      cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
}

const RESOURCE_OPTIONS = [
  { value: '', label: 'Tüm kaynaklar' },
  { value: 'product', label: 'Ürün' },
  { value: 'order', label: 'Satış' },
  { value: 'user', label: 'Kullanıcı' },
  { value: 'company', label: 'Şirket' },
]

const ACTION_OPTIONS = [
  { value: '', label: 'Tüm işlemler' },
  ...Object.entries(ACTION_BADGE).map(([k, v]) => ({ value: k, label: v.label })),
]

function badge(action: string) {
  return ACTION_BADGE[action] ?? { label: action, cls: 'bg-gray-100 text-gray-700' }
}

export default function AuditPage() {
  const [page, setPage] = useState(0)
  const [resourceType, setResourceType] = useState('')
  const [action, setAction] = useState('')
  const [applied, setApplied] = useState({ resourceType: '', action: '' })

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['saas', 'audit', page, applied.resourceType, applied.action],
    queryFn: () => saasApi.listAudit({
      page, size: 50,
      resourceType: applied.resourceType || undefined,
      action: applied.action || undefined,
    }),
    staleTime: 30_000,
  })

  const logs: AuditLogDto[] = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const hasFilter = applied.resourceType || applied.action

  const apply = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    setApplied({ resourceType, action })
  }
  const reset = () => {
    setResourceType(''); setAction('')
    setApplied({ resourceType: '', action: '' })
    setPage(0)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Aktivite Geçmişi</h1>
        <p className="mt-1 text-sm text-gray-500">İşletmenizdeki tüm değişikliklerin denetim kaydı (PRO+ özellik)</p>
      </div>

      <form onSubmit={apply} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        <Field label="Kaynak">
          <select value={resourceType} onChange={(e) => setResourceType(e.target.value)} className={input}>
            {RESOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="İşlem">
          <select value={action} onChange={(e) => setAction(e.target.value)} className={input}>
            {ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <button type="submit" className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
          Filtrele
        </button>
        {hasFilter && (
          <button type="button" onClick={reset}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <RotateCcw className="h-3.5 w-3.5" /> Temizle
          </button>
        )}
      </form>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-500">Yükleniyor…</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500">{hasFilter ? 'Filtrelere uyan kayıt yok.' : 'Henüz kayıt yok.'}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">İşlem</th>
                  <th className="px-4 py-3">Kaynak</th>
                  <th className="px-4 py-3">Detay</th>
                  <th className="px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const b = badge(log.action)
                  return (
                    <tr key={log.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString('tr-TR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.cls}`}>{b.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {log.resourceType && (
                          <>
                            <span className="text-gray-500">{log.resourceType}</span>
                            {log.resourceId && <span className="ml-1 font-mono text-gray-400">#{log.resourceId}</span>}
                          </>
                        )}
                      </td>
                      <td className="max-w-md truncate px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400" title={log.details ?? ''}>
                        {log.details ?? '—'}
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
              <span className="text-gray-500">
                Sayfa {page + 1}/{totalPages}
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
      )}
    </div>
  )
}

const input = 'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
      {children}
    </label>
  )
}
