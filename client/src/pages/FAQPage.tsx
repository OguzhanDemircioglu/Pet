import { useState } from 'react'
import InfoBar from '../components/InfoBar'
import Header from '../components/Header'
import CategoryBar from '../components/CategoryBar'
import Footer from '../components/Footer'
import { useIsMobile } from '../hooks/useIsMobile'

interface Faq { q: string; a: string }

const FAQS: Faq[] = [
  {
    q: 'Ürünleriniz orijinal mi?',
    a: 'Evet. Satışa sunduğumuz tüm ürünler yetkili tedarikçilerden temin edilir ve %100 orijinallik garantisiyle gönderilir.',
  },
  {
    q: 'Siparişim ne kadar sürede ulaşır?',
    a: 'Siparişleriniz genellikle 24 saat içinde hazırlanır ve bulunduğunuz bölgeye göre 1–5 iş günü içinde teslim edilir.',
  },
  {
    q: 'Hangi kargo firmasıyla gönderim yapıyorsunuz?',
    a: 'Siparişleriniz, hızlı ve güvenli teslimat için anlaşmalı olduğumuz kargo firmalarıyla gönderilir. (Yoğunluğa göre firma değişebilir.)',
  },
  {
    q: 'Hangi ödeme yöntemlerini kullanabilirim?',
    a: 'Kredi kartı, banka kartı ve kapıda ödeme seçenekleri mevcuttur. Tüm ödeme işlemleri güvenli altyapı üzerinden gerçekleştirilir.',
  },
  {
    q: 'İade ve değişim süreci nasıl işliyor?',
    a: 'Teslim aldığınız ürünü, belirlenen süre içinde kolayca iade edebilir veya değiştirebilirsiniz. Detaylı bilgi için "İade ve Değişim" sayfamızı inceleyebilirsiniz.',
  },
  {
    q: 'Sipariş verirken nelere dikkat etmeliyim?',
    a: 'Ürün seçimi, adet bilgisi, teslimat adresi ve iletişim bilgilerinin doğru olduğundan emin olun. Bu, siparişinizin sorunsuz ulaşmasını sağlar.',
  },
  {
    q: 'Ürünlerin son kullanma tarihini nereden görebilirim?',
    a: 'Tüm ürünlerin son kullanma tarihi ürün sayfasında ve ambalaj üzerinde belirtilir. Teslim aldıktan sonra kontrol etmenizi öneririz.',
  },
]

const EXTRA: Faq[] = [
  {
    q: 'Mama veya ürün seçerken nelere dikkat etmeliyim?',
    a: 'Evcil hayvanınızın yaşı, ırkı, kilosu ve özel ihtiyaçlarına uygun ürünleri tercih etmeniz önemlidir. Kararsız kalırsanız destek ekibimiz yardımcı olabilir.',
  },
  {
    q: 'Hasarlı ürün gelirse ne yapmalıyım?',
    a: 'Kargoyu teslim alırken paketi kontrol etmenizi öneririz. Hasar durumunda tutanak tutturup bizimle iletişime geçebilirsiniz.',
  },
  {
    q: 'Siparişimi nasıl takip edebilirim?',
    a: 'Siparişiniz kargoya verildiğinde size bir takip numarası iletilir. Bu numara ile kargo sürecini anlık olarak takip edebilirsiniz.',
  },
  {
    q: 'Toplu sipariş veya özel indirim var mı?',
    a: 'Dönemsel kampanyalar ve belirli ürünlerde toplu alım indirimleri sunulabilir. Güncel fırsatlar için kampanyalar sayfasını takip edebilirsiniz.',
  },
]

function Item({ item, open, onToggle }: { item: Faq; open: boolean; onToggle: () => void }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--r2)', marginBottom: 10, overflow: 'hidden',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, padding: '16px 18px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left', color: 'var(--text)',
          fontSize: 15, fontWeight: 700, lineHeight: 1.4,
        }}
      >
        <span>{item.q}</span>
        <span style={{
          fontSize: 20, color: 'var(--primary)', fontWeight: 900,
          transform: open ? 'rotate(45deg)' : 'rotate(0)',
          transition: 'transform 0.2s', flexShrink: 0,
        }}>+</span>
      </button>
      {open && (
        <div style={{
          padding: '0 18px 18px', fontSize: 14, color: 'var(--text2)', lineHeight: 1.7,
        }}>
          {item.a}
        </div>
      )}
    </div>
  )
}

export default function FAQPage() {
  const isMobile = useIsMobile()
  const [openIdx, setOpenIdx] = useState<string | null>('main-0')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <InfoBar />
      <Header />
      <CategoryBar />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '20px 16px 40px' : '36px 24px 56px' }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: 'var(--text)', marginBottom: 10, letterSpacing: -0.5 }}>
          Sıkça Sorulan Sorular
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 24 }}>
          Müşterilerimizin en çok sorduğu soruları aşağıda bir araya getirdik. Aradığınızı bulamazsanız bize
          iletişim sayfasından ulaşabilirsiniz.
        </p>

        <div style={{ marginBottom: 24 }}>
          {FAQS.map((f, i) => {
            const id = `main-${i}`
            return (
              <Item key={id} item={f} open={openIdx === id}
                    onToggle={() => setOpenIdx(openIdx === id ? null : id)} />
            )
          })}
        </div>

        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>
          Ek Bilgiler
        </h2>
        {EXTRA.map((f, i) => {
          const id = `extra-${i}`
          return (
            <Item key={id} item={f} open={openIdx === id}
                  onToggle={() => setOpenIdx(openIdx === id ? null : id)} />
          )
        })}
      </div>

      <Footer />
    </div>
  )
}
