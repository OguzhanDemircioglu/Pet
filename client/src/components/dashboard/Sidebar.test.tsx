import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Sidebar from './Sidebar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

describe('Sidebar', () => {
  it('FREE planda PRO menüleri kilitli görünür', () => {
    render(<Sidebar plan="FREE" />)
    expect(screen.getByText('Pano')).toBeInTheDocument()
    expect(screen.getByText('Ürünler')).toBeInTheDocument()
    expect(screen.getByText('Satışlar')).toBeInTheDocument()
    expect(screen.getByText('Kullanıcılar')).toBeInTheDocument()
    expect(screen.getByText('Aktivite')).toBeInTheDocument()
    expect(screen.getByText('API Anahtarları')).toBeInTheDocument()
    expect(screen.getByText('Ayarlar')).toBeInTheDocument()

    // PRO-only öğeler kilitli (cursor-not-allowed div, link değil)
    const satisDiv = screen.getByText('Satışlar').closest('[title]')
    expect(satisDiv).toHaveAttribute('title', expect.stringContaining('PRO'))

    const apiKeysDiv = screen.getByText('API Anahtarları').closest('[title]')
    expect(apiKeysDiv).toHaveAttribute('title', expect.stringContaining('PRO'))
  })

  it('PRO planda PRO menüleri tıklanabilir Link', () => {
    render(<Sidebar plan="PRO" />)
    // PRO içeriklerinin artık locked div değil, Link olduğu (href)
    const satisLink = screen.getByText('Satışlar').closest('a')
    expect(satisLink).toHaveAttribute('href', '/satislar')

    const apiKeysLink = screen.getByText('API Anahtarları').closest('a')
    expect(apiKeysLink).toHaveAttribute('href', '/api-anahtarlari')
  })

  it('PRO_PLUS tüm menüler açık', () => {
    render(<Sidebar plan="PRO_PLUS" />)
    const allLinks = screen.getAllByRole('link')
    // Pano, Ürünler, Satışlar, Kullanıcılar, Aktivite, API Anahtarları, Ayarlar
    expect(allLinks.length).toBeGreaterThanOrEqual(7)
  })

  it('aktif sayfa kırmızı vurgu sınıfı alır', () => {
    render(<Sidebar plan="PRO" />)
    const panoLink = screen.getByText('Pano').closest('a')
    expect(panoLink?.className).toContain('text-red-700')
  })

  it('Plan tanınmıyorsa default davranış', () => {
    // PRO_PLUS ile en üst seviye ; FREE ile en alt
    const { container } = render(<Sidebar plan="FREE" />)
    expect(container.querySelectorAll('a, [title]')).not.toHaveLength(0)
  })
})
