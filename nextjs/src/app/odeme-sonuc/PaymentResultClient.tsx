'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useAppDispatch } from '@/hooks/useAppStore'
import { clearCart } from '@/store/cartSlice'

export default function PaymentResultClient() {
  const params = useSearchParams()
  const status = params.get('status') ?? params.get('paymentStatus')
  const orderId = params.get('orderId') ?? params.get('conversationId')
  const success = status === 'success' || status === 'SUCCESS' || status === 'paid'
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (success) dispatch(clearCart())
  }, [success, dispatch])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 40, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 28px rgba(0,0,0,.1)' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{success ? '✅' : '❌'}</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, color: 'var(--text)' }}>
          {success ? 'Ödeme Başarılı' : 'Ödeme Başarısız'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 24 }}>
          {success
            ? 'Siparişiniz başarıyla oluşturuldu. Sipariş detaylarını e-postanızda bulabilirsiniz.'
            : 'Ödemeniz tamamlanamadı. Lütfen tekrar deneyin veya farklı bir ödeme yöntemi seçin.'}
        </p>
        {orderId && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>Sipariş No: {orderId}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {success ? (
            <>
              <Link href="/profil" style={{ padding: '10px 22px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--r)', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Siparişlerim</Link>
              <Link href="/" style={{ padding: '10px 22px', background: 'var(--bg3)', color: 'var(--text)', borderRadius: 'var(--r)', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Ana Sayfa</Link>
            </>
          ) : (
            <Link href="/" style={{ padding: '10px 22px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--r)', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Ana Sayfaya Dön</Link>
          )}
        </div>
      </div>
    </div>
  )
}
