# PetToptan — Proje Dokümantasyonu

**Site:** [pettoptan.com.tr](https://pettoptan.com.tr) · **Repository kökü:** `D:/Projeler/Pet/`
**Son güncelleme:** 2026-05-05

> ⚠️ **Vizyon yenilendi (2026-05-05).** Asıl ürün **stok takip + satış kaydı SaaS** olarak yeniden konumlandırıldı; marketplace yüzü ikincil ve opt-in. Vizyon ve karar tablosu için → **[PROJECT-VIZYON.md](PROJECT-VIZYON.md)**. Aktif implementasyon planı için → `C:\Users\oguzh\.claude\plans\kullan-c-ye-olur-iken-joyful-taco.md`. Aşağıdaki teknik mimari dokümantasyonu mevcut kodu tarif eder; vizyon değişikliklerinin kod tarafına yansıması sprint'lerle gelecek.

---

## 1. Proje Hakkında

**PetToptan**, Türkiye genelinde pet shop, klinik ve bayilere yönelik bir **multi-tenant SaaS stok takip ve satış kaydı platformudur**. Asıl ürün, işletmelerin kendi ürünlerini/stoğunu/satışlarını yönettiği SaaS yönetim panelidir. İkincil olarak **opt-in marketplace** yüzü vardır — tenant ürünlerini "satışa aç" toggle'ı ile marketplace'te listeleyebilir, müşteriler (CUSTOMER) gez/öde/çık akışıyla alışveriş yapabilir.

İki ayrı yüz vardır:

| Yüz | Hedef Kullanıcı | Görev |
|---|---|---|
| **Admin Dashboard** (`/yonetim/*`, ileride `app.markaadı.com`) | İşletme sahibi / şube müdürü | **Asıl ürün:** stok, satış, şube, kullanıcı, fatura, kampanya yönetimi |
| **Public Marketplace** (`markaadı.com/`, `/magaza`, `/urun/...`, `/sepet`) | Misafir / CUSTOMER | İkincil yüz: satışa açılmış ürünleri keşfet, sepet, ödeme |
| **Süperadmin** (`/super-admin/*`) | Site sahibi (sen) | Tüm tenant'lara erişim, iki seviye impersonation, audit |

İşletme tarafı **çok kiracılı (multi-tenant)** çalışır — her firma kendi ürünleri, kendi kullanıcıları, kendi
satışlarıyla izole edilmiş bir alan kullanır. **Plan kademeleri:**

| Plan | Stok limiti | Aylık ücret | Plan kısıtlaması |
|---|---|---|---|
| FREE | 50 ürün | 0 ₺ | Yok — tüm fonksiyon açık |
| PRO | 200 ürün | 500 ₺ | Yok — tüm fonksiyon açık |
| PRO+ | sınırsız | 2000 ₺ | Yok — tüm fonksiyon açık |

**Önemli:** Plan farkı sadece stok limiti. Çoklu kullanıcı, şube, kart ödeme (BYOM), e-fatura, audit, API key — hepsi her planda mevcut. Mesaj net: *"50 üründen fazlasını yöneteceksin, sadece o zaman öde."*

**Ödeme modeli — BYOM (Bring Your Own Merchant):** Tenant kendi iyzico/Paraşüt API key'lerini bağlar, bizim backend proxy gibi çalışır. Para tenant'ın kendi hesabına gider, biz aracı değiliz. SaaS abonelik geliri ayrı.

---

## 2. Yüksek Seviye Mimari

```
┌────────────────────────────────────────┐
│  Browser (TR)                          │
│  ┌──────────────────────────────────┐  │
│  │  Next.js 16 (App Router, ISR)    │  │
│  │  React 19 · TypeScript · NextAuth│  │
│  └────────────┬─────────────────────┘  │
└───────────────┼────────────────────────┘
                │ HTTPS · JSON
                ▼
┌────────────────────────────────────────┐
│  Spring Boot 3.2.5 (Java 17)           │
│  · 18 controller · Modulith yapısı     │
│  · JWT (HS256) auth                    │
└──┬──────────┬──────────┬──────────┬────┘
   │          │          │          │
   ▼          ▼          ▼          ▼
PostgreSQL  iyzico    Brevo      Cloudinary
(Aiven)     (3DS)     (e-mail)   (görsel)
schema:
petshop
   │
   └──── Flyway migration'lar (db/migration)
```

**Veri yolculuğu (örn. ürün detay sayfası):**

1. Tarayıcı `pettoptan.com.tr/urun/royal-canin-10kg` ister
2. Next.js Edge → ISR cache'te varsa anında HTML döner; yoksa Server Component
   `getProductBySlug(slug)` ile backend'e gider
3. Spring Boot `/products/{slug}` → `ProductService` → `ProductRepository`
   → PostgreSQL `petshop.products` tablosu
4. `DataGenericResponse<ProductResponse>` JSON wrapper olarak döner
5. RSC HTML render eder, browser'a gönderilir, ISR ile 5 dakika cache'lenir

---

## 3. Teknoloji Stack

### Backend (`server/`)

| Katman | Teknoloji | Sürüm | Not |
|---|---|---|---|
| Dil | Java | 17 | LTS, record + pattern matching |
| Framework | Spring Boot | 3.2.5 | Spring Modulith ile modül izolasyonu |
| Veritabanı | PostgreSQL | (Aiven Cloud) | Schema: `petshop` |
| ORM | Spring Data JPA + Hibernate | 6.x | `ddl-auto: update` (dev) |
| Migration | Flyway | 10.20.1 | `db/migration/V*.sql` |
| Auth | jjwt | 0.x | HS256, 15dk access + 7gün refresh |
| Validation | Jakarta Bean Validation | — | DTO-level `@Valid` |
| Rate-limit | Bucket4j | 8.10.1 | login + register endpoint'lerinde |
| Ödeme | iyzipay-java | 2.0.46 | 3D Secure dahil |
| Resim | Cloudinary HTTP44 | 1.38.0 | Upload + transform URL'leri |
| Fatura | iText 7 | — | PDF üretim + Paraşüt e-belge entegrasyonu |
| E-posta | Brevo SMTP | — | Transactional + verification kodu |
| Boilerplate | Lombok | — | `@RequiredArgsConstructor`, `@Data` |
| Test | JUnit 5 + Spring-test + Testcontainers | — | Postgres testcontainer ile |

### Frontend (`client/`)

| Katman | Teknoloji | Sürüm | Not |
|---|---|---|---|
| Framework | Next.js | 16.2.4 | App Router + Turbopack dev |
| UI | React | 19.2.4 | Server Components default |
| Dil | TypeScript | ^5 | strict mode |
| Stil | Tailwind CSS | ^4 | + scoped CSS module pattern (`home.css`, `urun.css`, …) |
| Auth | NextAuth (Auth.js) | 5.0.0-beta.31 | JWT strategy + Credentials + Google |
| HTTP | Axios | 1.15.2 | Client-side; server-side `fetch()` |
| Server state | TanStack Query | 5.x | Dashboard widget'ları için |
| Client state | Redux Toolkit | 2.11.2 | cart + ui + notifications slice |
| İkon | Lucide React | 1.x | Dashboard çoğunlukla; emoji public taraf |
| Tema | next-themes | 0.4.6 | `data-theme` attribute, SSR-safe |
| Toast | react-hot-toast | 2.6.0 | + sweetalert2 (kritik onaylar) |
| Test (unit) | Vitest + Testing Library + jsdom | 4.x | `vitest.config.ts` |
| Test (E2E) | Playwright | 1.59.x | `playwright.config.ts`, Chromium |

### Altyapı / Servis

| Servis | Kullanım |
|---|---|
| **Aiven PostgreSQL** | Birincil veri tabanı, `petshop` schema |
| **Cloudinary** | Ürün görselleri (auto AVIF/WebP) |
| **iyzico** | Ödeme — kart + 3D Secure, refund |
| **Brevo (Sendinblue)** | İşlemsel e-posta — verify, sipariş, şifre sıfırlama |
| **Paraşüt** | E-fatura/e-arşiv otomasyonu |
| **CallMeBot** | Admin'e WhatsApp sipariş bildirimleri |
| **Telegram Bot API** | Sistem alarmları (ops) |

---

## 4. Repo Yapısı

```
D:/Projeler/Pet/
├── client/                  # Next.js 16 frontend
├── server/                  # Spring Boot 3.2.5 backend
├── docs/                    # Tasarım dokümanları, plan'lar
│   ├── PROJECT.md           # bu dosya
│   └── plans/               # tarih bazlı tasarım kararları
├── docker-compose.yml       # local Postgres + redis (opsiyonel)
├── README.md                # üst seviye proje özeti
└── CHANGELOG.md             # sürüm değişiklikleri
```

`D:/Projeler/` (üst dizin) içinde HTML mockup'lar tutulur — bunlar tasarım kaynağıdır:
`mockup-anasayfa.html`, `mockup-login.html`, `mockup-profil.html`, `mockup-urun-detay.html`.

---

## 5. Backend Detayları

### 5.1. Modül Yapısı (`com.petshop.*`)

Spring Modulith ile her modül ayrı bir namespace ve içsel sınırlara sahiptir. Cross-modül erişim
yalnızca yayımlanan event'ler veya read-only servisler üzerinden yapılır.

| Modül | Sorumluluk | Ana sınıflar |
|---|---|---|
| `auth` | Kullanıcı kayıt/giriş, JWT, e-posta doğrulama, Google OAuth, şifre sıfırlama | `AuthController`, `AdminUserController`, `JwtService`, `AuthService` |
| `catalog` | Ürün, kategori, marka, varyant, ürün resmi yönetimi | `ProductController`, `CategoryController`, `BrandController` + admin pendant'ları |
| `order` | Sipariş yaşam döngüsü, kalem listesi, fatura entegrasyonu | `OrderController`, `AdminOrderController`, `OrderService` |
| `payment` | iyzico initiate + callback + refund | `PaymentController`, `AdminRefundController` |
| `pricing` | İndirim/kupon, kademeli toptan fiyat hesabı | `AdminDiscountController`, `PricingService` |
| `address` | Kullanıcı adresleri (set-default dahil) | `AddressController` |
| `review` | Onaylı satın alma yorumları + admin moderasyon | `ProductReviewController` |
| `notification` | Sistem bildirimleri + stok geri geldi abonelikleri | `NotificationController`, `StockSubscriptionController` |
| `siteadmin` | Site geneli ayarlar, kampanya banner'ları | `AdminSiteSettingsController`, `AdminCampaignController` |
| `saas` | Multi-tenant SaaS dashboard endpoint'leri (ürün, satış, dashboard, audit, plan) | `SaasDashboardController`, `SaasProductController`, `SaasSalesController`, `SaasUsersController`, `SaasAuditController`, `SaasMetricsController`, `SaasPlanController`, `SaasApiKeyController`, `SaasImportController`, `SaasExportController`, `SaasChartController`, `SaasCompanySettingsController`, `PublicShopController` |
| `tenant` | Tenant ID resolution + filter | TenantContext + TenantResolverFilter |
| `audit` | İşlem kaydı (kim, ne zaman, ne yaptı) | AOP-tabanlı `@AuditLog` annotasyonu |
| `invoice` | iText 7 PDF + Paraşüt entegrasyonu | `InvoiceService` |
| `telemetry` | Micrometer + Actuator + custom metrics | OpenTelemetry-ready |
| `web` | Genel public endpoint (örn. shop slug → katalog) | `PublicController` |
| `config` | Spring config — security, CORS, rate-limit, Jackson | `SecurityConfig`, `WebMvcConfig`, `BucketConfig` |
| `constant` | Mesaj sabitleri (Türkçe), enum'lar | `ResponseMessages`, `ErrorCodes` |
| `dto` | Ortak DTO'lar — `GenericResponse`, `DataGenericResponse<T>` | static factory `.ok()`, `.of(data)` |
| `exception` | Özel exception'lar + `@ControllerAdvice` | `BusinessException`, `ResourceNotFoundException` |
| `util` | Yardımcılar — slugify, fileNaming, e-posta gönderim | — |

### 5.2. Response Wrapper

Tüm endpoint'ler tutarlı bir wrapper döner:

```json
{
  "success": true,
  "message": "İşlem başarılı",
  "data": { /* T */ }
}
```

`GenericResponse` (data yok) ve `DataGenericResponse<T>` (data var) static factory'lerle oluşturulur:

```java
return ResponseEntity.ok(GenericResponse.ok());
return ResponseEntity.ok(DataGenericResponse.of(productList));
```

Hata durumunda `success: false`, `message`, opsiyonel `errors: { code, fieldErrors }` döner.

### 5.3. Önemli Endpoint Grupları

| URL prefix | Method | Açıklama | Auth | Plan kademesi |
|---|---|---|---|---|
| `/auth/register-company` | POST | İşletme kaydı (admin oluşturur) | Public | — |
| `/auth/login` | POST | Email + şifre ile giriş | Public | — |
| `/auth/google` | POST | Google OAuth token exchange | Public | — |
| `/auth/verify-email` | POST | 6 haneli kod doğrulama | Public | — |
| `/auth/forgot-password` / `/reset-password` | POST | Şifre sıfırlama akışı | Public | — |
| `/products` | GET | Public ürün listeleme + arama + kategori filtresi | Public | — |
| `/products/featured`, `/products/deals`, `/products/new-arrivals` | GET | Anasayfa bölümleri | Public | — |
| `/products/{slug}` | GET | Ürün detayı | Public | — |
| `/categories` | GET | Düz kategori listesi (parent_id ile hiyerarşik kullanım) | Public | — |
| `/brands` | GET | Aktif markalar | Public | — |
| `/orders/myOrders` | GET | Kullanıcının siparişleri | Required | — |
| `/orders` | POST | Yeni sipariş oluştur | Required | — |
| `/addresses` | GET/POST/PUT/DELETE | Adres CRUD | Required | — |
| `/admin/saas/dashboard` | GET | Dashboard özeti | Required | FREE+ |
| `/admin/saas/products` | GET/POST/PUT/DELETE | Ürün CRUD (multi-tenant) | Required | FREE (limit) |
| `/admin/saas/sales` | GET/POST | Satış kaydı + geçmişi | Required | PRO (geçmiş için) |
| `/admin/saas/users` | GET/POST/PUT/DELETE | Ekip kullanıcısı yönetimi | Required | PRO+ |
| `/admin/saas/audit` | GET | Aktivite logu | Required | PRO |
| `/admin/saas/api-keys` | GET/POST | API anahtarları (entegrasyon) | Required | PRO |

**Public e-ticaret endpoint'leri** (`/products`, `/categories`, `/brands`, `/orders`, `/addresses`,
`/payment`, `/reviews`, `/notifications`) `@ConditionalOnProperty(features.legacy-ecommerce)` flag'i
ile korunur — `application.yml` içinde `features.legacy-ecommerce: ${LEGACY_ECOMMERCE:false}`. SaaS-only
kurulumda bu endpoint'ler bean olarak yüklenmez.

### 5.4. Veritabanı Şeması (özet)

Tüm tablolar `petshop` schema'sında. Migration'lar Flyway ile yönetilir.

```
companies (id, name, plan, created_at)
users (id, email, password_hash, first_name, last_name, role, company_id, …)
products (id, slug, sku, name, base_price, available_stock, brand_id, category_id, …)
product_images, product_variants
categories (id, slug, parent_id, display_order, emoji, …)
brands, addresses, orders, order_items, reviews,
notifications, stock_subscriptions, discounts, coupons,
audit_logs, refunds, invoices, campaigns, site_settings,
api_keys
```

Önemli ilişkiler:

- `products.company_id → companies.id` — multi-tenant izolasyon
- `categories.parent_id → categories.id` — kendine referans, hiyerarşik
- `orders.user_id → users.id`, `order_items.order_id → orders.id`
- `reviews.product_id → products.id`, `reviews.user_id → users.id`

---

## 6. Frontend Detayları

### 6.1. Render Stratejisi

| Sayfa | Route | Tip | Cache |
|---|---|---|---|
| Anasayfa | `/` | RSC + ISR | 5 dk |
| Ürün detay | `/urun/[slug]` | RSC + ISR + (gelecekte) `generateStaticParams` | 5 dk |
| Kategori listeleme | `/kategori/[slug]` | RSC + ISR | 5 dk |
| Auth (giriş, kayıt, doğrula, şifre flow) | `/giris`, `/kayit`, `/dogrula`, `/sifre-unuttum`, `/sifre-sifirla` | Client + dynamic | — |
| Profil | `/profil` | Client (auth) | — |
| Sepet | `/sepet` | Client (localStorage tabanlı) | — |
| Dashboard ve alt rotalar | `/dashboard/*`, `/urunler/*`, `/satislar/*`, `/kullanicilar`, `/audit`, `/api-anahtarlari`, `/ayarlar` | Client + auth + plan-gating | — |
| `sitemap.xml`, `robots.txt`, `manifest.webmanifest` | Static handler | — | 1h |

**Önemli kural:** Server Component'lerde `auth()` çağrısı yalnızca gerekli sayfalarda yapılır. Public sayfalarda
`auth()` çağrılması Next.js'i o sayfayı dynamic'e düşürür ve ISR çalışmaz. Public veriler `lib/api/public.ts`
içindeki `apiGet()` (native `fetch()` + `next: { revalidate }`) kullanır; auth gereken durumlarda `clientApi`
(Axios + NextAuth session token) kullanılır.

### 6.2. Klasör Yapısı (`client/src/`)

```
src/
├── app/
│   ├── page.tsx                           # Anasayfa (Server)
│   ├── home.css                           # Anasayfa scoped stil
│   ├── layout.tsx                         # Provider zinciri + JSON-LD
│   ├── globals.css                        # CSS değişkenleri + reset
│   ├── (auth)/                            # Auth route group
│   │   ├── AuthShell.tsx                  # Header + side-panel + footer wrapper
│   │   ├── AuthMockup.tsx                 # Tab'lı login/register
│   │   ├── auth-mockup.css                # Auth scoped stil
│   │   ├── giris/, kayit/, dogrula/,
│   │   ├── sifre-unuttum/, sifre-sifirla/
│   ├── (dashboard)/                       # Dashboard route group
│   │   ├── layout.tsx                     # Sidebar + Topbar
│   │   ├── dashboard/, urunler/, satislar/,
│   │   ├── kullanicilar/, audit/,
│   │   ├── api-anahtarlari/, ayarlar/
│   ├── urun/[slug]/                       # Ürün detay
│   ├── kategori/[slug]/                   # Kategori listeleme
│   ├── sepet/                             # Sepet
│   ├── profil/                            # Profil (auth gerekli)
│   ├── shop/[slug]/                       # SaaS public shop (multi-tenant)
│   └── api/                               # Next.js API route'ları
│       ├── auth/[...nextauth]/route.ts    # NextAuth handlers
│       └── revalidate/route.ts            # ISR invalidation endpoint
│
├── components/
│   ├── home/                              # Anasayfa bileşenleri
│   │   ├── InfoBar, SiteHeader, CategoryBar,
│   │   ├── HeroCarousel, CategoryGrid,
│   │   ├── ProductCard, ProductSection,
│   │   ├── PromoBanner, BrandStrip,
│   │   ├── TrustBadges, SiteFooter, PetMascot
│   ├── product/                           # Ürün detay bileşenleri
│   │   ├── ProductGallery, ProductInfo,
│   │   ├── ProductTabs, RelatedProducts
│   ├── dashboard/                         # Dashboard bileşenleri
│   │   ├── Sidebar, Topbar,
│   │   ├── StatCard, SalesChart
│   ├── products/                          # Ürün CRUD bileşenleri
│   │   ├── ProductForm, StockAdjustModal
│   ├── common/                            # Paylaşılan
│   │   └── PhoneInput
│   └── providers/                         # Context provider'lar
│       ├── StoreProvider (Redux)
│       ├── QueryProvider (TanStack)
│       ├── AuthSessionProvider (NextAuth)
│       └── ThemeProvider (next-themes)
│
├── lib/
│   ├── api/
│   │   ├── public.ts                      # Public fetch (ISR-friendly)
│   │   ├── client.ts                      # Axios + NextAuth + 401 handler
│   │   └── saas.ts                        # SaaS modül istemcileri
│   ├── auth.ts                            # NextAuth v5 config
│   ├── swal.ts                            # SweetAlert2 helper'ları
│   ├── utils.ts                           # imgUrl, formatPrice, formatPhone
│   └── constants.ts                       # regex, sabitler
│
├── store/                                 # Redux Toolkit (3 slice)
│   ├── index.ts
│   ├── uiSlice.ts
│   └── notificationSlice.ts
│
├── hooks/                                 # Custom hook'lar
│   ├── useAppStore.ts
│   ├── useIsMobile.ts
│   └── useMounted.ts
│
├── types/                                 # TS interface'leri + next-auth augment
│   ├── index.ts
│   └── next-auth.d.ts
│
├── data/                                  # Statik veri (Türkiye il/ilçe)
│   └── turkeyDistricts.ts
│
└── proxy.ts                               # Next.js middleware (auth + plan gating)
```

### 6.3. Sayfa Sayfa İnceleme

#### Public Shop

**Anasayfa** (`/`) — 12 bölümden oluşan B2B landing:
1. **InfoBar** — Lacivert üst şerit, 4 slide auto-rotate (kargo / kampanya / WhatsApp / KVKK)
2. **SiteHeader** — Logo + arama + bildirim/giriş/sepet butonları, scroll'da küçülen sticky header
3. **CategoryBar** — 6 kök kategori için lacivert nav + mega dropdown
4. **HeroCarousel** — 4 slide kampanya banner (340px), sticker + Ken Burns efekti
5. **CategoryGrid** — 6 emoji kart (Kedi/Köpek/Kuş/Balık/Kemirgen/Sürüngen), hover'da pati izi 🐾
6. **ProductSection "Çok Satanlar"** — `/products/featured`, 8 ProductCard
7. **PromoBanner** — 2 kolonlu split banner
8. **ProductSection "Yeni Gelenler"** — `/products/new-arrivals`
9. **ProductSection "İndirimli Ürünler"** — `/products/deals`
10. **BrandStrip** — Marka pill'leri infinite marquee (CSS animation)
11. **TrustBadges** — 4 ikonlu güven satırı
12. **SiteFooter** — Standart footer + KVKK/iyzico/SSL rozetleri
13. **PetMascot** — Sağ-altta sticky 🐾 widget, konuşma balonu (WhatsApp shortcut)

ProductCard: 3D tilt, favori toggle (kalp animasyonu), alt-yarıdan slide-up "Sepete Ekle".

**Ürün detay** (`/urun/[slug]`) — Mockup-tabanlı premium e-ticaret detay:
- Breadcrumb (Anasayfa › Kategori › Ürün)
- 2 kolonlu üst grid: **Gallery** (sticky, 460px ana resim + 4 thumbnail farklı renk arka planlarda) + **Info**
- Info bölümü: Brand badge, başlık, yıldız + SKU, durum chip'leri, kısa açıklama, varyant butonları,
  **kademeli toptan fiyat tablosu** (1-9 / 10-49 / 50-99 / 100+ ile %5/%10/%15 indirim), büyük fiyat
  + üstü çizili eski fiyat, adet selector (kademeyi otomatik vurgular), gradient "Sepete Ekle" + WhatsApp
- 3 sekme: **Açıklama** (highlight box), **Özellikler** (key-value grid), **Yorumlar** (5-yıldız bar
  dağılımı + örnek yorumlar)
- **Related Products** — alt grid

`/urun/demo` slug'una özel demo data fallback — backend kapalıyken UI doğrulamak için.

**Kategori listeleme** (`/kategori/[slug]`):
- Renkli gradient hero (her kategori farklı renk: kırmızı/lacivert/yeşil/mor/turuncu/zümrüt)
- Sol filter sidebar: alt kategoriler, marka, fiyat aralığı (slider input), stokta olanlar / indirimli / 4★+
- Sağ ürün grid (4 kolon desktop, 2 kolon mobile)
- Toolbar: sonuç sayısı + sıralama (popülerlik / fiyat asc-desc / yeni / indirim)

**Sepet** (`/sepet`):
- Sol: 3 sütunlu ürün listesi (96px görsel + bilgi + fiyat/qty/kaldır)
- Sağ: sticky özet kartı — ara toplam, kupon kodu (`HOSGELDIN` → %10), kargo (500₺ üzeri ücretsiz),
  toplam, "Ödemeye Geç" gradient buton, SSL/iyzico/iade trust row
- Boş sepet: animasyonlu 🛒 + "Alışverişe Başla" CTA

**Profil** (`/profil`) — Auth gerekli (yoksa /giris'e redirect):
- Sol sticky sidebar: avatar (gradient + initials), ad/email, "⭐ Bayi Hesap" rozet, nav (Siparişlerim 📦 / Favoriler ❤️ / Adresler 📍 / Bilgiler 👤 / Bildirim 🔔 / Çıkış 🚪)
- 4'lü stat kartı (Toplam Sipariş / Aktif Kargo / Favori Ürün / Toplam Harcama) — her tab'da görünür
- Tab içerikleri:
  - **Siparişlerim** — order list, durum chip'leri (kargoda/teslim/iptal)
  - **Favorilerim** — boş state placeholder
  - **Adreslerim** — 2 kolonlu kart grid, varsayılan rozet, düzenle/varsayılan yap/sil
  - **Bilgilerim** — ad/soyad/email (disabled)/telefon form
  - **Bildirim Tercihleri** — 5 toggle satırı

#### Auth

`AuthShell` ortak yapı: InfoBar + Header + Footer + iki kolonlu split layout.

**Sol panel** (yalnızca ≥1024px): Lacivert mesh gradient + 5 floating pet emoji (🐾🐱🐶🐾🐦, paw-float keyframe), brand showcase, headline ("Türkiye'nin **toptan** pet ürünleri ağına hoş geldin"), 3 perk satırı (sevkiyat/iskonto/güvenlik), stats (5.000+ SKU / 300+ Bayi / %30 İskonto).

**Sağ panel**: form içeriği — `<AuthShell>{children}</AuthShell>` ile. 4 form:

- **`/giris` ↔ `/kayit`** (`AuthMockup`) — tek bileşen, tab'lı; tab indicator gradient (kırmızı→sarı), pozisyon animasyonlu
- **`/sifre-unuttum`** — başarı durumunda animated checkmark
- **`/sifre-sifirla`** — şifre göster/gizle + tekrar alanı
- **`/dogrula`** — büyük OTP input (monospace, 28px font, 18px letter-spacing, autocomplete=`one-time-code`)

Card border-top stripe gradient (kırmızı→sarı→mavi), 6sn animasyonlu. Hata: card shake (0.42sn). Submit: hover shimmer (gradient sweep).

#### Dashboard

**Layout** (`(dashboard)/layout.tsx`):
- Background: `bg-gradient-to-br from-gray-50 to-red-50/40` (warm tone)
- Sidebar (264px sticky): 🐾 logo block, "YÖNETİM" section, 7 nav item (Pano / Ürünler / Satışlar / Kullanıcılar / Aktivite / API Anahtarları / Ayarlar) — locked item'lar `Lock` ikonu ile, aktif item gradient bar + bg, alt kısımda **plan kartı** (FREE→slate, PRO→sky-indigo, PRO+→red-orange)
- Topbar: arama input (⌘K hint), plan badge gradient, bildirim ikonu (kırmızı dot), tema toggle, avatar (gradient circle + initials), çıkış

**Pano** (`/dashboard`):
- Loading: skeleton screens
- Onboarding (ilk kez): kırmızı→turuncu gradient hero banner + 3 OnboardStep kart (numaralı, hover lift)
- Normal akış: gradient title + "Yeni Satış" CTA, 3 StatCard (📦 Toplam Ürün / 🛍️ Toplam Satış / ⚠️ Düşük Stok), Sales Chart, Aylık Performans, En Çok Satanlar, Düşük Stok tablosu, Son Satışlar

`StatCard`: hover lift, üst kenar gradient stripe (origin-left scale animasyonu), icon slot, 4 tone, opsiyonel trend indicator.

### 6.4. Tasarım Sistemi

**Renk paleti** — `globals.css` içinde CSS değişkenleri:

```css
--primary: #dc2626        /* kırmızı — CTA, vurgular */
--primary-dk: #b91c1c     /* hover state */
--secondary: #1e3a5f      /* lacivert — header bar, info bar */
--accent: #38bdf8         /* açık mavi — "Toptan" yazısı */
--green: #22c55e          /* başarılı, "Stokta" */
--orange: #f97316         /* uyarı, "Son N adet" */
--bg, --bg2, --bg3        /* arka plan tonları */
--text, --text2, --text3  /* yazı tonları (en koyu → en açık) */
--border, --border2       /* çizgiler */
```

`[data-theme="dark"]` selektörü dark mode'da bu değişkenleri override eder. `<html data-theme>` attribute'u
`next-themes` tarafından yönetilir; `localStorage.pt-theme` saklar.

**Marka adı** — başlıkta `<span class="pt-pet">Pet</span><span class="pt-toptan">Toptan</span>` — "Pet" kırmızı, "Toptan" açık mavi.

**Tipografi** — Inter (Google Fonts), `latin` + `latin-ext` subset, `display: swap`. CSS değişkeni: `--font-inter`.

**Border radius** — `--r: 8px` (input, küçük buton), `--r2: 12px` (card, banner).

**Shadow** — `--shadow: 0 4px 16px rgba(0,0,0,.10)`, `--shadow-lg: 0 8px 32px rgba(0,0,0,.14)`.

**Animasyon prensipleri**:
- 150-300ms hover transition
- 400-600ms entrance (fade + translateY)
- `cubic-bezier(.4, 0, .2, 1)` — standart easing
- `prefers-reduced-motion: reduce` saygılı (her CSS dosyasında media query)

**Mockup-temelli pattern**: Tüm public sayfalar `D:/Projeler/mockup-*.html` dosyalarını referans alır.
Yapı (DOM hiyerarşisi, sınıf isimleri) korunur, üzerine "premium katmanlar" eklenir
(animasyonlar, gradient'ler, micro-interaction'lar). Bu, kullanıcı geri bildirimi olan
"yapı değil renk/his" kuralına uyar.

**Breakpoint'ler** (Tailwind defaults + custom):
- `< 640px` — mobile küçük
- `640-768px` — mobile büyük / tablet portrait
- `768-1024px` — tablet landscape
- `≥ 1024px` — desktop (auth split panel, dashboard sidebar bu noktadan görünür)

---

## 7. Auth & Yetkilendirme

### 7.1. NextAuth v5 Yapılandırması

`lib/auth.ts` → JWT strategy (httpOnly cookie). Provider'lar:

1. **Credentials** — email + şifre `POST /auth/login` → `accessToken` + `refreshToken` JWT'ye gömülür
2. **Google** — Google OAuth → `POST /auth/google` (backend ID token doğrular ve kullanıcı eşler)

Session callback'inde plan (`FREE | PRO | PRO_PLUS`) ve user bilgisi cookie'ye işlenir.

### 7.2. Middleware (`proxy.ts`)

Edge'de çalışır, her istekte:

```
Auth-only visitor paths     → /giris, /kayit, /sifre-unuttum, /dogrula
Dashboard paths             → /dashboard, /urunler, /satislar, /kullanicilar, …
PRO-only paths              → /satislar, /kullanicilar, /audit, /api-anahtarlari
PRO+ paths                  → /shop-settings
```

Kurallar:
- Logged-in kullanıcı `/giris`'e giderse → `/dashboard`'a redirect
- Logged-out kullanıcı `/dashboard`'a giderse → `/giris?callbackUrl=...` redirect
- FREE plan PRO sayfasına giderse → `/dashboard?upgrade=1` redirect (ekranda "Yükselt" banner'ı)
- `/satislar/yeni` → FREE için carve-out (kayıt edebilir, geçmiş PRO)

### 7.3. Backend JWT

`SecurityConfig` Spring Security: `JwtAuthenticationFilter` her istekte `Authorization: Bearer <token>`
header'ını okur, token'ı doğrular, `SecurityContext`'e `userId` (Long) yerleştirir. Controller'larda
`@AuthenticationPrincipal Long userId` ile alınır.

Token süreleri (`application.yml`):
- Access token: 15 dakika
- Refresh token: 7 gün

Frontend `clientApi` axios interceptor 401 yakalarsa otomatik `signOut()` çağırır (UX olarak login'e redirect).

### 7.4. Multi-Tenant İzolasyon

`tenant.TenantResolverFilter` her istekte JWT'den `companyId`'yi çıkarır ve `TenantContext.set(companyId)`
çağırır. Repository sorgularında `@Where(clause = "company_id = :tenantId")` veya açık `where`
filtreleriyle veri izolasyonu sağlanır. Bir firma diğerinin verilerini hiçbir şekilde göremez.

---

## 8. Geliştirme Ortamı

### 8.1. Önkoşullar

- Node 20+
- Java 17+
- PostgreSQL erişimi (Aiven prod hesabı veya local)
- (Opsiyonel) Docker Compose — `docker-compose.yml` ile local Postgres

### 8.2. Çalıştırma

`.claude/launch.json` üç dev server tanımı içerir:

| Ad | Komut | Port | Not |
|---|---|---|---|
| `client` | `npm run dev` (client/) | 3000 | autoPort: false (NextAuth callback URL'i sabit ister) |
| `server` | `mvn spring-boot:run -Dspring-boot.run.arguments=--features.legacy-ecommerce=true` (server/) | 8080 | Public e-ticaret endpoint'lerini açar |
| `mockup` | `python -m http.server 3333` (üst dizin) | 3333 | Orijinal HTML mockup'ları görmek için |

```bash
# Frontend
cd client
cp .env.local.example .env.local      # değerleri doldur
npm install
npm run dev                           # http://localhost:3000

# Backend
cd server
export LEGACY_ECOMMERCE=true          # public endpoint'leri açar
mvn spring-boot:run                   # http://localhost:8080
```

### 8.3. Çevre değişkenleri

**Frontend (`.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...                   # openssl rand -base64 32
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
REVALIDATE_SECRET=...                 # backend → Next ISR invalidation için
```

**Backend (env veya `.env`):**
```
DB_HOST=...
DB_PORT=...
DB_USERNAME=...
DB_PASSWORD=...
JWT_SECRET=...
LEGACY_ECOMMERCE=true                 # public e-ticaret modülünü aç
IYZICO_API_KEY=...
IYZICO_SECRET_KEY=...
BREVO_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PARASUT_ENABLED=false                 # opsiyonel
```

### 8.4. Test

```bash
# Frontend
cd client
npm test                              # Vitest unit
npm run test:e2e                      # Playwright (chromium gerekli — npm run test:e2e:install ile)

# Backend
cd server
mvn test                              # JUnit + Spring-test + Testcontainers
```

CI ortamında Postgres testcontainer otomatik başlar; manuel DB kurulumu gerekmez.

---

## 9. Deployment & Production

### 9.1. Frontend

Vercel veya benzeri Edge platformu. Build:

```bash
npm run build
npm run start
```

`next.config.ts` production CSP header'ları ekler:
- `Strict-Transport-Security`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `X-Content-Type-Options`, full CSP
- `images.remotePatterns`: `pettoptan.com.tr`, `*.pettoptan.com.tr`, `res.cloudinary.com`
- Image format: `avif` + `webp`, `minimumCacheTTL: 86400`

### 9.2. Backend

`server/Dockerfile` mevcuttur. Çalıştırma:

```bash
docker build -t pettoptan-server .
docker run -p 8080:8080 --env-file .env pettoptan-server
```

Tomcat embed; `/actuator/health` (liveness + readiness probe), `/actuator/info`, `/actuator/metrics` açık.
Logging: `com.petshop` → INFO, Spring Security → WARN.

### 9.3. ISR Cache Invalidation

Admin paneli ürün/kategori CRUD sonrası backend → Next.js'e POST atar:

```bash
curl -X POST https://pettoptan.com.tr/api/revalidate \
  -H "Content-Type: application/json" \
  -H "X-Revalidate-Secret: $REVALIDATE_SECRET" \
  -d '{"tags":["catalog","product-mama-12kg"], "paths":["/urun/mama-12kg"]}'
```

`app/api/revalidate/route.ts` `revalidateTag()` veya `revalidatePath()` çağırır.

---

## 10. Kalite ve Güvenlik

- **OWASP Top 10** önlemleri aktif:
  - SQL injection: JPA parameterized query (raw query yok)
  - XSS: React JSX escape; `dangerouslySetInnerHTML` yalnızca `<script type="application/ld+json">` için
  - CSRF: NextAuth JWT cookie (SameSite=Lax) + state param
  - Brute force: Bucket4j rate-limit (login 5/dk, register 3/dk)
- **HTTPS only** + HSTS preload
- **CSP** production'da sıkı; dev'de Turbopack HMR için gevşetilmiş
- **PII**: kredi kartı backend'e hiç gelmez (iyzico hosted), şifreler bcrypt
- **KVKK**: kullanıcı verileri silme talebi `DELETE /users/me` ile destek (auth modülü)

---

## 11. Yol Haritası (Sonraki Adımlar)

> **2026-05-05 yenileme:** Yol haritası vizyon değişikliğine göre yeniden önceliklendirildi. Aktif sprint listesi `C:\Users\oguzh\.claude\plans\kullan-c-ye-olur-iken-joyful-taco.md` dosyasında.

### MVP (tek sürüm, hedef 6-8 hafta · gerçekçi 10-12 hafta)

1. **Backend mimari hazırlık** — SUPERADMIN/STAFF enum, `branches` + `branch_inventory` + `byom_credentials` + `telegram_bindings` migration'ları, `products.listed_for_sale` field'ı, `audit_logs.performed_as_superadmin`
2. **Anasayfa SaaS lansman + login redesign** — `markaadı.com/` pure SaaS (marketplace `/magaza`'ya taşınır), auth sol panel "stok-takip" mesajı + mini dashboard preview
3. **Admin paneli yeniden tasarım** — Sidebar/Topbar/Pano polish (Linear/Stripe estetik), KPI grid, onboarding kartı, "🛍️ Satışa Geç" topbar butonu
4. **"Satışa Aç" toggle + toplu buton** — ürün listesinde satır toggle, üstte "Hepsini satışa aç", marketplace endpoint filtre
5. **Şube yönetimi UI + branch inventory** — `/yonetim/subeler` kart grid, harita pin (Leaflet+OSM), yarıçap slider
6. **Süperadmin paneli + impersonation** — `/super-admin` tablosu, iki seviye impersonation (şirket/şube), sticky bant + audit işareti
7. **BYOM ödeme (iyzico)** — `/yonetim/odeme` API key formu, marketplace ödeme proxy, 3D Secure callback, refund
8. **BYOM e-fatura (Paraşüt)** — API key formu, satış sonrası otomatik fatura kesimi
9. **Telegram bot bildirim + ekran 🔔 panel** — merkezi `@PetToptanBot`, eşleştirme akışı, dropdown panel
10. **Marketplace polish + CUSTOMER kayıt + sipariş akışı uçtan uca**
11. **Test + bug fix + memory güncelleme**

### Faz 2 (MVP sonrası)

- STAFF rolünün gerçek kullanılması (yetki tablosu, şube içi sınırlı kullanıcı)
- Subdomain ayrımı (`app.markaadı.com`)
- Şirket doğrulama UI (vergi levhası yükleme + super-admin onay)
- Real arama (Algolia/Meilisearch)
- `/cok-satanlar`, `/yeni-gelenler`, `/indirimli`, `/markalar/[slug]` listeleme sayfaları

### Faz 3 (uzun vadeli)

- PRO+ custom domain (Host header → tenant tespit, white-label)
- iyzico Subscription API ile otomatik PRO abonelik tahsilat (MVP'de manuel: tenant havale → super-admin plan yükselt)
- 3rd party marketplace entegrasyonu (Trendyol, Hepsiburada API ile stok push)
- Mobile uygulama (React Native veya PWA)
- AI destekli stok tahminleme

---

## 12. Faydalı Referanslar

- **Frontend README** → `client/README.md` (dev komutları + Vite→Next.js geçiş notları)
- **CHANGELOG** → `CHANGELOG.md`
- **Anasayfa tasarım notları** → `docs/plans/2026-05-04-anasayfa-design.md`
- **Mockup'lar** → `D:/Projeler/mockup-anasayfa.html`, `mockup-login.html`, `mockup-profil.html`, `mockup-urun-detay.html`
- **Plan dosyası** (kapsamlı teknik plan) → `C:\Users\oguzh\.claude\plans\merry-doodling-lamport.md`

---

*Belge tutucu: bu dokümanı her major sürümde güncelle. Sayfa eklendiğinde 6.3'e, modül eklendiğinde 5.1'e,
endpoint eklendiğinde 5.3'e satır ekle. Mimari değişiklik varsa 2. bölüm yenilensin.*
