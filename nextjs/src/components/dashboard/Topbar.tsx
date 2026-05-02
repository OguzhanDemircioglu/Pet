'use client'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { LogOut, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Plan } from '@/types'

const PLAN_BADGE: Record<Plan, { label: string; cls: string }> = {
  FREE:     { label: 'FREE', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200' },
  PRO:      { label: 'PRO',  cls: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200' },
  PRO_PLUS: { label: 'PRO+', cls: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
}

export default function Topbar({ plan, userEmail }: { plan: Plan; userEmail: string }) {
  const badge = PLAN_BADGE[plan]
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && theme === 'dark'

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-gray-600 dark:text-gray-400 sm:inline">{userEmail}</span>
        <button
          aria-label="Tema değiştir"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {mounted && (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: '/giris' })}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <LogOut className="h-4 w-4" /> Çıkış
        </button>
      </div>
    </header>
  )
}
