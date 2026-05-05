# PetToptan — Proje Vizyonu (2026-05-05 yenileme)

> **Bu dokümanın amacı:** projeyi devralan herhangi biri (gelecekteki sen dahil) bu dosyayı okuyarak "ne yapıyoruz, neden, hangi kararları aldık" sorularına 5 dakikada cevap bulabilsin.
>
> Mevcut teknik mimari için → [PROJECT.md](PROJECT.md)
> Aktif implementasyon planı için → `C:\Users\oguzh\.claude\plans\kullan-c-ye-olur-iken-joyful-taco.md`

---

## 1. Proje Nedir?

PetToptan **iki yüze sahip** bir SaaS platformudur:

```
ASIL ÜRÜN: Stok takip + satış kaydı SaaS
  → Pet shop sahibi kayıt olur, ürünlerini ekler, stoğunu takip eder, satışlarını kaydeder
  → Plan kısıtlaması YOK, sadece stok limiti farklı (50 / 200 / sınırsız)

İKİNCİL: Multi-tenant marketplace (opt-in)
  → Her ürün varsayılan: 🔒 Sadece envanterde
  → Toggle ile satışa açar → marketplace'te görünür
  → "Hepsini satışa aç" toplu buton da var
  → CUSTOMER (alıcı) kayıt olup gez/öde/çıkar — Trendyol-style basit akış

İŞ MODELİ: SaaS abonelik geliri (FREE 0 / PRO 500₺/ay / PRO+ 2000₺/ay)
  → Komisyon kesilmez (BYOM ödeme — kullanıcı kendi iyzico API key'ini bağlar)
  → Marketplace yüzü kullanıcı kazanma kanalı, asli gelir SaaS aboneliği
```

### Önceki vizyondan farkı

Proje başlangıçta "B2B toptan pet ürünleri marketplace" olarak doğdu. Backend zamanla multi-tenant SaaS'a doğru evrildi (companies/users/plans/audit), ancak public yüz hâlâ marketplace odaklı kaldı. Bu yenileme **iki yüzü ayırarak** asıl ürünü öne çıkarır:

- ❌ Eski: Anasayfa "Çok Satanlar / İndirimli Ürünler" (pure marketplace)
- ✅ Yeni: Anasayfa "Pet shop'unuz için stok takip" (pure SaaS lansman)
- ❌ Eski: Marketplace ana, SaaS gizli kayıt formunda
- ✅ Yeni: SaaS ana, marketplace `/magaza` altında ikincil ve opt-in

---

## 2. Niş & Marka

- **Marka:** PetToptan kalır, pet shop odaklı pazarlama
- **Mimari:** Genel sektörlere açık (gelecekte herhangi bir küçük işletme stok takibi yapabilir)
- **Domain:** pettoptan.com.tr
- **Logo:** 🐾 emoji + "Pet" (kırmızı) "Toptan" (açık mavi)
- **Tagline:** "Pet shop'unuz için stok ve satış takibi — FREE plandan başlayın"

Niş kasıtlı olarak dar tutulur (pet) çünkü:
- "Her sektör için" jenerik mesaj satılmaz, dominant Logo/Mikro/Paraşüt'le kıyaslanır
- Pet shop'lar yeterince büyük bir niş (Türkiye'de ~5000+)
- Niş dominate edildikten sonra mimari yeniden adlandırma ile başka sektörlere açılır

---

## 3. Kullanıcı Tipleri (Roller)

| Rol | Tarif | MVP'de aktif? |
|---|---|---|
| **SUPERADMIN** | PetToptan sahibi (sen). Tüm tenant'lara erişim, impersonation, audit | ✅ |
| **ADMIN** (branch_id=NULL) | Bayi sahibi. Şirketin tüm şubelerini yönetir, plan değiştirir | ✅ |
| **ADMIN** (branch_id=X) | Şube müdürü. Sadece kendi şubesinin verilerini görür | ✅ |
| **STAFF** | Şubede çalışan, sınırlı yetki | ❌ Faz 2 (enum'da hazır, kullanılmaz) |
| **CUSTOMER** | Bireysel alışverişçi. `/magaza`'dan gez/öde/çıkar | ✅ |

### Hierarchy

```
SUPERADMIN (sen, company_id=NULL)
  ├── impersonate → Şirket A (Mavi Pet Shop)
  │     ├── ADMIN (branch_id=NULL) — Bayi sahibi
  │     ├── Şube 1 (Kadıköy)
  │     │   ├── ADMIN (branch_id=1) — Şube müdürü
  │     │   ├── (Faz 2) STAFF
  │     │   └── branch_inventory (şube-bazlı stok)
  │     └── Şube 2 (Beşiktaş)
  └── ... diğer şirketler

CUSTOMER (her zaman branch_id=NULL, default company)
  └── Marketplace'ten alışveriş
```

---

## 4. Site Yapısı

### Subdomain ayrımı

| URL | Kim görür | İçerik |
|---|---|---|
| `markaadı.com/` | Misafir | Pure SaaS lansman (hero + plan tablosu + CTA) |
| `markaadı.com/magaza` | Misafir + CUSTOMER | Marketplace anasayfa (HeroCarousel, CategoryGrid, ProductSection) |
| `markaadı.com/urun/[slug]`, `/kategori/[slug]`, `/sepet`, `/odeme/*` | Misafir + CUSTOMER | E-ticaret akışı |
| `markaadı.com/giris`, `/kayit`, `/dogrula`, `/sifre-*` | Misafir | Auth (yenilenmiş sol panel: stok-takip mesajı + mini dashboard preview) |
| `markaadı.com/profil` | CUSTOMER | Sadece "bilgilerim/siparişlerim/adresler" |
| `markaadı.com/yonetim/*` (Faz 2: `app.markaadı.com`) | ADMIN/STAFF | Admin paneli — pano, ürünler, satışlar, şubeler, kullanıcılar, ayarlar |
| `markaadı.com/super-admin/*` | SUPERADMIN | Süperadmin paneli — tenant tablosu, impersonation |

### Login akışı

```
Login submit → role check
  ├─ ADMIN/STAFF   → /yonetim/pano (admin paneli, asli ekran)
  ├─ SUPERADMIN    → /super-admin (süperadmin paneli)
  └─ CUSTOMER      → /magaza (marketplace anasayfa)
```

### Geçişler (UI butonları)

```
[Admin paneli]                          [Satış sitesi]
   topbar: 🛍️ Satışa Geç     ─────►       /magaza
   /yonetim/*                ◄─────       header: 🛠️ Admin'e Dön (sadece ADMIN'e görünür)
```

CUSTOMER login için "Admin'e Dön" butonu görünmez. Header rol-bazlı dinamik.

---

## 5. Plan Kademeleri

| Plan | Stok limiti | Aylık ücret | Şirket doğrulama | Tüm fonksiyonlar |
|---|---|---|---|---|
| FREE | 50 ürün | 0 ₺ | Opsiyonel | ✅ |
| PRO | 200 ürün | 500 ₺ | Opsiyonel | ✅ |
| PRO+ | sınırsız | 2000 ₺ | Opsiyonel | ✅ |

**Önemli:** Plan kısıtlaması YOK. Tüm fonksiyon her planda açık (çoklu kullanıcı, şube, kart ödeme, e-fatura, audit, API key, bildirim — hepsi). **Tek fark stok limiti.**

Üyelik mesajı net: *"50 üründen fazlasını yöneteceksin, sadece o zaman öde."*

PRO upgrade akışı (MVP):
1. Tenant dashboard'da "PRO'ya yükselt" butonuna basar
2. "İletişime Geç" yönlendirmesi (manuel, MVP)
3. Sen havale alır, super-admin panelinden plan'ı yükseltirsin
4. (Faz 3) iyzico Subscription API ile otomatik aylık tahsilat

---

## 6. Ödeme Modeli — BYOM (Bring Your Own Merchant)

Her tenant kendi iyzico hesabını açar, API key'ini bizim sisteme girer. Bizim backend ödeme akışında **proxy gibi** çalışır.

```
Müşteri ödeme yapar
       ↓
   Bizim backend (proxy)
       ↓
   Mavi Pet Shop'un iyzico API key'i (DB'de şifreli)
       ↓
   iyzico → Mavi Pet Shop'un kendi hesabı
       ↓
   Para direkt Mavi Pet Shop'a (sen aradan geçmedin)
```

### Avantajlar

- Sen **iyzico Marketplace başvurusu yapmana gerek yok**
- Yasal kayyumluk YOK (kasanda başkasının parası dolaşmıyor)
- Vergi/muhasebe yükü tenant'ta
- Sen sadece teknoloji sağlayıcısısın

### Aynı mantık e-fatura için de geçerli

- Tenant kendi Paraşüt/Logo/Mikro hesabını açar
- API key'ini sisteme ekler
- Sistem otomatik fatura keser tenant'ın hesabından

### Tenant onboarding

iyzico hesabı: 1-2 hafta (ticaret sicil + vergi levhası + IBAN doğrulama)
e-fatura entegratörü: 1 hafta
**Tenant'a açık iletişim + onboarding rehberi şart.** MVP'de basit Markdown rehber yeter.

### FREE plan davranışı

- Kart bağlamak **opsiyonel** — bağlamamış FREE tenant satışlarını nakit/havale ile alır
- API key girmiş FREE tenant kart ödemesi alabilir (plan kısıtlaması yok)

---

## 7. Marketplace Yüzü — Opt-in Model

Tenant ürün eklediğinde **varsayılan: 🔒 Sadece envanterde** (stok takip).

```
Ürün eklendi → varsayılan: 🔒 Sadece envanterde (marketplace'te görünmez)
                              ↓
                       Kullanıcı toggle'ı açar
                              ↓
                    📤 Satışa açıldı (marketplace'te görünür)
```

UI'da:
- **Ürünler tablosunda her satırda toggle**: ✅ Açık / ❌ Kapalı
- **Üstte toplu buton**: "Hepsini satışa aç"
- Marketplace endpoint sadece `listed_for_sale=true` ürünleri döndürür

Bu, "biz e-ticaret değiliz, stok takipiz; sat-mak isteyen aksini söyler" mesajını **operasyonel** olarak kuruyor.

### Teslimat & ödeme yöntemleri (satıcı seçer)

| | Yerel teslimat | Kargo |
|---|---|---|
| **Kapıda nakit** | ✓ kurye/kendi → satıcı | ✓ kargocu tahsilat (PTT, Yurtiçi) |
| **Havale/EFT** | ✓ alıcı IBAN'a atar | ✓ aynı |
| **Online kart (BYOM)** | ✓ tenant iyzico API key gerekli | ✓ aynı |

Yerel teslimatta satıcıdan: harita pin + maks yarıçap (km).
Alıcıdan konum: hibrit (browser geolocation öner + manuel il/ilçe fallback), KVKK uyumlu, oturumluk (DB'ye yazılmaz).

### CUSTOMER deneyimi

> "Gez, öde, çık." — Trendyol benzeri basit akış. Mevcut UI (kategori, ürün detay, sepet, ödeme) korunur.

---

## 8. Süperadmin Deneyimi

### Asıl ihtiyaç

> "Kullanıcılar sıkıntı yaşadığında bana soru soracaklar, benimde gerekli fix i verebilmeliyim arayüz üzerinden, herkes anlattığım konuyu anlamayabilir."

Yani **müşteri destek odaklı** — bir tenant'a "geçip" o tenant gibi davranıp sorunu çözmek.

### İki seviye impersonation

```
Süperadmin paneli /super-admin
├── Tüm şirketler tablosu
│   └── "Mavi Pet Shop'a Gir (bayi sahibi olarak)" → ADMIN, branch_id=NULL
│       └── Tüm şubeleri görürsün, şirket-level ayar değiştirirsin
│
└── Bir şirketin şubeleri
    └── "Mavi Pet Shop / Kadıköy'e Gir (şube müdürü olarak)" → ADMIN, branch_id=Kadıköy
        └── Sadece Kadıköy'ün stoğu, satışları görünür, sanki Kadıköy müdürüymüşsün gibi
```

İmpersonation aktifken **üst sticky bant**: `⚠️ Süperadmin olarak Mavi Pet Shop/Kadıköy oturumundasın · [← Çıkış]`

Çıkışta JWT eski hâline döner. Her aksiyonun `audit_log.performed_as_superadmin = true` olarak işaretlenir (yasal+etik şeffaflık).

---

## 9. UI Tasarım Felsefesi (Admin Paneli)

> "Basit ve keskin tutalım, kalitemiz orası."

- **Tek primary renk** (kırmızı `#dc2626`) + nötr ton paleti
- **Linear / Stripe / Vercel** referans estetik
- **Inter**, 14-15px gövde, başlıklar 18-24px bold
- **Beyaz alan cömert**, sıkışık değil
- **Animasyon ölçülü** — 200ms fade/slide, "wow factor" yok
- **Bilgi yoğunluğu yüksek ama temiz**
- **Dark mode** korunur (mevcut altyapı var)

### Layout

```
┌──────────────┬───────────────────────────────────────────────┐
│              │  Topbar: [sayfa başlığı]  🔔  🛍️ Satışa Geç  👤│
│   SIDEBAR    ├───────────────────────────────────────────────┤
│   264px      │                                                │
│              │  İçerik alanı                                  │
│  YÖNETİM     │                                                │
│  🏠 Pano     │                                                │
│  📦 Ürünler  │                                                │
│  🛒 Satışlar │                                                │
│  📍 Şubeler  │                                                │
│  👥 Kullanıcı│                                                │
│  📊 Aktivite │                                                │
│              │                                                │
│  AYARLAR     │                                                │
│  💳 Ödeme    │                                                │
│  🔑 API      │                                                │
│  ⚙️ Ayarlar  │                                                │
│              │                                                │
│  ────────    │                                                │
│  FREE Plan   │                                                │
│  47/50 ürün  │                                                │
│  [Yükselt →] │                                                │
└──────────────┴───────────────────────────────────────────────┘
```

Plan kısıtlaması olmadığı için **kilitli ikon (🔒) yok** — tüm sayfalar tüm planlara açık.

---

## 10. Onboarding

Kayıt sonrası dashboard'a düşer. Üstte hafif onboarding kartı:

```
┌─ 🎉 Hoş geldin Ali! Mavi Pet Shop hesabın hazır ─────────┐
│ Başlamak için 2 adım:                                    │
│ ┌──────┐  ┌──────┐                                       │
│ │ ① 📦 │  │ ② 💰 │                                       │
│ │ İlk  │  │ İlk  │                                       │
│ │ ürün │  │ satış│                                       │
│ │ ekle │  │ kayıt│                                       │
│ └──────┘  └──────┘                                       │
└──────────────────────────────────────────────────────────┘
```

Tamamlandıkça checkmark, hepsi tamamlanınca panel kaybolur.

Opsiyonel ek kartlar (zorunsuz, kalıcı):
- 📤 Ürünleri satışa aç
- 💳 iyzico API key bağla (kart için)
- ✓ Şirketi doğrula (rozet için)

---

## 11. Bildirim Sistemi

İki kanal:
- **Ekran içi 🔔** — header'da ikon, dropdown panel
- **Telegram bot** — merkezi `@PetToptanBot`, tenant /start atar, kod alır, dashboard'da girer (eşleşme)

**WhatsApp YOK** — eski memory'deki CallMeBot referansı geçersiz.

| Olay | Ekran | Telegram |
|---|---|---|
| Yeni sipariş | ✓ | ✓ |
| Düşük stok uyarısı | ✓ | ✓ |
| PRO upgrade onaylandı | ✓ | ✓ |
| Şirket doğrulama tamam | ✓ | ✓ |
| Kritik sistem hatası | — | ✓ (sadece super-admin'e) |

---

## 12. Yol Haritası

### MVP (tek sürüm, hedef 6-8 hafta · gerçekçi 10-12 hafta)

11 sprint sıralı (detaylar plan dosyasında):
1. Backend mimari hazırlık (entity'ler + migration'lar)
2. Anasayfa SaaS lansman + login redesign
3. Admin paneli yeniden (sidebar/topbar/pano)
4. "Satışa Aç" toggle + toplu buton
5. Şube yönetimi UI + branch inventory
6. Süperadmin paneli + impersonation
7. BYOM ödeme (iyzico)
8. BYOM e-fatura (Paraşüt)
9. Telegram bot bildirim + ekran panel
10. Marketplace polish + CUSTOMER kayıt + sipariş akışı
11. Test + bug fix + memory güncelleme

**Sprint 5 sonu** zaten satılabilir saf SaaS. Marketplace tarafı (sprint 7-10) kapalı beta sonrası eklenebilir.

### Faz 2 (MVP sonrası)

- STAFF rolünün gerçek kullanılması (yetki tablosu, şube içi sınırlı kullanıcı)
- Subdomain ayrımı (`app.markaadı.com`)
- Şirket doğrulama (vergi levhası yükleme + super-admin onay)

### Faz 3 (uzun vadeli)

- PRO+ custom domain (Host header → tenant tespit, white-label)
- iyzico Subscription API ile otomatik PRO abonelik
- 3rd party marketplace entegrasyonu (Trendyol, Hepsiburada API ile stok push)
- Mobile uygulama
- AI destekli stok tahminleme

---

## 13. Risk Notları

- **Tek kişi büyük scope.** 6-8 hafta hedefi tutmak için Sprint 7-10 (marketplace+BYOM) MVP'den çıkarılırsa MVP "saf SaaS" olarak çıkar (~5 hafta), sonra Faz 1.5 ile marketplace eklenir
- **Yayında olmadan uzun süre.** 10 hafta yayın yok = geri bildirim yok. Sprint 5 sonunda **kapalı beta** (10-15 pet shop) açmak öğrenme açısından kritik
- **BYOM onboarding yükü.** Tenant iyzico hesabı 1-2 hafta + e-fatura 1 hafta. Açık iletişim + Markdown rehber MVP'de yeter
- **Kıyaslama.** Logo, Mikro, Paraşüt zaten Türkiye'de oturmuş. PetToptan'ın farkı: pet shop'a özelleşmiş + marketplace bağı + ücretsiz başlangıç. Bu farkı anasayfa copy'sinde net vurgu

---

## 14. İlgili Dosyalar

- **Bu doküman:** `docs/PROJECT-VIZYON.md` — vizyon ve karar referansı
- **Teknik mimari:** `docs/PROJECT.md` — sayfalar, modüller, endpoint'ler, stack
- **Aktif plan:** `C:\Users\oguzh\.claude\plans\kullan-c-ye-olur-iken-joyful-taco.md` — sprint listesi + verification
- **Memory index:** `C:\Users\oguzh\.claude\projects\D--Projeler-Pet\memory\MEMORY.md`
- **Anasayfa tasarım notları:** `docs/plans/2026-05-04-anasayfa-design.md`
- **Mockup'lar (eski):** `D:/Projeler/mockup-anasayfa.html`, `mockup-login.html`, `mockup-profil.html`, `mockup-urun-detay.html` — yapıları korunur, mesajlar SaaS odağına revize

---

*Son güncelleme: 2026-05-05. Vizyon değişikliği halinde bu doküman önce güncellenmeli, sonra implementasyon planı.*
