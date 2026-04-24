package com.petshop.service;

import com.iyzipay.model.*;
import com.iyzipay.request.CreateCheckoutFormInitializeRequest;
import com.iyzipay.request.RetrieveCheckoutFormRequest;
import com.petshop.constant.OrderMessages;
import com.petshop.dto.request.OrderItemRequest;
import com.petshop.dto.request.OrderRequest;
import com.petshop.dto.response.PaymentInitiateResponse;
import com.petshop.entity.Order;
import com.petshop.entity.OrderItem;
import com.petshop.entity.Product;
import com.petshop.entity.User;
import com.petshop.exception.BusinessException;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.repository.OrderRepository;
import com.petshop.repository.ProductRepository;
import com.petshop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final NotificationService notificationService;
    private final NotificationOutboxService notificationOutboxService;
    private final TelegramOutboxService telegramOutboxService;
    private final InvoiceOutboxService invoiceOutboxService;
    private final IyzicoClient iyzicoClient;

    @Value("${app.url}")
    private String appUrl;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    // ─── Ödeme Başlatma ───────────────────────────────────────────────────────

    @Transactional
    public PaymentInitiateResponse initiate(Long userId, OrderRequest req, String clientIp) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(OrderMessages.USER_NOT_FOUND.get() + userId));

        validateInvoiceFields(req);

        String orderNumber = generateOrderNumber();

        // Sipariş oluştur (PENDING + CREDIT_CARD)
        List<OrderItem> orderItems = new ArrayList<>();
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(user)
                .status(Order.OrderStatus.PENDING)
                .paymentMethod(Order.PaymentMethod.CREDIT_CARD)
                .guestName(req.fullName())
                .guestPhone(req.phone())
                .shippingCity(req.city())
                .shippingDistrict(req.district())
                .shippingAddress(req.address())
                .invoiceType(parseInvoiceType(req.invoiceType()))
                .invoiceIdentityNo(req.invoiceIdentityNo())
                .invoiceTitle(req.invoiceTitle())
                .invoiceTaxOffice(req.invoiceTaxOffice())
                .invoiceAddress(req.invoiceAddress() != null ? req.invoiceAddress() : req.address())
                .invoiceCity(req.invoiceCity() != null ? req.invoiceCity() : req.city())
                .invoiceDistrict(req.invoiceDistrict() != null ? req.invoiceDistrict() : req.district())
                .total(req.totalAmount())
                .subtotal(req.totalAmount())
                .discountAmount(BigDecimal.ZERO)
                .items(orderItems)
                .build();

        for (OrderItemRequest itemReq : req.items()) {
            Product product = null;
            if (itemReq.productId() != null) {
                product = productRepository.findById(itemReq.productId()).orElse(null);
            }
            OrderItem item = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .productName(itemReq.productName())
                    .productSku(product != null && product.getSku() != null ? product.getSku() : "")
                    .quantity(itemReq.quantity())
                    .unitPrice(itemReq.unitPrice())
                    .lineTotal(itemReq.unitPrice().multiply(BigDecimal.valueOf(itemReq.quantity())))
                    .build();
            orderItems.add(item);
        }

        Order savedOrder = orderRepository.save(order);

        // iyzico Checkout Form isteği oluştur
        CreateCheckoutFormInitializeRequest iyzicoReq = buildIyzicoRequest(savedOrder, user, req, clientIp);

        CheckoutFormInitialize init;
        try {
            init = iyzicoClient.initializeForm(iyzicoReq);
        } catch (Exception e) {
            log.error("iyzico entegrasyon başarısız — sipariş #{}: {}", savedOrder.getId(), e.getMessage());
            savedOrder.setStatus(Order.OrderStatus.CANCELLED);
            orderRepository.save(savedOrder);
            throw new BusinessException("Ödeme başlatılamadı: " + e.getMessage());
        }

        if (!"success".equalsIgnoreCase(init.getStatus())) {
            log.error("iyzico entegrasyon başarısız — sipariş #{}: [{}] {}",
                    savedOrder.getId(), init.getErrorCode(), init.getErrorMessage());
            savedOrder.setStatus(Order.OrderStatus.CANCELLED);
            orderRepository.save(savedOrder);
            throw new BusinessException("Ödeme başlatılamadı: " + init.getErrorMessage());
        }

        // Token'ı sipariş kaydına yaz
        savedOrder.setIyzicoToken(init.getToken());
        orderRepository.save(savedOrder);

        // Stok düş — iyzico başarılı, sipariş alındı
        for (OrderItem item : savedOrder.getItems()) {
            if (item.getProduct() == null) continue;
            Product p = productRepository.findById(item.getProduct().getId()).orElse(null);
            if (p == null) continue;
            if (p.getStockQuantity() >= item.getQuantity()) {
                p.setStockQuantity(p.getStockQuantity() - item.getQuantity());
                productRepository.save(p);
                log.info("Stok düşüldü (CC): ürün #{} → {} adet, kalan: {}",
                        p.getId(), item.getQuantity(), p.getStockQuantity());
            }
        }

        log.info("iyzico entegrasyon başlatıldı — sipariş #{}, tutar: {} TL", savedOrder.getId(), req.totalAmount());

        return new PaymentInitiateResponse(savedOrder.getId(), init.getPaymentPageUrl());
    }

    // ─── Callback (iyzico'dan dönen sonuç) ───────────────────────────────────

    @Transactional
    public String handleCallback(String token) {
        Order order = orderRepository.findByIyzicoToken(token).orElse(null);

        if (order == null) {
            log.error("iyzico callback — token ile sipariş bulunamadı: {}", token);
            return frontendUrl + "/odeme-sonuc?success=false";
        }

        RetrieveCheckoutFormRequest retrieveReq = new RetrieveCheckoutFormRequest();
        retrieveReq.setToken(token);

        CheckoutForm form;
        try {
            form = iyzicoClient.retrieveForm(retrieveReq);
        } catch (Exception e) {
            log.error("iyzico entegrasyon başarısız — sipariş #{}: {}", order.getId(), e.getMessage());
            order.setStatus(Order.OrderStatus.CANCELLED);
            orderRepository.save(order);
            return frontendUrl + "/odeme-sonuc?orderId=" + order.getId() + "&success=false";
        }

        if ("success".equalsIgnoreCase(form.getStatus()) && "SUCCESS".equals(form.getPaymentStatus())) {
            order.setStatus(Order.OrderStatus.PAID);
            order.setIyzicoPaymentId(form.getPaymentId());
            orderRepository.save(order);
            log.info("iyzico ödeme başarılı — sipariş #{}, ödeme ID: {}, tutar: {} TL",
                    order.getId(), form.getPaymentId(), form.getPaidPrice());

            // Email + Telegram bildirimleri (hata olsa sipariş etkilenmez)
            sendPostPaymentNotifications(order);

            // Paraşüt fatura outbox'a ekle (async retry'li)
            try {
                invoiceOutboxService.enqueueIssue(order);
            } catch (Exception e) {
                log.error("Fatura outbox enqueue başarısız — sipariş #{}: {}", order.getId(), e.getMessage());
            }

            return frontendUrl + "/odeme-sonuc?orderId=" + order.getId() + "&success=true";
        } else {
            // Ödeme başarısız — stok iade et
            for (OrderItem item : order.getItems()) {
                if (item.getProduct() == null) continue;
                Product p = productRepository.findById(item.getProduct().getId()).orElse(null);
                if (p == null) continue;
                p.setStockQuantity(p.getStockQuantity() + item.getQuantity());
                productRepository.save(p);
                log.info("Stok iade edildi (CC iptal): ürün #{} → {} adet geri eklendi, yeni: {}",
                        p.getId(), item.getQuantity(), p.getStockQuantity());
            }
            order.setStatus(Order.OrderStatus.CANCELLED);
            orderRepository.save(order);
            log.warn("iyzico ödeme başarısız — sipariş #{}, kod: {}, mesaj: {}",
                    order.getId(), form.getErrorCode(), form.getErrorMessage());
            return frontendUrl + "/odeme-sonuc?orderId=" + order.getId() + "&success=false";
        }
    }

    // ─── Yardımcı metotlar ────────────────────────────────────────────────────

    private CreateCheckoutFormInitializeRequest buildIyzicoRequest(
            Order order, User user, OrderRequest req, String clientIp) {

        CreateCheckoutFormInitializeRequest r = new CreateCheckoutFormInitializeRequest();
        r.setLocale(Locale.TR.getValue());
        r.setConversationId(order.getId().toString());
        r.setPrice(req.totalAmount().setScale(2, RoundingMode.HALF_UP));
        r.setPaidPrice(req.totalAmount().setScale(2, RoundingMode.HALF_UP));
        r.setCurrency(Currency.TRY.name());
        r.setBasketId(order.getOrderNumber());
        r.setPaymentGroup(PaymentGroup.PRODUCT.name());
        r.setCallbackUrl(appUrl + "/payment/iyzico/callback");
        r.setEnabledInstallments(List.of(2, 3, 6, 9));

        // Alıcı bilgileri
        com.iyzipay.model.Buyer buyer = new com.iyzipay.model.Buyer();
        buyer.setId(user.getId().toString());
        buyer.setName(user.getFirstName() != null ? user.getFirstName() : req.fullName().split(" ")[0]);
        buyer.setSurname(user.getLastName() != null ? user.getLastName() : "");
        buyer.setGsmNumber(formatPhone(req.phone()));
        buyer.setEmail(user.getEmail());
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
        if (digits.startsWith("0") && digits.length() == 11) return "+9" + digits;
        if (digits.length() == 10) return "+90" + digits;
        return "+" + digits;
    }

    private void sendPostPaymentNotifications(Order order) {
        User user = order.getUser();
        if (user == null) return;

        // Admin bildirimi
        try {
            notificationService.createAdminNotificationsForOrder(order);
        } catch (Exception e) {
            log.error(OrderMessages.LOG_NOTIF_FAIL.get(), e.getMessage());
        }

        // Müşteri in-app bildirimi
        try {
            String msg = OrderMessages.ORDER_NOTIFICATION_TEMPLATE.format(order.getId());
            notificationService.createNotification(user, msg, OrderMessages.NOTIFICATION_TYPE_ORDER.get());
        } catch (Exception e) {
            log.error(OrderMessages.LOG_NOTIF_FAIL.get(), e.getMessage());
        }

        // Email kuyruğa al
        try {
            String itemsHtml = order.getItems().stream()
                    .map(i -> "<tr><td>" + i.getProductName() + "</td><td>" + i.getQuantity() + "</td><td>₺" + i.getLineTotal() + "</td></tr>")
                    .reduce("", String::concat);
            String deliveryAddr = order.getShippingCity() + " / " + order.getShippingDistrict() + "\n" + order.getShippingAddress();
            notificationOutboxService.enqueueOrderConfirmation(
                    user.getEmail(),
                    user.getFirstName() != null ? user.getFirstName() : order.getGuestName(),
                    order.getId(),
                    itemsHtml,
                    deliveryAddr,
                    order.getTotal().toString()
            );
        } catch (Exception e) {
            log.error(OrderMessages.LOG_EMAIL_QUEUE_FAIL.get(), e.getMessage());
        }

        // Telegram kuyruğa al
        try {
            java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
            StringBuilder sb = new StringBuilder();
            sb.append("🛒 <b>Yeni Sipariş #").append(order.getId()).append("</b>\n");
            sb.append("👤 ").append(user.getFirstName()).append(" ").append(user.getLastName())
              .append(" (").append(user.getEmail()).append(")\n");
            sb.append("📞 ").append(order.getGuestPhone() != null ? order.getGuestPhone() : "").append("\n");
            sb.append("📍 ").append(order.getShippingCity()).append(" / ").append(order.getShippingDistrict()).append("\n");
            sb.append(order.getShippingAddress()).append("\n\n");
            sb.append("📦 <b>Ürünler:</b>\n");
            order.getItems().forEach(i -> sb.append("- ").append(i.getProductName())
                    .append(" x").append(i.getQuantity())
                    .append(" → ₺").append(i.getLineTotal()).append("\n"));
            sb.append("\n💰 <b>Toplam: ₺").append(order.getTotal()).append("</b>\n");
            sb.append("💳 Ödeme: 💳 Kredi Kartı (ÖDEME ALINDI)\n");
            if (order.getCreatedAt() != null) {
                sb.append("🕐 ").append(order.getCreatedAt().format(fmt));
            }
            telegramOutboxService.enqueue(sb.toString());
        } catch (Exception e) {
            log.error(OrderMessages.LOG_TELEGRAM_QUEUE_FAIL.get(), e.getMessage());
        }
    }

    private Order.InvoiceType parseInvoiceType(String s) {
        if (s == null || s.isBlank()) return Order.InvoiceType.INDIVIDUAL;
        try { return Order.InvoiceType.valueOf(s.toUpperCase()); }
        catch (Exception e) { return Order.InvoiceType.INDIVIDUAL; }
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

    private String generateOrderNumber() {
        return orderRepository.findLastOrderNumber()
                .map(last -> {
                    try {
                        long num = Long.parseLong(last.substring(2));
                        return OrderMessages.ORDER_NUMBER_PREFIX.get() + String.format("%08d", num + 1);
                    } catch (Exception e) {
                        return OrderMessages.ORDER_NUMBER_PREFIX.get() + String.format("%08d", System.currentTimeMillis() % 100_000_000L);
                    }
                })
                .orElse(OrderMessages.ORDER_NUMBER_PREFIX.get() + String.format("%08d", 1L));
    }
}
