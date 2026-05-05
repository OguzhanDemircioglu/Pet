'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import InfoBar from '@/components/home/InfoBar'
import SiteHeader from '@/components/home/SiteHeader'
import SiteFooter from '@/components/home/SiteFooter'
import '@/app/home.css'
import './profil.css'

type Tab = 'orders' | 'addresses' | 'favorites' | 'info' | 'notifications'

const STATS = [
  { icon: '📦', val: '24', label: 'Toplam Sipariş' },
  { icon: '🚚', val: '2', label: 'Aktif Kargo' },
  { icon: '❤️', val: '18', label: 'Favori Ürün' },
  { icon: '💰', val: '₺12.4K', label: 'Toplam Harcama' },
]

const SAMPLE_ORDERS = [
  { id: '#PT-2026-0842', date: '8 Mart 2026', items: '3 ürün', detail: 'Royal Canin Yetişkin Kedi, Hill\'s Science Plan, +1 ürün', total: 1240, status: 'shipping' as const },
  { id: '#PT-2026-0791', date: '28 Şubat 2026', items: '5 ürün', detail: 'Purina Pro Plan Köpek, Whiskas Pouch, +3 ürün', total: 3680, status: 'delivered' as const },
  { id: '#PT-2026-0744', date: '15 Şubat 2026', items: '2 ürün', detail: 'JBL ProSilent Akvaryum Filtre, Tetra AquaSafe', total: 890, status: 'delivered' as const },
  { id: '#PT-2026-0701', date: '2 Şubat 2026', items: '1 ürün', detail: 'Acana Heritage Köpek Maması', total: 540, status: 'cancelled' as const },
]

const SAMPLE_ADDRESSES = [
  { id: 1, title: 'İşyeri', name: 'Ahmet Yılmaz', phone: '+90 532 000 00 00', city: 'İstanbul', district: 'Kadıköy', line: 'Caferağa Mah. Moda Cad. No:42 D:5', isDefault: true },
  { id: 2, title: 'Ev', name: 'Ahmet Yılmaz', phone: '+90 532 000 00 00', city: 'İstanbul', district: 'Üsküdar', line: 'Acıbadem Mah. Cumhuriyet Cad. No:18 D:9', isDefault: false },
]

const formatTL = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

const STATUS_LABELS: Record<typeof SAMPLE_ORDERS[number]['status'], { label: string; cls: string }> = {
  shipping: { label: '🚚 Kargoda', cls: 'pf-status-shipping' },
  delivered: { label: '✓ Teslim Edildi', cls: 'pf-status-delivered' },
  cancelled: { label: '✕ İptal Edildi', cls: 'pf-status-cancelled' },
}

const NAV_ITEMS: Array<{ key: Tab; label: string; icon: string; badge?: string }> = [
  { key: 'orders', label: 'Siparişlerim', icon: '📦', badge: '3' },
  { key: 'favorites', label: 'Favorilerim', icon: '❤️' },
  { key: 'addresses', label: 'Adreslerim', icon: '📍' },
  { key: 'info', label: 'Bilgilerim', icon: '👤' },
  { key: 'notifications', label: 'Bildirim Tercihleri', icon: '🔔' },
]

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('orders')

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/giris?callbackUrl=/profil')
  }, [status, router])

  const user = session?.user
  const initials = ((user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')).toUpperCase() || 'PT'
  const displayName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
    : 'Misafir'

  return (
    <>
      <InfoBar />
      <SiteHeader />
      <main className="pf-page">
        {/* SIDEBAR */}
        <aside className="pf-side">
          <div className="pf-card">
            <div className="pf-avatar-wrap">
              <div className="pf-avatar">{initials}</div>
              <button type="button" className="pf-avatar-edit" aria-label="Profil fotoğrafını değiştir">✎</button>
            </div>
            <div className="pf-name">{displayName}</div>
            <div className="pf-email">{user?.email ?? '-'}</div>
            <span className="pf-role">⭐ Bayi Hesap</span>
          </div>
          <nav className="pf-nav" aria-label="Profil menüsü">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`pf-nav-item${tab === item.key ? ' active' : ''}`}
                onClick={() => setTab(item.key)}
              >
                <span className="pf-nav-icon" aria-hidden="true">{item.icon}</span>
                {item.label}
                {item.badge && <span className="pf-nav-badge">{item.badge}</span>}
              </button>
            ))}
            <div className="pf-nav-divider" />
            <button type="button" className="pf-nav-item" style={{ color: 'var(--primary)' }}>
              <span className="pf-nav-icon" aria-hidden="true">🚪</span>
              Çıkış Yap
            </button>
          </nav>
        </aside>

        {/* MAIN */}
        <section className="pf-main">
          {/* Stats — her tab'da görünür */}
          <div className="pf-stats">
            {STATS.map((s) => (
              <div key={s.label} className="pf-stat">
                <div className="pf-stat-icon">{s.icon}</div>
                <div className="pf-stat-val">{s.val}</div>
                <div className="pf-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {tab === 'orders' && (
            <>
              <div className="pf-section-head">
                <div>
                  <h1 className="pf-section-title">📦 Siparişlerim</h1>
                  <div className="pf-section-sub">Son 6 ayda {SAMPLE_ORDERS.length} sipariş</div>
                </div>
                <button type="button" className="pf-btn-sm">Tümünü Gör</button>
              </div>
              <div className="pf-card-box">
                <div className="pf-card-head">
                  <span className="pf-card-title">Son Siparişler</span>
                  <button type="button" className="pf-btn-sm">Filtrele ▾</button>
                </div>
                {SAMPLE_ORDERS.map((o) => (
                  <div key={o.id} className="pf-order">
                    <div>
                      <div className="pf-order-id">{o.id}</div>
                      <div className="pf-order-date">{o.date} · {o.items}</div>
                      <div className="pf-order-items">{o.detail}</div>
                    </div>
                    <div className="pf-order-right">
                      <div className="pf-order-total">{formatTL(o.total)}</div>
                      <span className={`pf-status ${STATUS_LABELS[o.status].cls}`}>{STATUS_LABELS[o.status].label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'addresses' && (
            <>
              <div className="pf-section-head">
                <div>
                  <h1 className="pf-section-title">📍 Adreslerim</h1>
                  <div className="pf-section-sub">Kayıtlı sevkiyat adresleriniz</div>
                </div>
                <button type="button" className="pf-btn-sm" style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}>+ Yeni Adres</button>
              </div>
              <div className="pf-addr-grid">
                {SAMPLE_ADDRESSES.map((a) => (
                  <div key={a.id} className={`pf-addr${a.isDefault ? ' default' : ''}`}>
                    {a.isDefault && <span className="pf-addr-default-pill">VARSAYILAN</span>}
                    <div className="pf-addr-title">📍 {a.title}</div>
                    <div className="pf-addr-name">{a.name} · {a.phone}</div>
                    <div className="pf-addr-line">{a.line}, {a.district} / {a.city}</div>
                    <div className="pf-addr-actions">
                      <button type="button">Düzenle</button>
                      {!a.isDefault && <button type="button">Varsayılan Yap</button>}
                      <button type="button" style={{ color: 'var(--primary)' }}>Sil</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'favorites' && (
            <>
              <div className="pf-section-head">
                <div>
                  <h1 className="pf-section-title">❤️ Favorilerim</h1>
                  <div className="pf-section-sub">Beğendiğin ürünler</div>
                </div>
              </div>
              <div className="pf-card-box" style={{ padding: 56, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🤍</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Henüz favorin yok</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>Ürünleri kalp ikonuyla favorilere ekleyebilirsin.</div>
              </div>
            </>
          )}

          {tab === 'info' && (
            <>
              <div className="pf-section-head">
                <div>
                  <h1 className="pf-section-title">👤 Hesap Bilgileri</h1>
                  <div className="pf-section-sub">Profil bilgilerini güncelle</div>
                </div>
              </div>
              <div className="pf-card-box" style={{ padding: 26 }}>
                <div className="pf-form-grid">
                  <div className="pf-form-group">
                    <label htmlFor="pf-fn">Ad</label>
                    <input id="pf-fn" type="text" className="pf-form-input" defaultValue={user?.firstName ?? ''} />
                  </div>
                  <div className="pf-form-group">
                    <label htmlFor="pf-ln">Soyad</label>
                    <input id="pf-ln" type="text" className="pf-form-input" defaultValue={user?.lastName ?? ''} />
                  </div>
                </div>
                <div className="pf-form-group">
                  <label htmlFor="pf-em">E-posta</label>
                  <input id="pf-em" type="email" className="pf-form-input" defaultValue={user?.email ?? ''} disabled />
                </div>
                <div className="pf-form-group">
                  <label htmlFor="pf-ph">Telefon</label>
                  <input id="pf-ph" type="tel" className="pf-form-input" placeholder="+90 5XX XXX XX XX" />
                </div>
                <button type="button" className="pf-btn-primary">Değişiklikleri Kaydet</button>
              </div>
            </>
          )}

          {tab === 'notifications' && (
            <>
              <div className="pf-section-head">
                <div>
                  <h1 className="pf-section-title">🔔 Bildirim Tercihleri</h1>
                  <div className="pf-section-sub">Hangi bildirimleri almak istediğini seç</div>
                </div>
              </div>
              <div className="pf-card-box" style={{ padding: 26 }}>
                {[
                  { label: 'Sipariş güncellemeleri (e-posta)', checked: true },
                  { label: 'Sipariş güncellemeleri (SMS)', checked: true },
                  { label: 'Kampanya & indirim bildirimleri', checked: false },
                  { label: 'Stok geri geldi bildirimleri', checked: true },
                  { label: 'Haftalık bülten', checked: false },
                ].map((n, i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
                    <span style={{ fontSize: 14, color: 'var(--text)' }}>{n.label}</span>
                    <input type="checkbox" defaultChecked={n.checked} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                  </label>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
