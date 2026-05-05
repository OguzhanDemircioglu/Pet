# Anasayfa Tasarımı — PetToptan

**Tarih:** 2026-05-04
**Durum:** Onaylandı, implementasyon aşamasında
**Stil:** Hibrit (Premium e-ticaret iskeleti + sevimli pet detayları + smooth animasyonlar)
**Data:** Karma (statik bölümler hardcoded, ürünler/kategoriler/markalar backend'den)

## 1. Sayfa İskeleti

`app/page.tsx` Server Component olarak orchestrator. Mevcut "guest cookie yoksa /giris'e redirect" davranışı kaldırılır. Anasayfa herkese açık (Trendyol pattern'i: misafir gezinebilir, ödeme aşamasında giriş istenir).

### Bölümler (yukarıdan aşağı)

1. **InfoBar** — Lacivert üst şerit, 4 slide carousel (kargo/kampanya/destek). 5sn auto-rotate. Hardcoded.
2. **SiteHeader** — Logo + arama + bildirim/sepet/giriş. Sticky. Search dropdown UI-only (Algolia entegrasyonu sonra).
3. **CategoryBar** — Lacivert kategori menüsü, mega dropdown. `/categories` (canlı), 6 statik fallback.
4. **HeroCarousel** — 4 slide kampanya banner (340px). Hardcoded.
5. **CategoryGrid** — 6 emoji kart (Kedi/Köpek/Kuş/Balık/Kemirgen/Sürüngen). Backend'den count alır.
6. **ProductSection "Çok Satanlar"** — `/products/featured`.
7. **PromoBanner** — 2 kolonlu split kart. Hardcoded.
8. **ProductSection "Yeni Gelenler"** — `/products/new-arrivals`.
9. **ProductSection "İndirimli Ürünler"** — `/products/deals`.
10. **BrandStrip** — Marka logoları yatay marquee. `/brands`.
11. **TrustBadges** — 4 ikon (Hızlı kargo/7-24 destek/Güvenli ödeme/KVKK). Hardcoded.
12. **SiteFooter** — Mockup'taki footer.

## 2. Component Hiyerarşisi & Data Fetching

### Klasör yapısı
```
client/src/
├── app/
│   ├── page.tsx               ← Server Component (orchestrator)
│   ├── home.css               ← Anasayfa scoped CSS
├── components/home/
│   ├── InfoBar.tsx            ← 'use client' (carousel)
│   ├── SiteHeader.tsx         ← 'use client' (search, dropdown)
│   ├── CategoryBar.tsx        ← server + client child
│   ├── HeroCarousel.tsx       ← 'use client'
│   ├── CategoryGrid.tsx       ← server
│   ├── ProductSection.tsx     ← server
│   ├── ProductCard.tsx        ← 'use client' (favori, hover, tilt)
│   ├── PromoBanner.tsx        ← server
│   ├── BrandStrip.tsx         ← 'use client' (marquee)
│   ├── TrustBadges.tsx        ← server
│   ├── SiteFooter.tsx         ← server
│   └── PetMascot.tsx          ← 'use client' (sticky widget)
└── lib/api/
    └── public.ts              ← getProducts(), getCategories(), getBrands()
```

### Data fetching (Promise.all paralel)
```ts
const [featured, newArrivals, deals, categories, brands] = await Promise.all([
  getFeaturedProducts(),
  getNewArrivals(),
  getDeals(),
  getCategories(),
  getBrands(),
])
```

### Caching
- Ürünler: `next: { revalidate: 300 }` (5dk ISR)
- Kategori/Marka: `revalidate: 3600` (1 saat)
- Admin değişikliklerinde mevcut `/api/revalidate` ile manuel invalidate.

### Error/Loading
- Her ProductSection kendi `<Suspense>` boundary'sinde.
- Backend down: bölüm "ürünler şu an yüklenemiyor" empty state, sayfa çalışır.
- Backend `features.legacy-ecommerce=true` flag'i gerekli (deployment notu).

## 3. "İlgi Çekici" Katman (Hibrit D)

**Kütüphane:** Sadece CSS + IntersectionObserver. Framer-motion sadece gerek kalırsa, dynamic import.

### Animasyon listesi
- **HeroCarousel**: Slide arkasında Ken Burns (scale 1.05→1). Visual emoji wiggle (3deg↔-3deg). Sticker float (y: 0↔-4px, 2sn).
- **CategoryGrid**: Hover'da emoji `scale(1.15) rotate(-8deg)` + brightness 1.05. Altta pati izi 🐾 belirir. Mobile scroll-snap.
- **ProductCard**: 3D tilt (perspective 1000px, max 4deg). "Sepete Ekle" butonu alt-yarıdan slide-up. Stok az → pulsing dot. Favori → scale 1.4→1 + parçacık.
- **Sayı animasyonları**: "1.250+ ürün" gibi rakamlar viewport'a girince count-up (1.5sn).
- **Scroll fade-in**: Section'lar opacity 0→1 + translateY 20→0 (200ms stagger).
- **PetMascot**: 60×60 SVG pet, sağ-altta sticky. Scroll'la yumuşak takip. Tıklanınca konuşma balonu.
- **SiteHeader**: Scroll down'da 68px→52px küçülür, backdrop-blur artar.
- **InfoBar**: Vertical translateY ile slide geçişi. Hover'da pause.
- **BrandStrip**: Infinite marquee (CSS `animation: scroll`). Hover yavaşlar, drag manuel.
- **Dark mode**: Mevcut `data-theme` korunur, tüm renkler CSS variable.

## 4. Performans / A11y / Mobile / Test

### Performans
- Hero hariç görseller `loading="lazy"`, blur placeholder.
- `next/image` ile `sizes` doğru: `(max-width: 768px) 50vw, 25vw`.
- Tilt + ağır animasyonlar sadece desktop (`useIsMobile` hook'u zaten var).
- BrandStrip marquee `will-change: transform`, inactive tab'da pause.
- ISR 5dk + 1h. Server Component → ilk HTML fold-üstü hazır.
- Framer-motion (varsa) dynamic import — initial bundle'a girmez.

### Erişilebilirlik
- Carousel'larda klavye desteği (sol/sağ ok, Enter/Space pause), `aria-live="polite"`.
- Mascot konuşma balonu `role="dialog"` + ESC + focus trap.
- WCAG AA kontrast (light + dark).
- `prefers-reduced-motion: reduce` → tüm animasyon kapalı.
- Emoji-only kategori kartlarına `aria-label`.

### Mobile (≤768px)
- Header arama altta ayrı satır, sticky.
- CategoryBar hamburger (bottom-sheet drawer).
- HeroCarousel boyu 220px.
- ProductGrid `repeat(2, 1fr)`.
- CategoryGrid `repeat(3, 1fr)`, iki sıra.
- Mascot gizli.

### Test
- Vitest: ProductCard render, favori toggle, fiyat formatı.
- Playwright: anasayfa açılır → ürün karta tıkla → detay sayfası + axe scan.
