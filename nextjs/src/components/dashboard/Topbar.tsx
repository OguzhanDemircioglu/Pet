'use client'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import type { Plan } from '@/types'

const PLAN_BADGE: Record<Plan, { label: string; cls: string }> = {
  FREE:    { label: 'FREE',    cls: 'bg-gray-100 text-gray-700' },
  PRO:     { label: 'PRO',     cls: 'bg-sky-100 text-sky-800' },
  PRO_PLUS:{ label: 'PRO+',    cls: 'bg-red-100 text-red-800' },
}

export default function Topbar({ plan, userEmail }: { plan: Plan; userEmail: string }) {
  const badge = PLAN_BADGE[plan]
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">{userEmail}</span>
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
