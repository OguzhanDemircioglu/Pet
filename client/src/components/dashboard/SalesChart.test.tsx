import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SalesChart from './SalesChart'

describe('SalesChart', () => {
  it('boş veri "Veri yok" gösterir', () => {
    render(<SalesChart data={[]} />)
    expect(screen.getByText('Veri yok')).toBeInTheDocument()
  })

  it('toplam satış sayısı + toplam ciro hesaplar', () => {
    const { container } = render(<SalesChart data={[
      { date: '2026-05-01', count: 3, total: 100 },
      { date: '2026-05-02', count: 2, total: 50 },
      { date: '2026-05-03', count: 5, total: 200 },
    ]} />)
    // Header satırı: <strong>10</strong> satış · <strong>350.00 ₺</strong> toplam
    const header = container.querySelector('.flex.items-baseline.justify-between')
    expect(header?.textContent).toContain('10')
    expect(header?.textContent).toContain('350.00 ₺')
  })

  it('SVG grafik render edilir', () => {
    const { container } = render(<SalesChart data={[
      { date: '2026-05-01', count: 1, total: 50 },
      { date: '2026-05-02', count: 2, total: 100 },
    ]} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
    // 2 bar (rect) — grid çizgileri ayrı
    const rects = container.querySelectorAll('rect')
    expect(rects.length).toBe(2)
  })

  it('aria-label günlük satış grafiği', () => {
    render(<SalesChart data={[{ date: '2026-05-01', count: 1, total: 10 }]} />)
    expect(screen.getByRole('img', { name: /günlük satış/i })).toBeInTheDocument()
  })

  it('hover title attribute (native tooltip)', () => {
    const { container } = render(<SalesChart data={[
      { date: '2026-05-01', count: 7, total: 250 },
    ]} />)
    const title = container.querySelector('title')
    expect(title?.textContent).toContain('2026-05-01')
    expect(title?.textContent).toContain('7 satış')
    expect(title?.textContent).toContain('250')
  })
})
