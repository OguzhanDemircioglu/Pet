import type { Metadata } from 'next'
import { Suspense } from 'react'
import PaymentResultClient from './PaymentResultClient'

export const metadata: Metadata = {
  title: 'Ödeme Sonucu',
  robots: { index: false, follow: false },
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: 'center' }}>Yükleniyor...</div>}>
      <PaymentResultClient />
    </Suspense>
  )
}
