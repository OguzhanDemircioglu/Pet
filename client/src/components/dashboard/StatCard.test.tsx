import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from './StatCard'

describe('StatCard', () => {
  it('label + value gösterir', () => {
    render(<StatCard label="Toplam" value={42} />)
    expect(screen.getByText('Toplam')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('hint render edilir', () => {
    render(<StatCard label="X" value={1} hint="≤ 5 adet" />)
    expect(screen.getByText('≤ 5 adet')).toBeInTheDocument()
  })

  it('warn tone amber renk uygular', () => {
    const { container } = render(<StatCard label="X" value={3} tone="warn" />)
    const valueEl = container.querySelector('.text-3xl')
    expect(valueEl?.className).toContain('text-amber-600')
  })

  it('default tone gri/beyaz', () => {
    const { container } = render(<StatCard label="X" value={5} />)
    const valueEl = container.querySelector('.text-3xl')
    expect(valueEl?.className).not.toContain('text-amber-600')
  })

  it('string value de render edilir', () => {
    render(<StatCard label="Plan" value="PRO" />)
    expect(screen.getByText('PRO')).toBeInTheDocument()
  })
})
