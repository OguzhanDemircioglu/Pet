import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { clearCart } from '../store/cartSlice'
import type { AppDispatch } from '../store'
import InfoBar from '../components/InfoBar'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function PaymentResultPage() {
  const [params] = useSearchParams()
  const dispatch = useDispatch<AppDispatch>()
  const success = params.get('success') === 'true'
  const orderId = params.get('orderId')

  useEffect(() => {
    // Ödeme tamamlandı — sepeti temizle
    dispatch(clearCart())
  }, [dispatch])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <InfoBar />
      <Header />

      <div style={{
        maxWidth: 520,
        margin: '64px auto',
        padding: '0 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
      }}>
        {success ? (
          <SuccessCard orderId={orderId} />
        ) : (
          <FailureCard />
        )}
      </div>

      <Footer />
    </div>
  )
}

function SuccessCard({ orderId }: { orderId: string | null }) {
  return (
    <div style={{
      width: '100%',
      background: 'var(--bg2)',
      border: '2px solid #22c55e',
      borderRadius: 'var(--r2)',
      padding: '40px 32px',
      textAlign: 'center',
      boxShadow: '0 8px 32px rgba(34,197,94,.12)',
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h1 style={{
        fontSize: 22,
        fontWeight: 800,
        color: '#16a34a',
        margin: '0 0 8px',
      }}>
        Ödemeniz Alındı!
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text2)', margin: '0 0 24px', lineHeight: 1.6 }}>
        {orderId
          ? <>Sipariş <strong>#{orderId}</strong> başarıyla oluşturuldu. Siparişinizin durumunu profilinizden takip edebilirsiniz.</>
          : 'Siparişiniz başarıyla oluşturuldu. Profilinizden takip edebilirsiniz.'}
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/profil" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--primary)', color: '#fff',
          padding: '10px 24px', borderRadius: 'var(--r)',
          fontWeight: 700, fontSize: 14, textDecoration: 'none',
          transition: '0.2s',
        }}>
          📦 Siparişlerime Git
        </Link>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--bg3)', color: 'var(--text)',
          border: '1.5px solid var(--border)',
          padding: '10px 24px', borderRadius: 'var(--r)',
          fontWeight: 600, fontSize: 14, textDecoration: 'none',
          transition: '0.2s',
        }}>
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )
}

function FailureCard() {
  return (
    <div style={{
      width: '100%',
      background: 'var(--bg2)',
      border: '2px solid #ef4444',
      borderRadius: 'var(--r2)',
      padding: '40px 32px',
      textAlign: 'center',
      boxShadow: '0 8px 32px rgba(239,68,68,.10)',
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
      <h1 style={{
        fontSize: 22,
        fontWeight: 800,
        color: '#dc2626',
        margin: '0 0 8px',
      }}>
        Ödeme Başarısız
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text2)', margin: '0 0 24px', lineHeight: 1.6 }}>
        Ödeme işlemi tamamlanamadı. Kart bilgilerinizi kontrol ederek tekrar deneyebilirsiniz.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--primary)', color: '#fff',
          padding: '10px 24px', borderRadius: 'var(--r)',
          fontWeight: 700, fontSize: 14, textDecoration: 'none',
        }}>
          🔄 Tekrar Dene
        </Link>
        <Link to="/profil" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--bg3)', color: 'var(--text)',
          border: '1.5px solid var(--border)',
          padding: '10px 24px', borderRadius: 'var(--r)',
          fontWeight: 600, fontSize: 14, textDecoration: 'none',
        }}>
          Siparişlerim
        </Link>
      </div>
    </div>
  )
}
