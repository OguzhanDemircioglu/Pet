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

export default function Sidebar({ plan }: { plan: Plan }) {
  const pathname = usePathname()
  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 md:block">
      <div className="mb-8 px-2 text-xl font-bold">
        <span className="text-red-600">Pet</span>
        <span className="text-sky-400">Toptan</span>
      </div>
      <nav className="space-y-1">
        {NAV.map((item) => {
          const locked = item.requires && ORDER[plan] < ORDER[item.requires]
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          if (locked) {
            return (
              <div
                key={item.href}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                title={`${item.requires} planı gerekli`}
              >
                <span className="flex items-center gap-3"><Icon className="h-4 w-4" /> {item.label}</span>
                <Lock className="h-3 w-3" />
              </div>
            )
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
