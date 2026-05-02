'use client'
import { useQuery } from '@tanstack/react-query'
import { saasApi, type AuditLogDto } from '@/lib/api/saas'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const ACTION_BADGE: Record<string, { label: string; cls: string }> = {
  PRODUCT_CREATE:    { label: 'Ürün ekle',     cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  PRODUCT_UPDATE:    { label: 'Ürün güncelle', cls: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200' },
  PRODUCT_DELETE:    { label: 'Ürün sil',      cls: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  SALE_CREATE:       { label: 'Satış',         cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  USER_INVITE:       { label: 'Kullanıcı ekle',cls: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200' },
  USER_DEACTIVATE:   { label: 'Kullanıcı pasif', cls: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  PLAN_CHANGE:       { label: 'Plan değişimi', cls: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
}

function badge(action: string) {
  return ACTION_BADGE[action] ?? { label: action, cls: 'bg-gray-100 text-gray-700' }
}

export default function AuditPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading, error } = useQuery({
    queryKey: ['saas', 'audit', page],
    queryFn: () => saasApi.listAudit(page, 50),
    staleTime: 30_000,
  })

  const logs: AuditLogDto[] = data?.content ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Aktivite Geçmişi</h1>
        <p className="mt-1 text-sm text-gray-500">İşletmenizdeki tüm değişikliklerin denetim kaydı (PRO+ özellik)</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-500">Yükleniyor…</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500">Henüz kayıt yok.</p>
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
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.cls}`}>
                          {b.label}
                        </span>
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
              <span className="text-gray-500">Sayfa {page + 1}/{totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" /> Önceki
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
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
