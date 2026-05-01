import type { Metadata } from 'next'
import { fetchSiteSettings } from '@/lib/api/server'
import { FALLBACK_SITE_SETTINGS } from '@/lib/fallbacks'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description: 'PetToptan gizlilik politikası ve KVKK aydınlatma metni.',
}

export default async function PrivacyPolicyPage() {
  const s = (await fetchSiteSettings()) ?? FALLBACK_SITE_SETTINGS
  const BRAND = `${s.brandPart1}${s.brandPart2}`
  const CONTACT_EMAIL = s.contactEmail

  const h2: React.CSSProperties = { fontSize: 19, fontWeight: 800, color: 'var(--text)', marginTop: 28, marginBottom: 10 }
  const p: React.CSSProperties = { fontSize: 14.5, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 12 }
  const li: React.CSSProperties = { fontSize: 14.5, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 6 }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '36px 24px 56px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', marginBottom: 10, letterSpacing: -0.5 }}>
          Gizlilik Politikası ve KVKK Aydınlatma Metni
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>
          Son güncelleme: {new Date().getFullYear()}
        </p>

        <p style={p}><strong>{BRAND}</strong> olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında kişisel verilerinizin gizliliğine ve güvenliğine önem veriyoruz.</p>

        <h2 style={h2}>1. Veri Sorumlusu</h2>
        <p style={p}>
          Kişisel verileriniz, veri sorumlusu sıfatıyla {BRAND} tarafından işlenmektedir. İletişim için: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--primary)' }}>{CONTACT_EMAIL}</a>
        </p>

        <h2 style={h2}>2. İşlenen Kişisel Veriler</h2>
        <ul style={{ paddingLeft: 22, margin: 0 }}>
          <li style={li}><strong>Kimlik:</strong> ad, soyad</li>
          <li style={li}><strong>İletişim:</strong> e-posta, telefon, teslimat adresi</li>
          <li style={li}><strong>Sipariş ve ödeme:</strong> sepet içeriği, fatura bilgileri, ödeme işlem kayıtları</li>
          <li style={li}><strong>Teknik:</strong> IP, tarayıcı bilgisi, çerezler, oturum bilgileri</li>
        </ul>

        <h2 style={h2}>3. İşlenme Amaçları</h2>
        <ul style={{ paddingLeft: 22, margin: 0 }}>
          <li style={li}>Sipariş alma, hazırlama, teslim etme ve satış sonrası destek sağlama</li>
          <li style={li}>Kullanıcı hesabı oluşturma, kimlik doğrulama ve güvenliği sağlama</li>
          <li style={li}>Fatura ve yasal belge düzenleme</li>
          <li style={li}>Şikayet, iade ve iletişim taleplerinin yönetilmesi</li>
          <li style={li}>Yasal yükümlülüklerin yerine getirilmesi</li>
        </ul>

        <h2 style={h2}>4. Veri Aktarımı</h2>
        <p style={p}>
          Kişisel verileriniz; kargo firması, ödeme altyapısı sağlayıcıları (iyzico, PayTR) ve yasal olarak yetkili kamu kurum/kuruluşlarıyla sınırlı şekilde paylaşılabilir. Pazarlama amacıyla üçüncü taraflara satılmaz.
        </p>

        <h2 style={h2}>5. Saklama Süresi</h2>
        <p style={p}>Kişisel verileriniz, ilgili mevzuatın öngördüğü süreler boyunca saklanır. Sürenin sonunda silinir, yok edilir veya anonimleştirilir.</p>

        <h2 style={h2}>6. KVKK Haklarınız</h2>
        <p style={p}>
          KVKK'nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini, silinmesini ve zararınızın giderilmesini talep etme haklarınız bulunmaktadır.
        </p>
        <p style={p}>
          Taleplerinizi <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--primary)' }}>{CONTACT_EMAIL}</a> adresine iletebilirsiniz.
        </p>

        <h2 style={h2}>7. Çerez Politikası</h2>
        <p style={p}>Sitemizde zorunlu çerezler kullanılmaktadır. Tarayıcı ayarlarınızdan devre dışı bırakabilirsiniz.</p>

        <h2 style={h2}>8. Güncellemeler</h2>
        <p style={p}>Bu politika, yasal değişiklikler halinde güncellenebilir. Güncel metin bu sayfada yayımlanır.</p>
      </div>
    </div>
  )
}
