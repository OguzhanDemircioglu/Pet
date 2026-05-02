# PetToptan Frontend (Next.js)

Türkiye toptan pet ürünleri B2B platformu — `pettoptan.com.tr` için frontend.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Redux Toolkit · NextAuth v5 · TanStack Query · next-themes

---

## Kurulum

```bash
cp .env.local.example .env.local   # değerleri doldur
npm install
npm run dev
```

Backend (Spring Boot) `http://localhost:8080`'de çalışıyor olmalı. Backend `/api` prefix kullanmaz, root'tan serve eder.

### Build

```bash
npm run build      # production build
npm run start      # production server
```

---

## Klasör yapısı

```
src/
├── app/
│   ├── (shop)/             # Header + CategoryBar + Footer'lı sayfalar
│   │   ├── urunler/        # SSR — searchParams'a göre filtre
│   │   ├── urun/[slug]/    # ISR + generateStaticParams + JSON-LD
│   │   ├── hakkimizda/iletisim/sss/gizlilik-politikasi/   # SSG
│   ├── (auth)/giris/       # NextAuth signIn (Credentials + Google + Verify)
│   ├── (account)/profil/   # Kullanıcı paneli (auth gerekli, force-dynamic)
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handlers
│   │   └── revalidate/           # Backend admin'in ISR cache'i patlatması için
│   ├── odeme-sonuc/        # iyzico callback
│   ├── page.tsx            # Anasayfa (ISR 1h)
│   ├── sitemap.ts          # 39+ URL (statik + kategori + ürün)
│   ├── robots.ts
│   └── layout.tsx          # Root: provider'lar + Inter font + Organization JSON-LD
├── components/
│   ├── layout/             # Header, Footer, InfoBar, CategoryBar, MobileMenu
│   ├── home/               # HomePageClient
│   ├── product/            # ProductCard, ProductListClient, ProductDetailClient
│   ├── checkout/           # CheckoutDrawer (6-adım: cart→login→phone→address→invoice→confirm)
│   └── providers/          # StoreProvider, AuthSessionProvider, QueryProvider, ThemeProvider
├── lib/
│   ├── api/
│   │   ├── server.ts       # serverFetch (public, ISR-friendly) + serverFetchAuth
│   │   ├── client.ts       # Axios + NextAuth session token + 401 handler
│   │   └── index.ts        # client-side API modülleri
│   ├── auth.ts             # NextAuth v5 config (Credentials + Google + JWT callback)
│   ├── fallbacks.ts        # Backend down olduğunda kullanılan default değerler
│   ├── utils.ts            # imgUrl, formatPrice, formatPhone, discountedPrice
│   └── constants.ts        # regex + sabit değerler
├── store/                  # cart, ui, notifications (3 slice)
├── hooks/                  # useIsMobile, useAppStore
└── types/                  # tüm TS interface'ler + next-auth.d.ts augment
```

---

## Render stratejisi

| Sayfa | Tip | Cache |
|---|---|---|
| `/` (anasayfa) | ISR | 1 saat |
| `/urun/[slug]` | ISR + SSG (top 20 build-time) | 30 dk |
| `/urunler` | SSR (force-dynamic) | — |
| `/hakkimizda`, `/iletisim`, `/sss`, `/gizlilik-politikasi` | ISR | 24 saat |
| `/giris`, `/odeme-sonuc` | Static | — |
| `/profil` | Dynamic | — (kullanıcı session) |
| `/sitemap.xml`, `/robots.txt` | ISR | 1 saat |

**Önemli kural:** Public veriler `serverFetch()` ile çekilir, **`auth()` çağırmaz** — yoksa Next.js sayfayı dynamic'e düşürür ve ISR çalışmaz. Auth gereken sunucu kodları için `serverFetchAuth()` kullanılır.

---

## SEO

- Her sayfada `generateMetadata` (title + description + Open Graph)
- **JSON-LD structured data:**
  - `Product` schema → ürün detayda (name, sku, price, availability, aggregateRating)
  - `BreadcrumbList` → ürün detayda
  - `Organization` → root layout
  - `FAQPage` → SSS sayfasında
- **Sitemap** otomatik üretilir, tüm aktif ürünler dahil (priority featured > diğer)
- **robots.txt** `/profil`, `/odeme-sonuc`, `/api/`, `/giris` disallow
- `next/image` Cloudinary remote pattern destekli, AVIF + WebP otomatik

---

## Auth

NextAuth v5 (Auth.js). LocalStorage JWT yerine httpOnly cookie + JWT strategy.

- **Credentials provider** → `POST /auth/login` (backend) → user + accessToken + refreshToken JWT'ye gömülür
- **Google provider** → backend `POST /auth/google` ile token exchange
- **Email verification** — `/giris` sayfasında 6 haneli kod, geri sayım, otomatik signIn
- **middleware.ts** — `/profil` Edge'de korunur, auth yoksa `/giris`'e redirect

Server component'lerde session: `import { auth } from '@/lib/auth'` → `const session = await auth()`. Client'ta: `useSession()`.

---

## ISR Cache invalidation

Backend admin paneli ürün/kategori güncelledikten sonra `POST /api/revalidate` çağırır:

```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -H "X-Revalidate-Secret: $REVALIDATE_SECRET" \
  -d '{"tags":["catalog","product-mama-12kg"], "paths":["/urun/mama-12kg"]}'
```

---

## Vite → Next.js geçiş notları

Bu proje, eski `client/` klasöründeki React 19 + Vite SPA'sının Next.js 16 App Router'a tam port'udur.

### Neden geçildi?

- **SEO sıfırdı.** SPA olduğu için Google ürün sayfalarını indexleyemiyor, meta tag/OG yoktu
- **İlk yükleme yavaştı** — her şey client-side fetch
- Native sitemap, JSON-LD, sosyal medya preview altyapısı yoktu

### Ne değişti?

| Eski (Vite) | Yeni (Next.js) |
|---|---|
| 10+ Redux slice (auth, products, categories, brands, orders, ...) | 3 slice (cart, ui, notifications) |
| LocalStorage JWT | httpOnly cookie + NextAuth JWT |
| `react-router-dom` | App Router (file-based) |
| Tüm sayfalar client-side fetch | ISR/SSG/SSR (sayfa bazlı) |
| `<img>` | `next/image` (AVIF + WebP otomatik) |
| `ThemeContext` | `next-themes` (SSR-safe, hydration mismatch'siz) |
| `@react-oauth/google` | NextAuth Google provider |
| `RouteGuard` component + `routesSlice` | Edge `middleware.ts` |
| `useSiteSettings` hook | Server fetch + props (RSC) |

### URL değişiklikleri

- `/login` → `/giris` (kalıcı 301 redirect, SEO-friendly Türkçe)
- Diğer tüm URL'ler aynı

### Eklenen kalite katmanları

- **Security headers** — HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, X-Content-Type-Options (next.config.ts)
- **Loading/error/not-found** — özel `loading.tsx`, `error.tsx`, `not-found.tsx`
- **Web manifest** — PWA + Apple touch icon
- **Bundle optimization** — `optimizePackageImports` (lucide, redux, tanstack)
- **Cache invalidation API** — admin tarafından tetiklenebilir (revalidateTag/Path)

### Migrasyon sırasında düzeltilen kritik bug'lar

1. **CheckoutDrawer kredi kartı flow'u** — kullanıcı iyzico'ya yönlendirilince sepet anında siliniyordu. Ödeme başarısız/iptal edilirse sepet uçuyordu (gelir kaybı). Sepet artık `/odeme-sonuc?status=success` sonrası temizleniyor.
2. **Sepet hydration mismatch** — server'da `[]`, client'ta localStorage'tan dolu başlıyordu. `hydrate` pattern ile React warning + flicker ortadan kalktı.
3. **Email verify flow** — kayıt sonrası 6 haneli kod ekranı eksikti, kullanıcılar üye olduktan sonra giriş yapamıyordu. Geri eklendi (geri sayım + resend dahil).
4. **`auth()` her serverFetch'te** — ISR'ı bozup tüm sayfaları dynamic'e düşürüyordu. Public ve Auth fetch ayrıldı.
5. **NextAuth UntrustedHost** — `trustHost: true` eklenmeden API'ler 500 dönüyordu.
6. **Backend kapalıyken build patlaması** — fallback değerler + try/catch ile resilient yapıldı.
7. **Cloudinary `next/image` remote pattern eksik** — production'da görseller 400 dönüyordu.

---

## Geliştirme komutları

```bash
npm run dev        # localhost:3000 — hot reload
npm run build      # production build
npm run start      # production server
npm run lint       # ESLint
```

## Çevre değişkenleri

`.env.local.example` dosyasındaki tüm değişkenler `.env.local`'a kopyalanıp doldurulmalıdır. Production'da `NEXTAUTH_SECRET` ve `REVALIDATE_SECRET` mutlaka rastgele üretilmelidir.

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET için
openssl rand -hex 32      # REVALIDATE_SECRET için
```
