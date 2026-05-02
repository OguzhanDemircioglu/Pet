import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Topbar from './Topbar'

const signOutMock = vi.fn()
vi.mock('next-auth/react', () => ({ signOut: (opts: unknown) => signOutMock(opts) }))
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}))

describe('Topbar', () => {
  it('FREE plan rozeti gri', () => {
    render(<Topbar plan="FREE" userEmail="a@b.com" />)
    const badge = screen.getByText('FREE')
    expect(badge.className).toContain('bg-gray-100')
  })

  it('PRO plan rozeti mavi', () => {
    render(<Topbar plan="PRO" userEmail="a@b.com" />)
    const badge = screen.getByText('PRO')
    expect(badge.className).toContain('bg-sky-100')
  })

  it('PRO_PLUS plan rozeti kırmızı', () => {
    render(<Topbar plan="PRO_PLUS" userEmail="a@b.com" />)
    const badge = screen.getByText('PRO+')
    expect(badge.className).toContain('bg-red-100')
  })

  it('Çıkış butonu signOut çağırır', () => {
    render(<Topbar plan="PRO" userEmail="a@b.com" />)
    fireEvent.click(screen.getByText('Çıkış'))
    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: '/giris' })
  })

  it('Kullanıcı email gösterilir (sm+ ekran)', () => {
    render(<Topbar plan="PRO" userEmail="user@test.com" />)
    expect(screen.getByText('user@test.com')).toBeInTheDocument()
  })
})
