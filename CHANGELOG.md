# PetToptan SaaS — Changelog

Multi-tenant petshop stok & satış yönetim aracı. B2B toptan e-ticaretten dönüşüm sürecinde tutulan değişiklik kaydı.

## [Faz 17] — Top Sellers + CSV Export + Telegram

**Backend**
- `GET /admin/saas/charts/top-sellers` — son N gün en çok satan ürünler (adet + ciro)
- `GET /admin/saas/export/products.csv` — UTF-8 BOM + import-uyumlu CSV
- `LowStockAlertJob` Telegram bildirimi (notification_facade üzerinden)
- `ApiKeyAuthFilterTest` — 6 test (revoke, unknown, inactive, valid, no-header, wrong-prefix)

**Frontend**
- Dashboard "En Çok Satanlar (30 gün)" widget — top 5 sıralı liste
- /urunler "CSV İndir" butonu (Blob download)
- ProductForm test +4 (initial, showSku=false, pending, custom label)
- StockAdjustModal vitest +7 (mevcut, +10/-10, eksi uyarı, submit disable, backdrop)
- e2e register-flow +5 (boş form, doldurma, link, sifre-unuttum)

## [Faz 16] — Daily Summary + Welcome + Stock History

- `DailySummaryJob` 18:00 cron — PRO+ günlük satış özeti email
- AuthService welcome email (frictionless akış)
- /urunler/hareketler — STOCK_ADJUST kronolojik sayfa
- Dashboard düşük stok banner (3+ ürün)
- DailySummaryJobTest 6 test

## [Faz 15] — API Keys + Düşük Stok Email + Bildirim Ayarları

- `X-API-Key` header auth — `pt_live_` prefix + SHA-256 hash
- `LowStockAlertJob` 09:00 cron — PRO+ HTML tablo email
- Company entity bildirim ayarları (V5 migration)
- `/admin/saas/company/settings` GET/PUT
- Sade Toggle component (frontend)
- LowStockAlertJobTest 7 test

## [Faz 14] — API Keys + Audit Date Filter + Ürün Detay Geçmiş

- `pt_live_` prefix API key altyapısı (V4 migration + service + controller)
- AuditLogRepository.search → from/to/resourceId filter
- /urunler/[id] ürün detay yenilendi: stok modal + hareket geçmişi
- /api-anahtarlari sayfa (PRO+, plaintext bir kez gösterilir)
- SaasApiKeyServiceTest 6 test

## [Faz 13] — Audit Filter UI + Bulk Update + Monthly Metrics

- /audit Resource + Action dropdown filter
- /urunler/import "Yeni Ekle / Güncelle" tab modu
- Dashboard "Bu Ayki Performans" 4-metric card
- SaasImportServiceTest +6 (updateProductsCsv)

## [Faz 12] — Stok Modal + CSV Bulk Update + Tenant Metrics

- StockAdjustModal kompakt modal (-/+ butonları + hızlı düğme)
- `SaasImportService.updateProductsCsv` — SKU bazlı toplu güncelle
- `/admin/saas/metrics/monthly` — aylık ciro/AOV/aktif ürün

## [Faz 11] — Satış Detay + Verify Email + Stok Hareketi

- /satislar/[id] satış detay sayfası (yazdır)
- /dogrula 6 haneli email doğrulama
- `SaasProductService.adjustStock` (delta + note)
- AuditCleanupJobTest 2 + PasswordResetServiceTest 6

## [Faz 10] — Dashboard Chart + Sales Filter + JSON Export

- Bağımlılık-sız inline SVG bar chart (son N gün)
- /satislar tarih aralığı + müşteri arama
- `/admin/saas/export` JSON dump endpoint
- `features.saas-email-verification` flag

## [Faz 9] — CSV Bulk Import + Onboarding + Audit Cleanup

- `SaasImportService.importProductsCsv` (1000 satır + plan limit)
- Dashboard onboarding empty state (3 adımlı)
- AuditCleanupJob 03:15 cron — 90 gün retention
- Actuator metrics endpoint

## [Faz 8] — Password Reset + Audit UI + CSP

- /sifre-unuttum + /sifre-sifirla flow (V3 migration)
- /audit dashboard sayfası (PRO+)
- Sıkı CSP, Cross-Origin headers
- RateLimitFilterTest 6 + AuditLoggerTest 4

## [Faz 7] — Rate Limiting + Audit Log + React Query + V2

- Bucket4j IP-based rate limiting (login 10/dk, register 5/dk)
- `com.petshop.audit` modülü — async log + REQUIRES_NEW
- React Query refactor (dashboard/urunler/satislar)
- V2 migration: audit_log + ek index'ler

## [Faz 6] — Actuator + Plan Upgrade + Dark Mode + Search

- Spring Actuator health/info endpoint'leri
- `SaasPlanController` — plan değişimi + token version bump
- Topbar dark mode toggle
- Ürün listesi arama + sayfalama

## [Faz 5] — Flyway + Next.js 16 proxy.ts

- Flyway 10.20 — V1 startup'ta otomatik
- middleware.ts → proxy.ts (Next.js 16 deprecation)
- .env.example dosyaları

## [Faz 4] — CI + Boundaries + JWT Filter Tests

- GitHub Actions backend + frontend pipeline
- (dashboard) error.tsx + loading.tsx
- JwtAuthFilterTenantTest 4

## [Faz 3] — middleware src/'e taşı

- Next.js 16 src-layout fix

## [Faz 2] — Multi-Tenant SaaS Dönüşümü

- B2B e-ticaret → multi-tenant SaaS
- companies tablosu + company_id kolonları (V1)
- TenantContext + JWT companyId/plan claim
- Plan limitleri (FREE 20 ürün, PRO sınırsız, PRO+ public shop)
- Tüm SaaS endpoint'leri + dashboard

---

## Kümülatif Test Durumu

- **Backend**: 87+ unit test
- **Frontend unit (vitest)**: 26 (16 + 4 ProductForm + 7 StockModal şu anda eklenen ile)
- **Frontend e2e (Playwright)**: 13 (8 + 5 register-flow şu anda eklenen ile)
- **Migrations**: V1-V5
- **Scheduled jobs**: AuditCleanup (03:15), LowStock (09:00), DailySummary (18:00)
