# PetToptan Next.js — Devir Notu (Session Handoff)

**Tarih:** 2026-05-01
**Konum:** `D:/Projeler/Pet/nextjs/`
**Plan referansı:** `C:\Users\oguzh\.claude\plans\ny-z-k-sm-n-next-js-projesine-wiggly-hopcroft.md`
**Önceki session transcript'i:** `C:\Users\oguzh\.claude\projects\D--Projeler-Pet-romantic-wing-770c4c\1f6b840f-bc7c-4846-a309-483250ff7d3c.jsonl` — eski konuşmanın tam logu; spesifik kod parçası, hata mesajı veya karar gerekçesi aramak için.

Bu doküman, React+Vite → Next.js 15 migrasyonunda hangi adımların **bittiğini** ve **kalan iş** kalemlerini özetler. Yeni session bunu okuyarak devam edebilir.

---

## ✅ Tamamlanan

### Hafta 1 — Temel altyapı
- [x] `create-next-app` kurulum + TypeScript + App Router + `src-dir` + `@/*` alias
- [x] `globals.css` (`:root` token bloğu birebir taşındı)
- [x] Provider'lar: `StoreProvider`, `QueryProvider`, `AuthSessionProvider`, `ThemeProvider` (next-themes)
- [x] NextAuth v5 (`lib/auth.ts`) — Credentials + Google
- [x] API katmanı: `lib/api/server.ts`, `lib/api/client.ts`, `lib/api/index.ts`
- [x] `middleware.ts` ile `/profil` koruması
- [x] `next.config.ts` — security headers, images.remotePatterns (Cloudinary dahil), `optimizePackageImports`, `/login → /giris` 301

### Hafta 2 — Layout
- [x] `(shop)/layout.tsx` — siteSettings + categories server fetch
- [x] `Header.tsx`, `InfoBar.tsx`, `CategoryBar.tsx`, `Footer.tsx`, `MobileMenu.tsx`
- [x] `CheckoutDrawer.tsx` ayrı dosyaya çıkarıldı
- [x] Dark mode (next-themes, `data-theme` attribute)

### Hafta 3-4 — Sayfalar
- [x] `/` (anasayfa, RSC + `HomePageClient`)
- [x] `/urun/[slug]` (ISR + `ProductDetailClient` + JSON-LD)
- [x] `/urunler` (SSR + `ProductListClient`)
- [x] Statik: `/hakkimizda`, `/iletisim`, `/sss`, `/gizlilik-politikasi`
- [x] `/giris` ('use client', NextAuth signIn)
- [x] `/profil` ('use client', section'lar: `InfoSection`, `AddressesSection`, `OrdersSection`, `NotificationsSection`, `SectionHead`)
- [x] `/odeme-sonuc`

### Hafta 5 (kısmen)
- [x] `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`
- [x] `error.tsx`, `not-found.tsx`, `loading.tsx`
- [x] JSON-LD: `app/layout.tsx` (Organization), `urun/[slug]` (Product/Breadcrumb), `sss` (FAQPage)

---

## 🟡 Kalan İşler

### 1. ✅ `<img>` → `next/image` dönüşümü
- `CheckoutDrawer.tsx` cart item img'i `next/image`'a çevrildi (60×60, sizes="60px").

### 2. ✅ Build doğrulama
- `npm run build` temiz geçiyor (TypeScript + ISR/SSG generation OK; backend `fetch failed` warning'leri sadece offline build environment kaynaklı, fallback'ler devreye giriyor).
- `next start` ile runtime test backend ayağa kalkınca yapılmalı.

### 3. Lighthouse audit (kalan, runtime gerekli)
- Hedef: Performance > 90, SEO = 100, LCP < 2.5s
- Bundle analyze: `ANALYZE=true npm run build` (gerekirse `@next/bundle-analyzer` ekle)

### 4. ✅ Dynamic import doğrulama
- `MobileMenu` ve `CheckoutDrawer` `Header.tsx` içinde `dynamic(..., { ssr: false })` ile yükleniyor (satır 16-17).
- `AnimatedStarRating` `ProductDetailClient.tsx` içinde **inline** tanımlı (satır 52). Ayrı dosyaya çıkarmaya gerek yok; client component'in zaten parçası.

### 5. ✅ Eksik UI component kontrolü
- `PhoneRequiredModal` port edildi → `src/components/auth/PhoneRequiredModal.tsx`.
- `PhoneGate` wrapper eklendi → `src/components/auth/PhoneGate.tsx` (status==='authenticated' && !user.phone iken modal gösterir, aksi halde children).
- `(shop)/layout.tsx` artık `<PhoneGate>` ile sarmalı; siteSettings'ten `brandPart1/brandPart2` prop olarak geçiyor.
- `update()` ile session yenileniyor (Redux dispatch yerine NextAuth pattern).
- `AnimatedStarRating` ve `ReviewSection` eski `client/src`'te ayrı dosya olarak yok — handoff yanılmıştı; AnimatedStarRating ProductDetailClient içinde inline.

### 6. ✅ `.env.local` doğrulama
Tüm gerekli değişkenler mevcut: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `API_URL`, `NEXT_PUBLIC_API_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `REVALIDATE_SECRET`.

### 7. Hafta 6 — Geçiş (kalan)
- [ ] Vercel deploy (ISR için kritik)
- [ ] DNS cutover
- [ ] 7 gün paralel izleme (eski Vite + yeni Next.js)
- [ ] Google Search Console'a yeni `sitemap.xml` submit

---

## 🔍 Doğrulama Checklist

- [ ] `next build` hatasız
- [ ] `next start` ile tüm sayfalar açılıyor
- [ ] `/urun/<bir-slug>` view-source → Product JSON-LD görünür
- [ ] `/sitemap.xml` ürünleri listeliyor
- [ ] `/robots.txt` doğru (Disallow: /profil, /odeme-sonuc, /api/)
- [ ] Lighthouse: Performance > 90, SEO = 100
- [ ] Chrome DevTools → ürün sayfası HTML'inde ürün adı görünüyor (SSR/ISR kanıtı)
- [ ] `/profil` oturumsuz → `/giris`'e redirect (middleware testi)
- [ ] Dark/light toggle hydration mismatch'siz çalışıyor
- [ ] `/login` → `/giris` 301 çalışıyor

---

## 📁 Mevcut Yapı (özet)

```
D:/Projeler/Pet/nextjs/src/
├── app/
│   ├── layout.tsx, globals.css, page.tsx
│   ├── error.tsx, not-found.tsx, loading.tsx
│   ├── sitemap.ts, robots.ts, manifest.ts
│   ├── (shop)/layout.tsx, urunler, urun/[slug],
│   │         hakkimizda, iletisim, sss, gizlilik-politikasi
│   ├── (auth)/giris, layout.tsx
│   ├── (account)/profil (sections/), layout.tsx
│   ├── odeme-sonuc/
│   └── api/
├── components/
│   ├── layout/   (Header, Footer, InfoBar, CategoryBar, MobileMenu)
│   ├── home/     (HomePageClient)
│   ├── product/  (ProductCard, ProductDetailClient, ProductListClient)
│   ├── checkout/ (CheckoutDrawer)  ← img→Image bekliyor
│   ├── ui/       (PhoneInput)       ← eksik component'ler olabilir
│   └── providers/
├── lib/
│   ├── api/ (server.ts, client.ts, index.ts)
│   ├── auth.ts, constants.ts, fallbacks.ts, utils.ts
└── (store, hooks, types — plan'a göre mevcut)
```

---

## 🚀 Yeni Session İçin Açılış Promtu (öneri)

> "PetToptan Next.js migrasyonunda kaldığım yerden devam ediyorum. `D:/Projeler/Pet/nextjs/HANDOFF.md` dosyasını oku — plan dosyası ve önceki session transcript'i de orada referans olarak listeli. 'Kalan İşler' bölümündeki sırayla ilerleyelim. İlk olarak madde 1: `CheckoutDrawer.tsx` içindeki `<img>` tag'lerini `next/image`'a çevir."
