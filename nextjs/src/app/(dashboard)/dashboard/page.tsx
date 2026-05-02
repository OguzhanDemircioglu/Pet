'use client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import StatCard from '@/components/dashboard/StatCard'
import SalesChart from '@/components/dashboard/SalesChart'
import { saasApi } from '@/lib/api/saas'
import { useSearchParams } from 'next/navigation'
import { Package, Receipt, Users, Sparkles } from 'lucide-react'

export default function DashboardPage() {
  const params = useSearchParams()
  const upgradeHint = params.get('upgrade') === '1'

  const { data: stats, error, isLoading } = useQuery({
    queryKey: ['saas', 'dashboard'],
    queryFn: () => saasApi.dashboard(),
    staleTime: 30_000,
  })

  const { data: chart } = useQuery({
    queryKey: ['saas', 'chart', 'sales-daily', 30],
    queryFn: () => saasApi.salesDaily(30),
    staleTime: 60_000,
    enabled: !isLoading && !!stats && stats.salesCount > 0,
  })

  const { data: monthly } = useQuery({
    queryKey: ['saas', 'metrics', 'monthly'],
    queryFn: () => saasApi.monthlyMetrics(),
    staleTime: 60_000,
    enabled: !isLoading && !!stats && stats.salesCount > 0,
  })

  if (isLoading) return <div className="text-gray-500">Yükleniyor…</div>
  if (error) return <div className="text-red-600">Hata: {(error as Error).message}</div>
  if (!stats) return null

  const isFirstTime = stats.productCount === 0 && stats.salesCount === 0
  const limitText = stats.productLimit < 0 ? 'sınırsız' : `/ ${stats.productLimit} limit`

  if (isFirstTime) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-8">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold">PetToptan'a hoş geldin!</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            İşletmen için stok ve satış yönetimini birkaç dakikada kuralım.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <OnboardStep
            num={1}
            icon={Package}
            title="İlk ürününü ekle"
            desc="Stok takibine başla. CSV ile toplu ekleyebilirsin."
            actionLabel="Ürün ekle"
            actionHref="/urunler/yeni"
            secondaryLabel="CSV yükle"
            secondaryHref="/urunler/import"
          />
          <OnboardStep
            num={2}
            icon={Receipt}
            title="Satış kaydet"
            desc="Mağazada bir satış olduğunda kaydet — stok otomatik düşer."
            actionLabel="Satış oluştur"
            actionHref="/satislar/yeni"
            disabled={stats.plan === 'FREE'}
            disabledNote="Satış geçmişi PRO plan ile açılır"
          />
          <OnboardStep
            num={3}
            icon={Users}
            title="Ekip arkadaşı davet et"
            desc="Çoklu kullanıcı ile mağazanı birlikte yönet."
            actionLabel="Kullanıcı ekle"
            actionHref="/kullanicilar"
            disabled={stats.plan === 'FREE'}
            disabledNote="Çoklu kullanıcı PRO plan ile açılır"
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm dark:border-gray-800 dark:bg-gray-950">
          <p className="text-gray-600 dark:text-gray-400">
            Mevcut planın: <strong>{stats.plan}</strong> · Ürün limiti: <strong>{stats.productLimit < 0 ? 'sınırsız' : stats.productLimit}</strong>
          </p>
          <Link href="/ayarlar" className="mt-1 inline-block text-sky-700 hover:underline">Plan yükselt →</Link>
        </div>
      </div>
    )
  }

  const lowCount = stats.lowStock.length

  return (
    <div className="space-y-6">
      {upgradeHint && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Bu özellik için <strong>PRO</strong> plana yükseltme gereklidir.
        </div>
      )}

      {lowCount >= 3 && (
        <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-700 dark:bg-amber-950/40">
          <span className="text-xl">⚠</span>
          <div className="flex-1">
            <strong className="text-amber-900 dark:text-amber-200">{lowCount} ürün</strong>
            <span className="text-amber-800 dark:text-amber-300"> düşük stoklu (≤ 5 adet). </span>
            {stats.plan === 'FREE' ? (
              <Link href="/ayarlar" className="text-amber-900 underline hover:no-underline dark:text-amber-200">
                E-posta uyarısı için PRO'ya yükselt →
              </Link>
            ) : (
              <Link href="/ayarlar" className="text-amber-900 underline hover:no-underline dark:text-amber-200">
                Otomatik e-posta uyarılarını ayarla →
              </Link>
            )}
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold">Pano</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Toplam Ürün" value={stats.productCount} hint={limitText} />
        <StatCard label="Toplam Satış" value={stats.salesCount} />
        <StatCard label="Düşük Stok" value={stats.lowStock.length} tone={stats.lowStock.length > 0 ? 'warn' : 'default'} hint="≤ 5 adet" />
      </div>

      {chart && chart.length > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-3 text-lg font-semibold">Satış Trendi</h2>
          <SalesChart data={chart} />
        </section>
      )}

      {monthly && monthly.totalSales > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Bu Ayki Performans</h2>
            <span className="font-mono text-xs text-gray-500">{monthly.period}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricMini label="Satış" value={String(monthly.totalSales)} />
            <MetricMini label="Ciro" value={`${Number(monthly.totalRevenue).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`} accent />
            <MetricMini label="Ort. Sepet" value={`${Number(monthly.averageOrderValue).toFixed(2)} ₺`} />
            <MetricMini label="Aktif Ürün" value={`${monthly.activeProducts}/${monthly.totalProducts}`} />
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Düşük Stoklu Ürünler</h2>
        {stats.lowStock.length === 0 ? (
          <p className="text-sm text-gray-500">Tüm ürünler yeterli stokta.</p>
        ) : (
          <table className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white text-sm dark:border-gray-800 dark:bg-gray-950">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-2">Ürün</th>
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">Stok</th>
              </tr>
            </thead>
            <tbody>
              {stats.lowStock.map(p => (
                <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-2 font-semibold text-amber-700">{p.stock - p.reserved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Son Satışlar</h2>
        {stats.recentSales.length === 0 ? (
          <p className="text-sm text-gray-500">Henüz satış yok.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-950">
            {stats.recentSales.map(s => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="font-mono text-xs text-gray-500">{s.orderNumber}</div>
                  <div>{s.customerName ?? '—'} ({s.itemCount} kalem)</div>
                </div>
                <div className="font-semibold">{s.total.toFixed(2)} ₺</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function MetricMini({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className={`mt-1 text-xl font-bold ${accent ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>{value}</div>
    </div>
  )
}

function OnboardStep({
  num, icon: Icon, title, desc, actionLabel, actionHref, secondaryLabel, secondaryHref, disabled, disabledNote,
}: {
  num: number
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  actionLabel: string
  actionHref: string
  secondaryLabel?: string
  secondaryHref?: string
  disabled?: boolean
  disabledNote?: string
}) {
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {num}
        </span>
        <Icon className="h-5 w-5 text-gray-500" />
      </div>
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="mb-4 flex-1 text-sm text-gray-500">{desc}</p>
      {disabled ? (
        <p className="text-xs italic text-gray-400">🔒 {disabledNote}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Link href={actionHref} className="inline-block rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">
            {actionLabel}
          </Link>
          {secondaryLabel && secondaryHref && (
            <Link href={secondaryHref} className="inline-block rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
              {secondaryLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
