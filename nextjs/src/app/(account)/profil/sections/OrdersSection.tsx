'use client'
import { useQuery } from '@tanstack/react-query'
import { orderClientApi } from '@/lib/api'
import type { OrderResponse } from '@/types'
import SectionHead from './SectionHead'

const STATUS_LABEL: Record<string, string> = {
  PENDING:    'Beklemede',
  PAID:       'Ödendi',
  PROCESSING: 'Onaylandı',
  SHIPPED:    'Kargoda',
  DELIVERED:  'Teslim Edildi',
  CANCELLED:  'İptal',
}
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  PENDING:    { bg: '#fffbeb', color: '#d97706' },
  PAID:       { bg: '#f0fdf4', color: '#16a34a' },
  PROCESSING: { bg: '#f0fdf4', color: '#16a34a' },
  SHIPPED:    { bg: '#eff6ff', color: '#2563eb' },
  DELIVERED:  { bg: '#f0fdf4', color: '#16a34a' },
  CANCELLED:  { bg: 'var(--primary-bg)', color: 'var(--primary)' },
}
const PAYMENT_LABEL: Record<string, string> = {
  CREDIT_CARD: '💳 Kart',
  COD:         '💵 Teslimatta',
}

export default function OrdersSection() {
  const { data: orders, isLoading, error } = useQuery<OrderResponse[]>({
    queryKey: ['orders', 'my'],
    queryFn: () => orderClientApi.listMy() as Promise<OrderResponse[]>,
  })

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Yükleniyor...</div>
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--primary)' }}>Siparişler yüklenemedi</div>

  const list = orders ?? []

  return (
    <div>
      <SectionHead title="Siparişlerim" sub={`${list.length} sipariş`} />
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        {list.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Henüz sipariş yok</div>
          </div>
        ) : list.map((o, i) => {
          const st = STATUS_STYLE[o.status] || STATUS_STYLE.PENDING
          const label = STATUS_LABEL[o.status] || o.status
          const itemSummary = o.items.map(it => `${it.productName} ×${it.quantity}`).join(', ')
          const date = new Date(o.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
          return (
            <div key={o.id} style={{
              padding: '16px 20px',
              borderBottom: i < list.length - 1 ? '1px solid var(--border)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
                  #{String(o.id).padStart(6, '0')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>
                  {date} · {o.city} / {o.district}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {itemSummary}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
                  ₺{Number(o.totalAmount).toFixed(2)}
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'var(--bg3)', color: 'var(--text3)' }}>
                    {PAYMENT_LABEL[o.paymentMethod] || '💵 Teslimatta'}
                  </span>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>
                    {label}
                  </span>
                </div>
                {o.parasutEBelgeUrl && (
                  <div style={{ marginTop: 6 }}>
                    <a href={o.parasutEBelgeUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
                      🧾 Faturayı İndir
                    </a>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
