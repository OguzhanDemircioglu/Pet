'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useIsMobile } from '@/hooks/useIsMobile'
import OrdersSection from './sections/OrdersSection'
import InfoSection from './sections/InfoSection'
import AddressesSection from './sections/AddressesSection'
import NotificationsSection from './sections/NotificationsSection'

type Section = 'orders' | 'info' | 'addresses' | 'notifications'

const NAV: { id: Section; label: string; icon: string }[] = [
  { id: 'orders', label: 'Siparişlerim', icon: '📦' },
  { id: 'info', label: 'Bilgilerim', icon: '👤' },
  { id: 'addresses', label: 'Adreslerim', icon: '📍' },
  { id: 'notifications', label: 'Bildirimler', icon: '🔔' },
]

export default function ProfileClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [section, setSection] = useState<Section>('orders')

  if (status === 'loading') {
    return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text3)' }}>Yükleniyor...</div>
  }
  if (status === 'unauthenticated' || !session?.user) {
    router.replace('/giris')
    return null
  }

  const user = session.user as {
    firstName: string
    lastName: string
    email: string
    phone: string | null
    pendingEmailChange?: boolean
    role?: 'ADMIN' | 'CUSTOMER'
  }
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
  const isAdmin = user.role === 'ADMIN'

  const handleLogout = () => signOut({ callbackUrl: '/' })

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: isMobile ? '16px 12px' : '28px 24px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '248px 1fr',
        gap: isMobile ? 14 : 24, alignItems: 'start',
      }}>

        {/* Sidebar */}
        <aside style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r2)', overflow: 'hidden',
          position: isMobile ? 'static' : 'sticky', top: 120, minWidth: 0,
        }}>
          {/* Avatar */}
          <div style={{
            padding: isMobile ? '14px' : '24px 20px', textAlign: 'center',
            borderBottom: '1px solid var(--border)',
            display: isMobile ? 'flex' : 'block', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: isMobile ? 46 : 72, height: isMobile ? 46 : 72,
              borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),#f87171)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isMobile ? 17 : 26, fontWeight: 800, color: '#fff',
              margin: isMobile ? 0 : '0 auto 12px',
              boxShadow: '0 0 0 3px rgba(220,38,38,.2)', flexShrink: 0,
            }}>{initials || '?'}</div>
            <div style={{ flex: isMobile ? 1 : undefined, minWidth: 0, textAlign: isMobile ? 'left' : 'center' }}>
              <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: 'var(--text)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ fontSize: isMobile ? 11 : 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
            {isAdmin && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'var(--primary-bg)', color: 'var(--primary)',
                border: '1px solid rgba(220,38,38,.2)', borderRadius: 20,
                padding: '3px 10px', fontSize: 11, fontWeight: 700,
              }}>🛡️ Admin</span>
            )}
          </div>

          {/* Nav */}
          <nav style={isMobile ? {
            display: 'flex', flexDirection: 'row', flexWrap: 'nowrap',
            overflowX: 'auto', WebkitOverflowScrolling: 'touch',
            padding: '6px 8px', gap: 4,
          } : { padding: '8px 0' }}>
            {NAV.map(n => (
              <NavItem key={n.id} item={n} active={section === n.id}
                onClick={() => setSection(n.id)} isMobile={isMobile} />
            ))}

            {!isMobile && <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />}
            <button onClick={handleLogout} style={isMobile ? {
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', fontSize: 12.5, fontWeight: 600, color: 'var(--primary)',
              background: 'var(--primary-bg)', border: '1px solid rgba(220,38,38,.2)',
              borderRadius: 'var(--r)', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
            } : {
              width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 20px', fontSize: 13.5, fontWeight: 500, color: 'var(--primary)',
              background: 'none', border: 'none', cursor: 'pointer',
              borderLeft: '3px solid transparent',
            }}>
              <span>🚪</span> Çıkış
            </button>
          </nav>
        </aside>

        {/* Main */}
        <div style={{ minWidth: 0 }}>
          {section === 'orders' && <OrdersSection />}
          {section === 'info' && <InfoSection user={{
            firstName: user.firstName, lastName: user.lastName, email: user.email,
            phone: user.phone, pendingEmailChange: !!user.pendingEmailChange,
          }} />}
          {section === 'addresses' && <AddressesSection />}
          {section === 'notifications' && <NotificationsSection />}
        </div>
      </div>
    </div>
  )
}

function NavItem({ item, active, onClick, isMobile }: {
  item: { id: string; label: string; icon: string }
  active: boolean; onClick: () => void; isMobile?: boolean
}) {
  if (isMobile) {
    return (
      <button onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', fontSize: 12.5, fontWeight: active ? 700 : 500,
        color: active ? '#fff' : 'var(--text2)',
        background: active ? 'var(--primary)' : 'var(--bg3)',
        border: '1px solid ' + (active ? 'var(--primary)' : 'var(--border)'),
        borderRadius: 'var(--r)', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 14 }}>{item.icon}</span>
        {item.label}
      </button>
    )
  }
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
      padding: '11px 20px', fontSize: 13.5, fontWeight: active ? 700 : 500,
      color: active ? 'var(--primary)' : 'var(--text2)',
      background: active ? 'var(--primary-bg)' : 'none',
      border: 'none', borderLeft: `3px solid ${active ? 'var(--primary)' : 'transparent'}`,
      cursor: 'pointer', transition: '0.15s',
    }}>
      <span style={{ fontSize: 15 }}>{item.icon}</span>
      {item.label}
    </button>
  )
}
