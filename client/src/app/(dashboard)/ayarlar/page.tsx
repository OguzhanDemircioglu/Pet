'use client'
import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { swalError } from '@/lib/swal'
import { saasApi } from '@/lib/api/saas'
import type { Plan } from '@/types'

const PLANS: { id: Plan; name: string; desc: string; features: string[] }[] = [
  {
    id: 'FREE',
    name: 'FREE',
    desc: 'Başlangıç — küçük petshop',
    features: ['20 ürüne kadar', '1 kullanıcı', 'Temel stok takibi', 'Satış kaydı'],
  },
  {
    id: 'PRO',
    name: 'PRO',
    desc: 'Büyüyen iş — sınırsız ürün',
    features: ['Sınırsız ürün', 'Çoklu kullanıcı', 'Düşük stok uyarısı', 'Satış geçmişi'],
  },
  {
    id: 'PRO_PLUS',
    name: 'PRO+',
    desc: 'Vitrin + tüm özellikler',
    features: ['PRO her şeyi', 'Public mini vitrin', '/shop/{slug} URL', 'Müşterilerinizle paylaşın'],
  },
]

export default function SettingsPage() {
  const { data: session } = useSession()
  const s = session as unknown as { user?: { email?: string } }

  const [info, setInfo] = useState<Awaited<ReturnType<typeof saasApi.planInfo>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<Plan | null>(null)

  useEffect(() => {
    saasApi.planInfo().then(setInfo).finally(() => setLoading(false))
  }, [])

  const change = async (plan: Plan) => {
    if (!info || info.plan === plan) return
    if (!confirm(`Plan ${plan} olarak değiştirilsin mi? Tekrar giriş yapmanız gerekecek.`)) return
    setBusy(plan)
    try {
      await saasApi.changePlan(plan)
      toast.success('Plan değiştirildi. Yeni plan için tekrar giriş yapın.')
      setTimeout(() => signOut({ callbackUrl: '/giris' }), 1500)
    } catch (err) {
      swalError((err as Error).message)
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ayarlar</h1>

      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        <h2 className="mb-4 text-lg font-semibold">İşletme Bilgileri</h2>
        {loading ? (
          <p className="text-gray-500">Yükleniyor…</p>
        ) : info && (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Row label="İşletme Adı" value={info.companyName} />
            <Row label="Slug" value={info.companySlug} mono />
            <Row label="E-posta" value={s.user?.email ?? '—'} />
            <Row label="Company ID" value={String(info.companyId)} mono />
          </dl>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        <h2 className="mb-1 text-lg font-semibold">Plan</h2>
        <p className="mb-4 text-sm text-gray-500">Mevcut plan: <strong>{info?.plan ?? '—'}</strong></p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map(p => {
            const active = info?.plan === p.id
            return (
              <div
                key={p.id}
                className={`flex flex-col rounded-lg border-2 p-5 ${
                  active ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  {active && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">aktif</span>}
                </div>
                <p className="mb-3 text-xs text-gray-500">{p.desc}</p>
                <ul className="mb-4 flex-1 space-y-1 text-sm">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-1.5">
                      <span className="text-emerald-600">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => change(p.id)}
                  disabled={active || busy !== null}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700"
                >
                  {busy === p.id ? 'Değişiyor…' : active ? 'Aktif Plan' : `${p.name}'a Geç`}
                </button>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-xs text-gray-400">
          Plan değişimi şu an ödeme alımı yapmaz — Stripe entegrasyonu sonraki sürümde.
        </p>
      </section>

      <NotificationSettingsCard />

      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        <h2 className="mb-1 text-lg font-semibold">Veri Yedekle</h2>
        <p className="mb-4 text-sm text-gray-500">
          Tüm ürünlerinizi ve son 1000 satışınızı tek JSON dosyası olarak indirin.
        </p>
        <ExportButton />
      </section>
    </div>
  )
}

function NotificationSettingsCard() {
  const [settings, setSettings] = useState<Awaited<ReturnType<typeof saasApi.getCompanySettings>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    saasApi.getCompanySettings().then(setSettings).finally(() => setLoading(false))
  }, [])

  if (loading || !settings) return null

  const isFree = settings.plan === 'FREE'
  const update = async (patch: Parameters<typeof saasApi.updateCompanySettings>[0]) => {
    setBusy(true)
    try {
      const updated = await saasApi.updateCompanySettings(patch)
      setSettings(updated)
      toast.success('Ayarlar güncellendi')
    } catch (e) {
      const err = e as Error & { code?: string }
      if (err.code === 'PLAN_FEATURE_LOCKED') {
        swalError('Bu özellik PRO plan ile açılır', 'Plan kısıtı')
      } else {
        swalError(err.message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
      <h2 className="mb-1 text-lg font-semibold">Bildirim Ayarları</h2>
      <p className="mb-4 text-sm text-gray-500">E-posta bildirimleri (PRO+)</p>

      <div className="space-y-4">
        <Toggle
          label="Düşük stok uyarısı"
          desc="Her sabah 09:00 — eşik altına düşen ürünleri özetler"
          enabled={settings.lowStockAlertEnabled}
          locked={isFree}
          onChange={(v) => update({ lowStockAlertEnabled: v })}
          busy={busy}
        />

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Düşük stok eşiği</label>
            <p className="text-xs text-gray-500">Stok bu değerin altına düşerse uyarır</p>
          </div>
          <input
            type="number" min={1} max={1000}
            value={settings.lowStockThreshold}
            onChange={(e) => update({ lowStockThreshold: Number(e.target.value) })}
            className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-right text-sm dark:border-gray-700 dark:bg-gray-900"
            disabled={busy}
          />
        </div>

        <Toggle
          label="Günlük satış özeti"
          desc="Akşam — günün satış raporunu email olarak alın"
          enabled={settings.dailySummaryEnabled}
          locked={isFree}
          onChange={(v) => update({ dailySummaryEnabled: v })}
          busy={busy}
        />

        <div>
          <label className="block text-sm font-medium">Bildirim e-postası</label>
          <p className="mb-1 text-xs text-gray-500">Boş bırakırsanız ilk admin'in email'i kullanılır</p>
          <input
            type="email"
            placeholder="ops@isletmen.com"
            defaultValue={settings.notificationEmail ?? ''}
            onBlur={(e) => {
              const val = e.target.value.trim()
              if (val !== (settings.notificationEmail ?? '')) {
                update({ notificationEmail: val })
              }
            }}
            disabled={busy}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
      </div>
    </section>
  )
}

function Toggle({ label, desc, enabled, locked, busy, onChange }: {
  label: string; desc: string; enabled: boolean; locked?: boolean; busy?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">{label}</label>
          {locked && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">PRO</span>}
        </div>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => !locked && !busy && onChange(!enabled)}
        disabled={busy}
        aria-pressed={enabled}
        className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
          enabled ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-700'
        } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

function ExportButton() {
  const [busy, setBusy] = useState(false)
  const handle = async () => {
    setBusy(true)
    try {
      const blob = await saasApi.exportAll()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      a.href = url
      a.download = `pettoptan-export-${ts}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Veri yedeği indirildi')
    } catch (e) {
      swalError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <button onClick={handle} disabled={busy}
      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800">
      {busy ? 'İndiriliyor…' : 'JSON olarak indir'}
    </button>
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
