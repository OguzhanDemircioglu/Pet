'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { saasApi, type ApiKeyDto } from '@/lib/api/saas'
import toast from 'react-hot-toast'
import { swalError } from '@/lib/swal'
import { KeyRound, Copy, AlertTriangle, Check } from 'lucide-react'

export default function ApiKeysPage() {
  const qc = useQueryClient()
  const { data: keys, isLoading } = useQuery({
    queryKey: ['saas', 'api-keys'],
    queryFn: () => saasApi.listApiKeys(),
    staleTime: 30_000,
  })

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState('')
  const [newKey, setNewKey] = useState<{ key: ApiKeyDto; plaintext: string } | null>(null)

  const createMut = useMutation({
    mutationFn: () => saasApi.createApiKey({ name, scopes: scopes || undefined }),
    onSuccess: (res) => {
      setNewKey(res)
      setShowCreate(false)
      setName(''); setScopes('')
      qc.invalidateQueries({ queryKey: ['saas', 'api-keys'] })
    },
    onError: (e) => swalError((e as Error).message),
  })

  const revokeMut = useMutation({
    mutationFn: (id: number) => saasApi.revokeApiKey(id),
    onSuccess: () => {
      toast.success('Anahtar iptal edildi')
      qc.invalidateQueries({ queryKey: ['saas', 'api-keys'] })
    },
    onError: (e) => swalError((e as Error).message),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Anahtarları</h1>
          <p className="mt-1 text-sm text-gray-500">
            Webhook ve 3. taraf entegrasyonlar için anahtar oluştur
          </p>
        </div>
        {!showCreate && !newKey && (
          <button onClick={() => setShowCreate(true)}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            + Yeni Anahtar
          </button>
        )}
      </div>

      {newKey && (
        <section className="rounded-lg border-2 border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-950/40">
          <div className="mb-3 flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">Anahtar bir kez gösteriliyor</h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Bu sayfayı kapattıktan sonra anahtarın tamamına erişemezsiniz. Lütfen güvenli bir yere kopyalayın.
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-md bg-white p-3 dark:bg-gray-950">
            <code className="flex-1 break-all font-mono text-sm">{newKey.plaintext}</code>
            <CopyButton value={newKey.plaintext} />
          </div>
          <button onClick={() => setNewKey(null)}
            className="mt-3 text-sm text-amber-900 hover:underline dark:text-amber-200">
            Anladım, kopyaladım — bu kutuyu kapat
          </button>
        </section>
      )}

      {showCreate && (
        <form
          onSubmit={(e) => { e.preventDefault(); createMut.mutate() }}
          className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950"
        >
          <label className="block">
            <span className="mb-1 block text-sm font-medium">İsim</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120}
              placeholder="Zapier, POS Cihazı, vb"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">İzinler (opsiyonel)</span>
            <input value={scopes} onChange={(e) => setScopes(e.target.value)} maxLength={500}
              placeholder="products:read,sales:write"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono dark:border-gray-700 dark:bg-gray-900" />
            <span className="mt-1 block text-xs text-gray-500">Virgülle ayrılmış izin etiketleri (ileri kullanım için)</span>
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={createMut.isPending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
              {createMut.isPending ? 'Oluşturuluyor…' : 'Oluştur'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
              İptal
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-500">Yükleniyor…</p>
      ) : !keys || keys.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-950">
          <KeyRound className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="text-gray-500">Henüz API anahtarı oluşturulmadı.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3">İsim</th>
                <th className="px-4 py-3">Anahtar</th>
                <th className="px-4 py-3">İzinler</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Oluşturulma</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 font-medium">{k.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {k.prefix}••••{k.lastFour}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{k.scopes ?? '—'}</td>
                  <td className="px-4 py-3">
                    {k.revokedAt ? (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        İptal edildi
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        Aktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(k.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!k.revokedAt && (
                      <button
                        onClick={() => { if (confirm(`"${k.name}" iptal edilsin mi? Geri alınamaz.`)) revokeMut.mutate(k.id) }}
                        disabled={revokeMut.isPending}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
                      >İptal et</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        toast.success('Kopyalandı')
        setTimeout(() => setCopied(false), 1500)
      }}
      className="flex-shrink-0 rounded-md border border-gray-300 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      aria-label="Kopyala"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}
