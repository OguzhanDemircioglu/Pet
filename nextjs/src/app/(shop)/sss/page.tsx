import type { Metadata } from 'next'
import FAQClient from './FAQClient'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Sıkça Sorulan Sorular',
  description: 'PetToptan SSS — sipariş, kargo, iade ve ödeme hakkında merak ettiğiniz her şey.',
}

const FAQS = [
  { q: 'Ürünleriniz orijinal mi?', a: 'Evet. Satışa sunduğumuz tüm ürünler yetkili tedarikçilerden temin edilir ve %100 orijinallik garantisiyle gönderilir.' },
  { q: 'Siparişim ne kadar sürede ulaşır?', a: 'Siparişleriniz genellikle 24 saat içinde hazırlanır ve bulunduğunuz bölgeye göre 1–5 iş günü içinde teslim edilir.' },
  { q: 'Hangi kargo firmasıyla gönderim yapıyorsunuz?', a: 'Siparişleriniz, hızlı ve güvenli teslimat için anlaşmalı olduğumuz kargo firmalarıyla gönderilir. (Yoğunluğa göre firma değişebilir.)' },
  { q: 'Hangi ödeme yöntemlerini kullanabilirim?', a: 'Kredi kartı, banka kartı ve kapıda ödeme seçenekleri mevcuttur. Tüm ödeme işlemleri güvenli altyapı üzerinden gerçekleştirilir.' },
  { q: 'İade ve değişim süreci nasıl işliyor?', a: 'Teslim aldığınız ürünü, belirlenen süre içinde kolayca iade edebilir veya değiştirebilirsiniz. Detaylı bilgi için bize ulaşabilirsiniz.' },
  { q: 'Sipariş verirken nelere dikkat etmeliyim?', a: 'Ürün seçimi, adet bilgisi, teslimat adresi ve iletişim bilgilerinin doğru olduğundan emin olun.' },
  { q: 'Ürünlerin son kullanma tarihini nereden görebilirim?', a: 'Tüm ürünlerin son kullanma tarihi ürün sayfasında ve ambalaj üzerinde belirtilir.' },
  { q: 'Mama veya ürün seçerken nelere dikkat etmeliyim?', a: 'Evcil hayvanınızın yaşı, ırkı, kilosu ve özel ihtiyaçlarına uygun ürünleri tercih etmeniz önemlidir.' },
  { q: 'Hasarlı ürün gelirse ne yapmalıyım?', a: 'Kargoyu teslim alırken paketi kontrol etmenizi öneririz. Hasar durumunda tutanak tutturup bizimle iletişime geçebilirsiniz.' },
  { q: 'Siparişimi nasıl takip edebilirim?', a: 'Siparişiniz kargoya verildiğinde size bir takip numarası iletilir. Bu numara ile kargo sürecini anlık olarak takip edebilirsiniz.' },
  { q: 'Toplu sipariş veya özel indirim var mı?', a: 'Dönemsel kampanyalar ve belirli ürünlerde toplu alım indirimleri sunulabilir. Güncel fırsatlar için kampanyalar sayfasını takip edebilirsiniz.' },
]

export default function FAQPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FAQClient faqs={FAQS} />
    </>
  )
}
