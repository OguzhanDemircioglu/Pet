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
