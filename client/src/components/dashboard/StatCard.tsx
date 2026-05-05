interface Props {
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'warn' | 'success' | 'accent'
  icon?: string
  trend?: { value: number; positive: boolean }
}

const TONE_CLS: Record<NonNullable<Props['tone']>, { stripe: string; value: string; iconBg: string }> = {
  default: { stripe: 'from-red-500 to-amber-500', value: 'text-gray-900 dark:text-gray-50', iconBg: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300' },
  warn:    { stripe: 'from-amber-500 to-orange-500', value: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300' },
  success: { stripe: 'from-emerald-500 to-teal-500', value: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300' },
  accent:  { stripe: 'from-sky-500 to-indigo-500', value: 'text-sky-600 dark:text-sky-400', iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300' },
}

export default function StatCard({ label, value, hint, tone = 'default', icon, trend }: Props) {
  const cls = TONE_CLS[tone]
  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-950 dark:hover:border-red-800/50">
      <div className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r ${cls.stripe} transition-transform duration-500 group-hover:scale-x-100`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
          <div className={`mt-2 text-3xl font-extrabold tracking-tight ${cls.value}`}>{value}</div>
          {hint && <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{hint}</div>}
          {trend && (
            <div className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold ${trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {icon && (
          <span className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl ${cls.iconBg} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`}>
            {icon}
          </span>
        )}
      </div>
    </div>
  )
}
