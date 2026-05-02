'use client'
import type { DailySalesPoint } from '@/lib/api/saas'

interface Props {
  data: DailySalesPoint[]
  height?: number
}

/**
 * Bağımlılık-sız inline SVG bar chart. Son N günlük günlük satış toplamı.
 * Hover'da tooltip yerine title attribute (browser native).
 */
export default function SalesChart({ data, height = 160 }: Props) {
  if (data.length === 0) return <p className="text-sm text-gray-500">Veri yok</p>

  const max = Math.max(1, ...data.map(d => Number(d.total)))
  const total = data.reduce((s, d) => s + Number(d.total), 0)
  const totalCount = data.reduce((s, d) => s + d.count, 0)
  const barW = 100 / data.length
  const barGap = 0.15

  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between text-xs">
        <span className="text-gray-500">Son {data.length} gün</span>
        <span className="text-gray-700 dark:text-gray-300">
          <strong>{totalCount}</strong> satış · <strong>{total.toFixed(2)} ₺</strong> toplam
        </span>
      </div>

      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="h-40 w-full"
        role="img"
        aria-label="Günlük satış grafiği"
      >
        {/* Y-ekseni gridi (3 çizgi) */}
        {[0.25, 0.5, 0.75].map((p, i) => (
          <line key={i} x1="0" x2="100" y1={height * (1 - p)} y2={height * (1 - p)}
                stroke="currentColor" strokeWidth="0.2" className="text-gray-200 dark:text-gray-700" />
        ))}

        {data.map((d, i) => {
          const v = Number(d.total)
          const h = (v / max) * (height - 20)
          const x = i * barW + barGap
          const y = height - h - 10
          const w = barW - barGap * 2
          return (
            <g key={d.date}>
              <rect x={x} y={y} width={w} height={Math.max(h, 0.5)} rx="0.5"
                    className="fill-red-500/80 hover:fill-red-600 transition-colors">
                <title>{d.date} — {d.count} satış · {v.toFixed(2)} ₺</title>
              </rect>
            </g>
          )
        })}
      </svg>

      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[Math.floor(data.length / 2)]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  )
}
