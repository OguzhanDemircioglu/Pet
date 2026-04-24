# Petshop — Geliştirici Notları

## Telegram Bot Entegrasyonu

Yeni sipariş geldiğinde admin'e Telegram üzerinden bildirim gönderilir.

### URL Formatı

Telegram Bot API URL'leri şu şekilde oluşturulur:

```
https://api.telegram.org/bot<TOKEN>/method
```

- `bot` — sabit prefix (Telegram API zorunluluğu)
- `<TOKEN>` — BotFather'dan alınan tam token (`numeric_id:secret` formatında)

**Örnek:**
```
Token    : 8594702070:AAG2Qoz...
API URL  : https://api.telegram.org/bot8594702070:AAG2Qoz.../sendMessage
```

`bot8594702070` gibi görünen kısım aslında `bot` + token'ın numeric ID bölümüdür.
Aralarında `/` veya boşluk yoktur.

---

### Chat ID Alma

Bot'a ilk kez mesaj gönderdikten sonra aşağıdaki URL'den chat_id öğrenilebilir:

```
https://api.telegram.org/bot<TOKEN>/getUpdates
```

Dönen JSON'da `message.chat.id` değeri chat_id'dir.

---

### Ortam Değişkenleri (.env)

| Değişken | Açıklama |
|---|---|
| `TELEGRAM_API_KEY` | BotFather'dan alınan bot token'ı |
| `TELEGRAM_CHAT_ID` | Admin'in Telegram kullanıcı ID'si |

---

### Bildirim İçeriği

Sipariş oluşturulduğunda şu formatta mesaj gelir:

```
🛒 Yeni Sipariş!
📦 Sipariş No: PET20240000001
🧾 Ürünler: Royal Canin Adult 10kg x2, ...
📍 Adres: İstanbul, Kadıköy
💰 Toplam: 3512 ₺
```

---

## Ödeme Süreci — Teknik Dökümantasyon

### 1. Akış Diyagramı

```
Frontend                Backend                    iyzico              Paraşüt
   │                      │                          │                    │
   │ POST /payment/       │                          │                    │
   │ iyzico/initiate ────▶│                          │                    │
   │                      │ ① Order PENDING kaydet   │                    │
   │                      │ ② initializeForm ───────▶│                    │
   │                      │                          │                    │
   │                      │◀──── paymentPageUrl+token│                    │
   │                      │ ③ stok düş, token yaz    │                    │
   │◀─────────paymentPageUrl                         │                    │
   │                      │                          │                    │
   │─────redirect────────────────────────────────────▶ (3D secure)        │
   │                                                 │                    │
   │              POST /payment/iyzico/callback ◀────│                    │
   │                      │ ④ retrieveForm ─────────▶│                    │
   │                      │◀────── paymentStatus     │                    │
   │                      │                          │                    │
   │                      │ ⑤ Order PAID,            │                    │
   │                      │   outbox enqueue         │                    │
   │                      │   notifications          │                    │
   │◀─302 odeme-sonuc?success=true                   │                    │
   │                      │                          │                    │
   │                      │ @Scheduled 60s  ─────────────────────────────▶│
   │                      │                          │                    │
   │                      │◀─────────────────── parasutInvoiceId + URL    │
```

### 2. Case'ler

#### Case A — Mutlu yol (PAID)
1. Kullanıcı checkout'ta sepet + adres + fatura bilgilerini gönderir → `PaymentService.initiate()`
2. **Tek transaction** (`@Transactional`) içinde:
   - `validateInvoiceFields()`: TCKN=11, VKN=10, kurumsal ise title+tax office zorunlu
   - `Order` + `OrderItem`'lar `PENDING`/`CREDIT_CARD` olarak yazılır
   - `IyzicoClient.initializeForm()` çağrılır (HTTP, iyzico sandbox/prod)
   - İyzico `success` dönerse: `iyzicoToken` yazılır, stok fiziksel olarak düşülür
3. Response: `paymentPageUrl` + `orderId` → frontend redirect
4. Kullanıcı iyzico 3D sayfasında kart bilgisi girer (kart verisi **hiçbir zaman bizim sunucumuzdan geçmez** — PCI-DSS kapsam dışı)
5. İyzico `callbackUrl = ${app.url}/payment/iyzico/callback` adresine `POST token=...` gönderir
6. `handleCallback()` içinde `retrieveForm()` ile doğrulama — iyzico'dan güncel `paymentStatus` çekilir (callback body'ye güvenilmez)
7. `SUCCESS` ise: `Order.status=PAID`, `iyzicoPaymentId` kaydedilir, `InvoiceOutbox`'a `ISSUE` kaydı düşer, bildirimler (email/telegram/in-app) kuyruğa atılır
8. 302 ile frontend'e `/odeme-sonuc?orderId=X&success=true` redirect

#### Case B — iyzico initiate hatası
- `initializeForm()` exception atarsa veya `status != success` dönerse:
- Order `CANCELLED` yapılır (same tx), `BusinessException` fırlatılır → 400
- Stok düşülmez (adım ③'e gelmeden önce)

#### Case C — Ödeme red/iptal (callback başarısız)
- `handleCallback()`: `paymentStatus != SUCCESS` → stoklar **geri eklenir**, Order `CANCELLED`
- Kullanıcı `success=false` sayfasına yönlendirilir
- Fatura outbox'a hiçbir şey düşmez

#### Case D — Token bulunamadı / manipülasyon
- `findByIyzicoToken(token)` boş → log + `success=false` redirect
- Sipariş state'i değişmez (DB'de olmayan token = işlem yok)

#### Case E — Callback kayboldu (iyzico tarafı)
- Sipariş `PENDING` takılır. Şu anda otomatik reconcile yok — manuel admin kontrolü gerekir. (İyileştirme adayı: scheduled job ile 30 dk'dan eski PENDING siparişleri `retrievePayment` ile sorgula.)

#### Case F — Paraşüt down (outbox retry)
- PAID akışı etkilenmez — ödeme tamamlanır, fatura arka planda kuyruklanır
- `InvoiceOutboxProcessor` @Scheduled(60s), exponential backoff (1/5/15 dk), max 3 deneme
- 3 başarısızlıkta `FAILED`; admin panelden `POST /admin/orders/{id}/invoice/retry` ile elden tetiklenir

#### Case G — İade (admin)
- `RefundService.refund(orderId, reason)`:
  - `PAID/PROCESSING/SHIPPED/DELIVERED` + `CREDIT_CARD` kontrolü
  - iyzico `retrievePayment(paymentId)` → her `PaymentItem.paymentTransactionId` için `refundTransaction()` (parçalı iade desteği)
  - Stoklar geri yüklenir
  - `Order.status=REFUNDED`, `refundedAt` + `refundReason` yazılır
  - Outbox'a `CANCEL` kaydı → Paraşüt `DELETE /sales_invoices/{id}/cancel`

### 3. Transaction Sınırları

- **`initiate()`**: Tek `@Transactional`. Ama iyzico HTTP çağrısı tx içinde yapılıyor → risk: **tx uzun sürer, DB connection tutulur**. İyzico'nun yavaşlaması connection pool'u daraltır. (İyileştirme adayı: Order kaydı ayrı tx'te commit edip iyzico çağrısını tx dışına almak.)
- **`handleCallback()`**: Tek `@Transactional`. İçinde iyzico retrieve + bildirim enqueue (DB insert) var; outbox işi asenkron.
- **Outbox processor**: `processOne()` kendi tx'i; **self-invocation problemi** `ApplicationContext.getBean()` ile aşıldı — bean proxy üzerinden çağrı yapılıyor ki `@Transactional` devreye girsin
- **InvoiceService**: `afterCommit` semantiği yok şu an; `enqueueIssue` direkt insert (outbox tablosunun unique constraint'i idempotency'i garanti ediyor)

### 4. Güvenlik Katmanları

#### Kart verisi
- **PCI-DSS scope dışı**: kart numarası/CVV hiçbir zaman bizim endpoint'lerimize gelmez. Kullanıcı iyzico'nun hosted checkout sayfasında giriş yapar.
- 3D Secure iyzico tarafında zorunlu

#### Authentication
- `@AuthenticationPrincipal Long userId` — JWT'den gelen userId, request body'den gelen değil (body'deki userId ignore edilir). Kullanıcı başkasının adına sipariş veremez.
- `GET /orders/{id}/invoice` ownership check: `order.getUser().getId().equals(userId)` değilse `BusinessException`

#### Tutar manipülasyonu
- **Mevcut açık**: `req.totalAmount()` client'tan geliyor ve doğrulanmıyor. Kullanıcı 1000 TL'lik sepeti 1 TL'ye ödeyebilir.
- **Yapılması gereken**: sunucuda `items[]`'tan (productId + quantity + variantId) fiyatı yeniden hesapla, aktif indirimi uygula, `totalAmount` ile karşılaştır, uyuşmazsa reject.

#### Token hijacking
- `iyzicoToken` siparişe özel, tek kullanımlık. Başka bir order'ın token'ı çalınsa bile `findByIyzicoToken` sahibi order'ı bulur; attacker başkasının siparişini kendi adına PAID yapamaz çünkü callback iyzico'dan imzalı geliyor (iyzico SDK key+secret ile imzalar).
- SDK imza doğrulaması: `iyzicoClient.retrieveForm()` içinde API-key/secret ile HMAC ⇒ response integrity garanti.

#### CSRF
- Callback `/payment/iyzico/callback` POST endpoint'i **CSRF muaf olmalı** (iyzico'dan form-urlencoded POST geliyor, session cookie yok). Spring Security config'te explicit `ignoringRequestMatchers("/payment/iyzico/callback")` olmalı — yoksa 403 döner.

#### Idempotency
- Order: `orderNumber` ve `iyzicoToken` unique
- Invoice outbox: `order_id` unique — aynı sipariş için 2. enqueue denemesi insert hatası → `InvoiceService.issueInvoiceForOrder` başında `parasutInvoiceId != null` early return
- Double callback: iyzico aynı token için 2x callback atsa, 2. çağrıda `order.status=PAID` zaten; `retrieveForm` yine `SUCCESS` döner ama outbox unique constraint koruyor, bildirimler tekrar gönderilir (bu küçük bir sorun — idempotency flag ile fix edilebilir).

#### Rate limiting / fraud
- Şu an endpoint-level rate limit yok. iyzico kendi tarafında fraud/risk motoru çalıştırıyor (IP, kart bin, velocity vb.) — `buyer.setIp(clientIp)` ile gerçek kullanıcı IP'si geçiliyor, bu iyzico'nun skorlaması için kritik.

#### Stok yarışı
- `initiate()` stok düşüşü pessimistic lock olmadan basit read-modify-write; yüksek concurrent taleplerde race condition mümkün. (İyileştirme adayı: `SELECT ... FOR UPDATE` veya `@Version` optimistic lock.)

#### Log sızıntısı
- Kart verisi loglanmıyor (iyzico SDK response'unda zaten masked gelir)
- TCKN/VKN şu an log'larda yok — emin olmak için PII-safe logger pattern eklenebilir

### 5. Yapılması Önerilen Kritik İyileştirmeler

1. **Server-side total validation** — en kritik açık
2. **iyzico HTTP çağrısını tx dışına çıkar** — connection pool koruma
3. **PENDING sipariş reconcile scheduler** — kaybolmuş callback'ler için
4. **Stok için pessimistic lock** — yarış koşulu
