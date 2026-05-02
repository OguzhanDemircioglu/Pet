'use client'
import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
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
      toast.error((err as Error).message)
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
