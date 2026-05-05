'use client'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { LogOut, Moon, Sun, Bell, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Plan } from '@/types'

const PLAN_BADGE: Record<Plan, { label: string; cls: string }> = {
  FREE:     { label: 'FREE', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200' },
  PRO:      { label: 'PRO',  cls: 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white' },
  PRO_PLUS: { label: 'PRO+', cls: 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm shadow-red-500/30' },
}

export default function Topbar({ plan, userEmail }: { plan: Plan; userEmail: string }) {
  const badge = PLAN_BADGE[plan]
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && theme === 'dark'
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'PT'

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-gray-200 bg-white/85 px-6 py-3 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/85">
      {/* Left: search + plan */}
      <div className="flex flex-1 items-center gap-3">
        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Hızlı ara… (⌘K)"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition-all focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:bg-gray-800 dark:focus:ring-red-900/30"
          />
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wider ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Bildirimler"
          className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-950" aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Tema değiştir"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {mounted && (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />

        {/* Avatar + email */}
        <div className="flex items-center gap-2.5 rounded-lg pl-1 pr-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-xs font-bold text-white shadow-sm">
            {initials}
          </div>
          <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 sm:inline">
            {userEmail || 'Hesap'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/giris' })}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-950/40 dark:hover:text-red-300"
          aria-label="Çıkış yap"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Çıkış</span>
        </button>
      </div>
    </header>
  )
}
