import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import StockAdjustModal from './StockAdjustModal'
import type { ProductDto } from '@/lib/api/saas'

vi.mock('@/lib/api/saas', () => ({
  saasApi: {
    adjustStock: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const product: ProductDto = {
  id: 1, name: 'Mama 5kg', sku: 'M-5', price: 100, stock: 20, reserved: 3, active: true,
}

describe('StockAdjustModal', () => {
  let onClose: () => void
  beforeEach(() => { onClose = vi.fn() })

  it('mevcut stok ve rezerve gösterilir', () => {
    wrap(<StockAdjustModal product={product} onClose={onClose} />)
    expect(screen.getByText(/Mama 5kg/)).toBeInTheDocument()
    expect(screen.getByText('M-5')).toBeInTheDocument()
    expect(screen.getByText(/Mevcut stok:/)).toBeInTheDocument()
  })

  it('hızlı +10 butonu delta\'yı 10 ekler', () => {
    wrap(<StockAdjustModal product={product} onClose={onClose} />)
    const plusTen = screen.getByRole('button', { name: '+10' })
    fireEvent.click(plusTen)
    // Yeni stok 20 + 10 = 30
    expect(screen.getByText(/Yeni stok:/).parentElement).toHaveTextContent('30')
  })

  it('eksiye düşürürse uyarı + buton disable', () => {
    wrap(<StockAdjustModal product={product} onClose={onClose} />)
    const minusTen = screen.getByRole('button', { name: '-10' })
    fireEvent.click(minusTen) // 20 - 10 = 10
    fireEvent.click(minusTen) // 10 - 10 = 0
    fireEvent.click(minusTen) // 0 - 10 = -10
    expect(screen.getByText(/eksiye düşemez/i)).toBeInTheDocument()
    const submit = screen.getByRole('button', { name: 'Uygula' })
    expect(submit).toBeDisabled()
  })

  it('delta 0 ise submit disable', () => {
    wrap(<StockAdjustModal product={product} onClose={onClose} />)
    const submit = screen.getByRole('button', { name: 'Uygula' })
    expect(submit).toBeDisabled()
  })

  it('İptal butonu onClose çağırır', () => {
    wrap(<StockAdjustModal product={product} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'İptal' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('Backdrop tıklamada onClose çağrılır', () => {
    wrap(<StockAdjustModal product={product} onClose={onClose} />)
    const dialog = screen.getByRole('dialog')
    // Backdrop dialog'un parent'ı
    const backdrop = dialog.parentElement!
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('Modal içine tıklamada onClose ÇAĞRILMAZ (stopPropagation)', () => {
    wrap(<StockAdjustModal product={product} onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
