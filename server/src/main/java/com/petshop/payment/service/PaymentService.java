package com.petshop.payment.service;

import com.iyzipay.model.*;
import com.iyzipay.request.CreateCheckoutFormInitializeRequest;
import com.iyzipay.request.RetrieveCheckoutFormRequest;
import com.petshop.order.constant.OrderMessages;
import com.petshop.exception.BusinessException;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.auth.api.AuthFacade;
import com.petshop.auth.api.UserSummary;
import com.petshop.catalog.api.CatalogFacade;
import com.petshop.catalog.api.ProductSummary;
import com.petshop.invoice.api.InvoiceFacade;
import com.petshop.notification.api.NotificationFacade;
import com.petshop.order.api.CreateOrderCommand;
import com.petshop.order.api.OrderFacade;
import com.petshop.order.api.OrderItemView;
import com.petshop.order.api.OrderView;
import com.petshop.order.dto.request.OrderItemRequest;
import com.petshop.order.dto.request.OrderRequest;
import com.petshop.payment.dto.response.PaymentInitiateResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * iyzico Checkout Form ödeme akışı.
 *
 * Cross-module dependencies (tümü facade üzerinden):
 *  - {@link OrderFacade}        sipariş yaratma + state geçişi (pending/paid/failed/token)
 *  - {@link CatalogFacade}      stok düşme/iade + ürün okuma
 *  - {@link AuthFacade}         kullanıcı bilgisi (iyzico buyer payload + bildirim e-postası)
 *  - {@link InvoiceFacade}      ödeme başarılı sonrası fatura outbox enqueue
 *  - {@link NotificationFacade} email + telegram + admin in-app bildirim
 *
 * Bu sınıf order/auth/catalog/invoice/notification entity veya repository'lerine
 * doğrudan erişmez — Spring Modulith sınırlarını korur.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final OrderFacade orderFacade;
    private final CatalogFacade catalogFacade;
    private final AuthFacade authFacade;
    private final InvoiceFacade invoiceFacade;
    private final NotificationFacade notificationFacade;
    private final IyzicoClient iyzicoClient;

    @Value("${app.url}")
    private String appUrl;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    // ─── Ödeme Başlatma ───────────────────────────────────────────────────────

    @Transactional
    public PaymentInitiateResponse initiate(Long userId, OrderRequest req, String clientIp) {
        UserSummary user = authFacade.findUser(userId)
                .orElseThrow(() -> new ResourceNotFoundException(OrderMessages.USER_NOT_FOUND.get() + userId));

        validateInvoiceFields(req);

        // Sipariş kalemlerini, ürün SKU'sunu CatalogFacade'den enrich ederek hazırla
        List<CreateOrderCommand.CreateOrderItem> cmdItems = new ArrayList<>();
        for (OrderItemRequest itemReq : req.items()) {
            String sku = "";
            if (itemReq.productId() != null) {
                ProductSummary p = catalogFacade.findProduct(itemReq.productId()).orElse(null);
                if (p != null && p.sku() != null) sku = p.sku();
            }
            cmdItems.add(new CreateOrderCommand.CreateOrderItem(
                    itemReq.productId(),
                    itemReq.variantId(),
                    itemReq.productName(),
                    sku,
                    null,                       // variantLabel: PaymentService akışında variantId opsiyonel
                    itemReq.quantity(),
                    itemReq.unitPrice()
            ));
        }

        // Order'ı PENDING + CREDIT_CARD olarak yarat (cross-module facade)
        CreateOrderCommand cmd = new CreateOrderCommand(
                user.id(),
                "CREDIT_CARD",
                user.email(),
                req.fullName(),
                req.phone(),
                req.address(),
                req.city(),
                req.district(),
                null,
                normalizeInvoiceType(req.invoiceType()),
                req.invoiceIdentityNo(),
                req.invoiceTitle(),
                req.invoiceTaxOffice(),
                req.invoiceAddress() != null ? req.invoiceAddress() : req.address(),
                req.invoiceCity()    != null ? req.invoiceCity()    : req.city(),
                req.invoiceDistrict()!= null ? req.invoiceDistrict(): req.district(),
                req.totalAmount(),
                BigDecimal.ZERO,
                req.totalAmount(),
                cmdItems
        );
        Long orderId = orderFacade.createPendingOrder(cmd);
        OrderView order = orderFacade.findOrder(orderId)
                .orElseThrow(() -> new IllegalStateException("Yeni yaratılan sipariş okunamadı: #" + orderId));

        // iyzico Checkout Form isteği oluştur
        CreateCheckoutFormInitializeRequest iyzicoReq = buildIyzicoRequest(order, user, req, clientIp);

        CheckoutFormInitialize init;
        try {
            init = iyzicoClient.initializeForm(iyzicoReq);
        } catch (Exception e) {
            log.error("iyzico entegrasyon başarısız — sipariş #{}: {}", orderId, e.getMessage());
            orderFacade.markFailed(orderId);
            throw new BusinessException("Ödeme başlatılamadı: " + e.getMessage());
        }

        if (!"success".equalsIgnoreCase(init.getStatus())) {
            log.error("iyzico entegrasyon başarısız — sipariş #{}: [{}] {}",
                    orderId, init.getErrorCode(), init.getErrorMessage());
            orderFacade.markFailed(orderId);
            throw new BusinessException("Ödeme başlatılamadı: " + init.getErrorMessage());
        }

        // Token'ı sipariş kaydına yaz
        orderFacade.setIyzicoToken(orderId, init.getToken());

        // Stok düş — iyzico form üretildi, sipariş kilitlendi
        for (OrderItemView item : order.items()) {
            if (item.productId() == null) continue;
            try {
                catalogFacade.decrementStock(item.productId(), item.variantId(), item.quantity());
            } catch (Exception e) {
                log.warn("Stok düşme uyarısı — sipariş #{}, ürün #{}: {}",
                        orderId, item.productId(), e.getMessage());
            }
        }

        log.info("iyzico entegrasyon başlatıldı — sipariş #{}, tutar: {} TL", orderId, req.totalAmount());

        return new PaymentInitiateResponse(orderId, init.getPaymentPageUrl());
    }

    // ─── Callback (iyzico'dan dönen sonuç) ───────────────────────────────────

    @Transactional
    public String handleCallback(String token) {
        Long orderId = orderFacade.findOrderIdByIyzicoToken(token).orElse(null);
        if (orderId == null) {
            log.error("iyzico callback — token ile sipariş bulunamadı: {}", token);
            return frontendUrl + "/odeme-sonuc?success=false";
        }
        OrderView order = orderFacade.findOrder(orderId).orElse(null);
        if (order == null) {
            log.error("iyzico callback — sipariş #{} okunamadı", orderId);
            return frontendUrl + "/odeme-sonuc?success=false";
        }

        RetrieveCheckoutFormRequest retrieveReq = new RetrieveCheckoutFormRequest();
        retrieveReq.setToken(token);

        CheckoutForm form;
        try {
            form = iyzicoClient.retrieveForm(retrieveReq);
        } catch (Exception e) {
            log.error("iyzico entegrasyon başarısız — sipariş #{}: {}", orderId, e.getMessage());
            orderFacade.markFailed(orderId);
            return frontendUrl + "/odeme-sonuc?orderId=" + orderId + "&success=false";
        }

        if ("success".equalsIgnoreCase(form.getStatus()) && "SUCCESS".equals(form.getPaymentStatus())) {
            orderFacade.markPaid(orderId, form.getPaymentId());
            log.info("iyzico ödeme başarılı — sipariş #{}, ödeme ID: {}, tutar: {} TL",
                    orderId, form.getPaymentId(), form.getPaidPrice());

            // Email + Telegram bildirimleri (hata olsa sipariş etkilenmez)
            // Re-read orderView so post-paid status etc. is current
            orderFacade.findOrder(orderId).ifPresent(this::sendPostPaymentNotifications);

            // Paraşüt fatura outbox'a ekle (async retry'li)
            try {
                invoiceFacade.enqueueIssue(orderId);
            } catch (Exception e) {
                log.error("Fatura outbox enqueue başarısız — sipariş #{}: {}", orderId, e.getMessage());
            }

            return frontendUrl + "/odeme-sonuc?orderId=" + orderId + "&success=true";
        } else {
            // Ödeme başarısız — stok iade + iptal
            for (OrderItemView item : order.items()) {
                if (item.productId() == null) continue;
                catalogFacade.restoreStock(item.productId(), item.variantId(), item.quantity());
                catalogFacade.fireStockBackIfSubscribed(item.productId(), item.variantId());
            }
            orderFacade.markFailed(orderId);
            log.warn("iyzico ödeme başarısız — sipariş #{}, kod: {}, mesaj: {}",
                    orderId, form.getErrorCode(), form.getErrorMessage());
            return frontendUrl + "/odeme-sonuc?orderId=" + orderId + "&success=false";
        }
    }

    // ─── Yardımcı metotlar ────────────────────────────────────────────────────

    private CreateCheckoutFormInitializeRequest buildIyzicoRequest(
            OrderView order, UserSummary user, OrderRequest req, String clientIp) {

        CreateCheckoutFormInitializeRequest r = new CreateCheckoutFormInitializeRequest();
        r.setLocale(Locale.TR.getValue());
        r.setConversationId(order.id().toString());
        r.setPrice(req.totalAmount().setScale(2, RoundingMode.HALF_UP));
        r.setPaidPrice(req.totalAmount().setScale(2, RoundingMode.HALF_UP));
        r.setCurrency(Currency.TRY.name());
        r.setBasketId(order.orderNumber());
        r.setPaymentGroup(PaymentGroup.PRODUCT.name());
        r.setCallbackUrl(appUrl + "/payment/iyzico/callback");
        r.setEnabledInstallments(List.of(2, 3, 6, 9));

        // Alıcı bilgileri
        com.iyzipay.model.Buyer buyer = new com.iyzipay.model.Buyer();
        buyer.setId(user.id().toString());
        buyer.setName(user.firstName() != null ? user.firstName() : req.fullName().split(" ")[0]);
        buyer.setSurname(user.lastName() != null ? user.lastName() : "");
        buyer.setGsmNumber(formatPhone(req.phone()));
        buyer.setEmail(user.email());
        buyer.setIdentityNumber("11111111111"); // Sandbox — gerçekte TC kimlik gerekli
        buyer.setLastLoginDate("2015-10-05 12:43:35");
        buyer.setRegistrationDate("2013-04-21 15:12:09");
        buyer.setRegistrationAddress(req.address());
        buyer.setIp(clientIp != null && !clientIp.isBlank() ? clientIp : "127.0.0.1");
        buyer.setCity(req.city());
        buyer.setCountry("Turkey");
        buyer.setZipCode("34000");
        r.setBuyer(buyer);

        // Teslimat adresi
        Address shippingAddress = new Address();
        shippingAddress.setContactName(req.fullName());
        shippingAddress.setCity(req.city());
        shippingAddress.setCountry("Turkey");
        shippingAddress.setAddress(req.address());
        r.setShippingAddress(shippingAddress);
        r.setBillingAddress(shippingAddress);

        // Sepet kalemleri
        List<BasketItem> basketItems = new ArrayList<>();
        BigDecimal itemsTotal = BigDecimal.ZERO;

        List<OrderItemRequest> reqItems = req.items();
        for (int i = 0; i < reqItems.size(); i++) {
            OrderItemRequest item = reqItems.get(i);
            BigDecimal lineTotal;

            // Son öğeye kalan tüm tutarı ver (yuvarlama farkını dengele)
            if (i == reqItems.size() - 1) {
                lineTotal = req.totalAmount().subtract(itemsTotal).setScale(2, RoundingMode.HALF_UP);
            } else {
                lineTotal = item.unitPrice()
                        .multiply(BigDecimal.valueOf(item.quantity()))
                        .setScale(2, RoundingMode.HALF_UP);
            }
            itemsTotal = itemsTotal.add(lineTotal);

            BasketItem basketItem = new BasketItem();
            basketItem.setId(item.productId() != null ? item.productId().toString() : String.valueOf(i));
            basketItem.setName(item.productName());
            basketItem.setCategory1("Pet Ürünleri");
            basketItem.setItemType(BasketItemType.PHYSICAL.name());
            basketItem.setPrice(lineTotal);
            basketItems.add(basketItem);
        }
        r.setBasketItems(basketItems);
        return r;
    }

    private String formatPhone(String phone) {
        if (phone == null) return "+905000000000";
        String digits = phone.replaceAll("\\D", "");
        if (digits.startsWith("90") && digits.length() == 12) return "+" + digits;
        if (digits.startsWith("0")  && digits.length() == 11) return "+9" + digits;
        if (digits.length() == 10)                            return "+90" + digits;
        return "+" + digits;
    }

    private void sendPostPaymentNotifications(OrderView order) {
        if (order.userId() == null) return;
        UserSummary user = authFacade.findUser(order.userId()).orElse(null);
        if (user == null) return;

        // Admin in-app bildirimi
        try {
            List<Long> adminIds = authFacade.findAdmins().stream().map(UserSummary::id).toList();
            String payLabel = "CREDIT_CARD".equals(order.paymentMethod()) ? "💳 Kredi Kartı" : "💵 Teslimatta Öde";
            String adminMsg = "🛒 Yeni sipariş #" + order.id() + " — "
                    + order.guestName() + " — ₺" + order.total()
                    + " (" + payLabel + ")";
            notificationFacade.notifyAdminsAboutOrder(adminIds, adminMsg, order.id());
        } catch (Exception e) {
            log.error(OrderMessages.LOG_NOTIF_FAIL.get(), e.getMessage());
        }

        // Müşteri in-app bildirimi
        try {
            String msg = OrderMessages.ORDER_NOTIFICATION_TEMPLATE.format(order.id());
            notificationFacade.notifyUser(user.id(), msg, OrderMessages.NOTIFICATION_TYPE_ORDER.get());
        } catch (Exception e) {
            log.error(OrderMessages.LOG_NOTIF_FAIL.get(), e.getMessage());
        }

        // Email kuyruğa al
        try {
            String itemsHtml = order.items().stream()
                    .map(i -> "<tr><td>" + i.productName() + "</td><td>" + i.quantity() + "</td><td>₺" + i.lineTotal() + "</td></tr>")
                    .reduce("", String::concat);
            String deliveryAddr = order.shippingCity() + " / " + order.shippingDistrict() + "\n" + order.shippingAddress();
            notificationFacade.enqueueOrderConfirmationEmail(
                    user.email(),
                    user.firstName() != null ? user.firstName() : order.guestName(),
                    order.id(),
                    itemsHtml,
                    deliveryAddr,
                    order.total().toString()
            );
        } catch (Exception e) {
            log.error(OrderMessages.LOG_EMAIL_QUEUE_FAIL.get(), e.getMessage());
        }

        // Telegram kuyruğa al
        try {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
            StringBuilder sb = new StringBuilder();
            sb.append("🛒 <b>Yeni Sipariş #").append(order.id()).append("</b>\n");
            sb.append("👤 ").append(user.firstName()).append(" ").append(user.lastName())
              .append(" (").append(user.email()).append(")\n");
            sb.append("📞 ").append(order.guestPhone() != null ? order.guestPhone() : "").append("\n");
            sb.append("📍 ").append(order.shippingCity()).append(" / ").append(order.shippingDistrict()).append("\n");
            sb.append(order.shippingAddress()).append("\n\n");
            sb.append("📦 <b>Ürünler:</b>\n");
            order.items().forEach(i -> sb.append("- ").append(i.productName())
                    .append(" x").append(i.quantity())
                    .append(" → ₺").append(i.lineTotal()).append("\n"));
            sb.append("\n💰 <b>Toplam: ₺").append(order.total()).append("</b>\n");
            sb.append("💳 Ödeme: 💳 Kredi Kartı (ÖDEME ALINDI)\n");
            if (order.createdAt() != null) {
                sb.append("🕐 ").append(order.createdAt().format(fmt));
            }
            notificationFacade.enqueueTelegramMessage(sb.toString());
        } catch (Exception e) {
            log.error(OrderMessages.LOG_TELEGRAM_QUEUE_FAIL.get(), e.getMessage());
        }
    }

    private String normalizeInvoiceType(String s) {
        if (s == null || s.isBlank()) return "INDIVIDUAL";
        String up = s.toUpperCase();
        return ("CORPORATE".equals(up) || "INDIVIDUAL".equals(up)) ? up : "INDIVIDUAL";
    }

    private void validateInvoiceFields(OrderRequest req) {
        if (req.invoiceIdentityNo() == null || req.invoiceIdentityNo().isBlank()) {
            throw new BusinessException("Fatura için TCKN/VKN zorunludur");
        }
        boolean corporate = "CORPORATE".equalsIgnoreCase(req.invoiceType());
        if (corporate) {
            if (req.invoiceIdentityNo().length() != 10) {
                throw new BusinessException("Kurumsal fatura için 10 haneli VKN gereklidir");
            }
            if (req.invoiceTitle() == null || req.invoiceTitle().isBlank()) {
                throw new BusinessException("Kurumsal fatura için ünvan zorunludur");
            }
            if (req.invoiceTaxOffice() == null || req.invoiceTaxOffice().isBlank()) {
                throw new BusinessException("Kurumsal fatura için vergi dairesi zorunludur");
            }
        } else {
            if (req.invoiceIdentityNo().length() != 11) {
                throw new BusinessException("Bireysel fatura için 11 haneli TCKN gereklidir");
            }
        }
    }
}
