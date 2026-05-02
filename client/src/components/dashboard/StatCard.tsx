interface Props {
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'warn'
}

export default function StatCard({ label, value, hint, tone = 'default' }: Props) {
  const valueCls = tone === 'warn' ? 'text-amber-600' : 'text-gray-900 dark:text-gray-50'
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${valueCls}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</div>}
    </div>
  )
}
