import InfoBar from '../components/InfoBar'
import Header from '../components/Header'
import CategoryBar from '../components/CategoryBar'
import Footer from '../components/Footer'
import { useIsMobile } from '../hooks/useIsMobile'
import { useSiteSettings } from '../hooks/useSiteSettings'

export default function PrivacyPolicyPage() {
  const isMobile = useIsMobile()
  const s = useSiteSettings()
  const CONTACT_EMAIL = s.contactEmail
  const BRAND = `${s.brandPart1}${s.brandPart2}`

  const h2: React.CSSProperties = {
    fontSize: isMobile ? 17 : 19, fontWeight: 800, color: 'var(--text)',
    marginTop: 28, marginBottom: 10,
  }
  const p: React.CSSProperties = {
    fontSize: 14.5, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 12,
  }
  const li: React.CSSProperties = {
    fontSize: 14.5, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 6,
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <InfoBar />
      <Header />
      <CategoryBar />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '20px 16px 40px' : '36px 24px 56px' }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: 'var(--text)', marginBottom: 10, letterSpacing: -0.5 }}>
          Gizlilik Politikası ve KVKK Aydınlatma Metni
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>
          Son güncelleme: {new Date().getFullYear()}
        </p>

        <p style={p}>
          <strong>{BRAND}</strong> olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında
          kişisel verilerinizin gizliliğine ve güvenliğine önem veriyoruz. Bu metin, veri sorumlusu sıfatıyla
          kişisel verilerinizi hangi amaçla işlediğimizi, kimlerle paylaştığımızı ve haklarınızı açıklamak amacıyla
          hazırlanmıştır.
        </p>

        <h2 style={h2}>1. Veri Sorumlusu</h2>
        <p style={p}>
          Kişisel verileriniz, veri sorumlusu sıfatıyla {BRAND} tarafından işlenmektedir. Veri işleme faaliyetlerine
          ilişkin iletişim için <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--primary)' }}>{CONTACT_EMAIL}</a> adresini
          kullanabilirsiniz.
        </p>

        <h2 style={h2}>2. İşlenen Kişisel Veriler</h2>
        <p style={p}>Sizden aşağıdaki kişisel verileri topluyoruz:</p>
        <ul style={{ paddingLeft: 22, margin: 0 }}>
          <li style={li}><strong>Kimlik:</strong> ad, soyad</li>
          <li style={li}><strong>İletişim:</strong> e-posta, telefon, teslimat adresi</li>
          <li style={li}><strong>Sipariş ve ödeme:</strong> sepet içeriği, fatura bilgileri, ödeme işlem kayıtları (kart bilgisi ödeme altyapısında tutulur, tarafımızda saklanmaz)</li>
          <li style={li}><strong>Teknik:</strong> IP, tarayıcı bilgisi, çerezler, oturum bilgileri</li>
        </ul>

        <h2 style={h2}>3. Kişisel Verilerin İşlenme Amaçları</h2>
        <ul style={{ paddingLeft: 22, margin: 0 }}>
          <li style={li}>Sipariş alma, hazırlama, teslim etme ve satış sonrası destek sağlama</li>
          <li style={li}>Kullanıcı hesabı oluşturma, kimlik doğrulama ve güvenliği sağlama</li>
          <li style={li}>Fatura ve yasal belge düzenleme</li>
          <li style={li}>Şikayet, iade ve iletişim taleplerinin yönetilmesi</li>
          <li style={li}>Kampanya, bildirim ve bilgilendirme e-postalarının gönderimi (yasal onay çerçevesinde)</li>
          <li style={li}>Yasal yükümlülüklerin yerine getirilmesi</li>
        </ul>

        <h2 style={h2}>4. Kişisel Verilerin Aktarımı</h2>
        <p style={p}>
          Kişisel verileriniz; siparişin tamamlanabilmesi için kargo firması, ödeme altyapısı sağlayıcıları (iyzico,
          PayTR), e-posta gönderim sağlayıcıları ve yasal olarak yetkili kamu kurum/kuruluşlarıyla sınırlı şekilde
          paylaşılabilir. Kişisel verileriniz hiçbir koşulda pazarlama amacıyla üçüncü taraflara satılmaz.
        </p>

        <h2 style={h2}>5. Saklama Süresi</h2>
        <p style={p}>
          Kişisel verileriniz, ilgili mevzuatın öngördüğü süreler (Vergi Usul Kanunu, Türk Ticaret Kanunu vb.)
          boyunca saklanır. Sürenin sonunda veriler silinir, yok edilir veya anonimleştirilir.
        </p>

        <h2 style={h2}>6. KVKK Kapsamındaki Haklarınız</h2>
        <p style={p}>
          KVKK'nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme,
          işlenme amacını ve uygun kullanılıp kullanılmadığını öğrenme, yurt içinde/dışında aktarıldığı üçüncü
          kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini isteme, silinmesini/yok edilmesini isteme ve
          zararınızın giderilmesini talep etme haklarına sahipsiniz.
        </p>
        <p style={p}>
          Taleplerinizi <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--primary)' }}>{CONTACT_EMAIL}</a> adresine
          iletebilirsiniz. Başvurularınız en geç 30 gün içerisinde sonuçlandırılır.
        </p>

        <h2 style={h2}>7. Çerez (Cookie) Politikası</h2>
        <p style={p}>
          Sitemizde kullanıcı deneyimini iyileştirmek ve temel özellikleri (oturum, sepet vb.) sağlamak amacıyla
          zorunlu çerezler kullanılmaktadır. Tarayıcı ayarlarınızdan çerezleri kapatabilirsiniz; ancak bu durumda
          bazı özelliklerde sınırlama yaşayabilirsiniz.
        </p>

        <h2 style={h2}>8. Güncellemeler</h2>
        <p style={p}>
          Bu politika, yasal değişiklikler veya hizmet kapsamında gerekli görülmesi halinde güncellenebilir.
          Güncel metin her zaman bu sayfada yayımlanır.
        </p>
      </div>

      <Footer />
    </div>
  )
}
