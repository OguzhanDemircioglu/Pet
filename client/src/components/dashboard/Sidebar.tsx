'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Receipt, Users, Settings, Lock, History, KeyRound } from 'lucide-react'
import type { Plan } from '@/types'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  requires?: Plan
  badge?: string
}

const NAV: NavItem[] = [
  { href: '/dashboard',    label: 'Pano',         icon: LayoutDashboard },
  { href: '/urunler',      label: 'Ürünler',      icon: Package },
  { href: '/satislar',     label: 'Satışlar',     icon: Receipt, requires: 'PRO' },
  { href: '/kullanicilar', label: 'Kullanıcılar', icon: Users,   requires: 'PRO' },
  { href: '/audit',          label: 'Aktivite',       icon: History,  requires: 'PRO' },
  { href: '/api-anahtarlari',label: 'API Anahtarları',icon: KeyRound, requires: 'PRO' },
  { href: '/ayarlar',        label: 'Ayarlar',        icon: Settings },
]

const ORDER: Record<Plan, number> = { FREE: 0, PRO: 1, PRO_PLUS: 2 }

const PLAN_INFO: Record<Plan, { label: string; gradient: string; tag: string }> = {
  FREE:     { label: 'Ücretsiz Plan', gradient: 'from-slate-500 to-slate-600', tag: 'FREE' },
  PRO:      { label: 'Profesyonel',  gradient: 'from-sky-500 to-indigo-600', tag: 'PRO' },
  PRO_PLUS: { label: 'Pro Plus',     gradient: 'from-red-500 to-orange-500', tag: 'PRO+' },
}

export default function Sidebar({ plan }: { plan: Plan }) {
  const pathname = usePathname()
  const planInfo = PLAN_INFO[plan]

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 md:flex md:flex-col">
      {/* Logo block */}
      <div className="flex items-center gap-2.5 border-b border-gray-200 px-5 py-5 dark:border-gray-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-xl shadow-md shadow-red-500/30">
          🐾
        </div>
        <div className="text-xl font-black tracking-tight">
          <span className="text-red-600">Pet</span>
          <span className="text-sky-400">Toptan</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Yönetim
        </div>
        {NAV.map((item) => {
          const locked = item.requires && ORDER[plan] < ORDER[item.requires]
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          if (locked) {
            return (
              <div
                key={item.href}
                className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2.5 text-sm text-gray-400 transition-colors hover:bg-gray-50 dark:text-gray-600 dark:hover:bg-gray-900"
                title={`${item.requires} planı gerekli`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <Lock className="h-3 w-3" />
              </div>
            )
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-gradient-to-r from-red-50 to-red-50/50 text-red-700 dark:from-red-950/60 dark:to-red-950/20 dark:text-red-300'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100'
              }`}
            >
              {active && (
                <span className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-gradient-to-b from-red-500 to-orange-500" aria-hidden="true" />
              )}
              <Icon className={`h-4 w-4 transition-transform ${active ? '' : 'group-hover:scale-110'}`} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Plan card */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${planInfo.gradient} p-4 text-white shadow-md`}>
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10" aria-hidden="true" />
          <div className="absolute -bottom-6 -left-2 h-12 w-12 rounded-full bg-white/10" aria-hidden="true" />
          <div className="relative">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              Mevcut Plan
            </div>
            <div className="mt-1 text-base font-extrabold">{planInfo.label}</div>
            <Link
              href="/ayarlar"
              className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              {plan === 'PRO_PLUS' ? 'Yönet' : 'Yükselt'} →
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
