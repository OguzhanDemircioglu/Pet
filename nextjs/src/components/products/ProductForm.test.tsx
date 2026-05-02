import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProductForm from './ProductForm'

describe('ProductForm', () => {
  it('boş ad submit edilirse hata gösterir', async () => {
    const onSubmit = vi.fn()
    render(<ProductForm showSku onSubmit={onSubmit} />)
    fireEvent.click(screen.getByText('Kaydet'))
    expect(await screen.findByRole('alert')).toHaveTextContent(/ad zorunlu/i)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('SKU zorunluysa boş gönderilemez', async () => {
    const onSubmit = vi.fn()
    render(<ProductForm showSku onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText('Ad'), { target: { value: 'Mama' } })
    fireEvent.click(screen.getByText('Kaydet'))
    expect(await screen.findByRole('alert')).toHaveTextContent(/sku zorunlu/i)
  })

  it('geçerli giriş onSubmit çağırır', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ProductForm showSku onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText('Ad'), { target: { value: 'Mama 5kg' } })
    fireEvent.change(screen.getByLabelText('SKU'), { target: { value: 'SKU-1' } })
    fireEvent.change(screen.getByLabelText('Fiyat (₺)'), { target: { value: '199.99' } })
    fireEvent.change(screen.getByLabelText('Stok (adet)'), { target: { value: '50' } })
    fireEvent.click(screen.getByText('Kaydet'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      name: 'Mama 5kg', sku: 'SKU-1', price: 199.99, stock: 50, active: undefined,
    }))
  })

  it('server error mesajı kullanıcıya gösterilir', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Bu SKU zaten kullanılıyor'))
    render(<ProductForm showSku onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText('Ad'), { target: { value: 'X' } })
    fireEvent.change(screen.getByLabelText('SKU'), { target: { value: 'X' } })
    fireEvent.click(screen.getByText('Kaydet'))
    expect(await screen.findByRole('alert')).toHaveTextContent(/SKU zaten kullan/i)
  })
})
