package com.petshop.order.service;

import com.petshop.auth.api.AuthFacade;
import com.petshop.auth.api.UserSummary;
import com.petshop.catalog.api.CatalogFacade;
import com.petshop.notification.api.NotificationFacade;
import com.petshop.order.api.CreateOrderCommand;
import com.petshop.order.dto.request.OrderItemRequest;
import com.petshop.order.dto.request.OrderRequest;
import com.petshop.order.dto.response.OrderResponse;
import com.petshop.order.entity.Order;
import com.petshop.order.entity.OrderItem;
import com.petshop.order.constant.OrderMessages;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final AuthFacade authFacade;
    private final CatalogFacade catalogFacade;
    private final NotificationFacade notificationFacade;

    @Transactional
    public OrderResponse createOrder(Long userId, OrderRequest req) {
        UserSummary user = authFacade.findUser(userId)
                .orElseThrow(() -> new ResourceNotFoundException(OrderMessages.USER_NOT_FOUND.get() + userId));

        // Sipariş kaydedilmeden önce stok kontrolü
        for (OrderItemRequest itemReq : req.items()) {
            if (itemReq.productId() == null) continue;
            catalogFacade.assertAvailable(itemReq.productId(), itemReq.variantId(), itemReq.quantity());
        }

        // Sipariş numarası üret
        String orderNumber = generateOrderNumber();

        // OrderItem listesi oluştur
        List<OrderItem> orderItems = new ArrayList<>();
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .userId(user.id())
                .status(Order.OrderStatus.PENDING)
                .paymentMethod(Order.PaymentMethod.COD)
                .guestName(req.fullName())
                .guestPhone(req.phone())
                .shippingCity(req.city())
                .shippingDistrict(req.district())
                .shippingAddress(req.address())
                .total(req.totalAmount())
                .subtotal(req.totalAmount())
                .discountAmount(java.math.BigDecimal.ZERO)
                .items(orderItems)
                .build();

        for (OrderItemRequest itemReq : req.items()) {
            String sku = "";
            if (itemReq.productId() != null) {
                sku = catalogFacade.findProduct(itemReq.productId()).map(p -> p.sku() != null ? p.sku() : "").orElse("");
            }
            String variantLabel = null;
            if (itemReq.variantId() != null) {
                variantLabel = catalogFacade.findVariant(itemReq.variantId()).map(v -> v.label()).orElse(null);
            }

            OrderItem item = OrderItem.builder()
                    .order(order)
                    .productId(itemReq.productId())
                    .productName(itemReq.productName())
                    .productSku(sku)
                    .variantId(itemReq.variantId())
                    .variantLabel(variantLabel)
                    .quantity(itemReq.quantity())
                    .unitPrice(itemReq.unitPrice())
                    .lineTotal(itemReq.unitPrice().multiply(java.math.BigDecimal.valueOf(itemReq.quantity())))
                    .build();
            orderItems.add(item);
        }

        Order savedOrder = orderRepository.save(order);
        log.info(OrderMessages.LOG_ORDER_CREATED.get(), orderNumber, userId);

        // Stok düş (sipariş alındı)
        for (OrderItemRequest itemReq : req.items()) {
            if (itemReq.productId() == null && itemReq.variantId() == null) continue;
            catalogFacade.decrementStock(itemReq.productId(), itemReq.variantId(), itemReq.quantity());
        }

        // Admin bildirimi gönder
        try {
            List<Long> adminIds = authFacade.findAdmins().stream().map(UserSummary::id).toList();
            String payLabel = savedOrder.getPaymentMethod() == Order.PaymentMethod.CREDIT_CARD
                    ? "💳 Kredi Kartı" : "💵 Teslimatta Öde";
            String adminMsg = "🛒 Yeni sipariş #" + savedOrder.getId() + " — "
                    + savedOrder.getGuestName() + " — ₺" + savedOrder.getTotal()
                    + " (" + payLabel + ")";
            notificationFacade.notifyAdminsAboutOrder(adminIds, adminMsg, savedOrder.getId());
        } catch (Exception e) {
            log.error("Admin bildirimi gönderilemedi: {}", e.getMessage());
        }

        // Bildirim kaydet
        try {
            String notifMessage = OrderMessages.ORDER_NOTIFICATION_TEMPLATE.format(savedOrder.getId());
            notificationFacade.notifyUser(user.id(), notifMessage, OrderMessages.NOTIFICATION_TYPE_ORDER.get());
        } catch (Exception e) {
            log.error(OrderMessages.LOG_NOTIF_FAIL.get(), e.getMessage());
        }

        // Email kuyruğa al
        try {
            String itemsHtml = buildItemsHtml(savedOrder);
            String deliveryAddress = req.city() + " / " + req.district() + "\n" + req.address();
            notificationFacade.enqueueOrderConfirmationEmail(
                    user.email(),
                    user.firstName() != null ? user.firstName() : req.fullName(),
                    savedOrder.getId(),
                    itemsHtml,
                    deliveryAddress,
                    req.totalAmount().toString()
            );
        } catch (Exception e) {
            log.error(OrderMessages.LOG_EMAIL_QUEUE_FAIL.get(), e.getMessage());
        }

        // Telegram bildir
        try {
            String telegramMsg = buildTelegramMessage(savedOrder, user, req);
            notificationFacade.enqueueTelegramMessage(telegramMsg);
        } catch (Exception e) {
            log.error(OrderMessages.LOG_TELEGRAM_QUEUE_FAIL.get(), e.getMessage());
        }

        return OrderResponse.from(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getUserOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(OrderResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(OrderResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse approveOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(OrderMessages.ORDER_NOT_FOUND.get() + orderId));
        order.setStatus(Order.OrderStatus.PROCESSING);
        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse rejectOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(OrderMessages.ORDER_NOT_FOUND.get() + orderId));
        if (order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new com.petshop.exception.BusinessException(OrderMessages.ORDER_ALREADY_CANCELLED.get());
        }
        // Stok iade et
        for (OrderItem item : order.getItems()) {
            if (item.getProductId() == null && item.getVariantId() == null) continue;
            catalogFacade.restoreStock(item.getProductId(), item.getVariantId(), item.getQuantity());
            catalogFacade.fireStockBackIfSubscribed(item.getProductId(), item.getVariantId());
        }
        order.setStatus(Order.OrderStatus.CANCELLED);
        return OrderResponse.from(orderRepository.save(order));
    }

    // ───────────────────────── Package-private mutators (for OrderFacadeImpl) ─

    @Transactional
    public Long createPending(CreateOrderCommand cmd) {
        String orderNumber = generateOrderNumber();
        List<OrderItem> orderItems = new ArrayList<>();
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .userId(cmd.userId())
                .status(Order.OrderStatus.PENDING)
                .paymentMethod(parsePaymentMethod(cmd.paymentMethod()))
                .guestEmail(cmd.guestEmail())
                .guestName(cmd.guestName())
                .guestPhone(cmd.guestPhone())
                .shippingAddress(cmd.shippingAddress())
                .shippingCity(cmd.shippingCity())
                .shippingDistrict(cmd.shippingDistrict())
                .shippingPostalCode(cmd.shippingPostalCode())
                .invoiceType(parseInvoiceType(cmd.invoiceType()))
                .invoiceIdentityNo(cmd.invoiceIdentityNo())
                .invoiceTitle(cmd.invoiceTitle())
                .invoiceTaxOffice(cmd.invoiceTaxOffice())
                .invoiceAddress(cmd.invoiceAddress())
                .invoiceCity(cmd.invoiceCity())
                .invoiceDistrict(cmd.invoiceDistrict())
                .subtotal(cmd.subtotal())
                .discountAmount(cmd.discountAmount() != null ? cmd.discountAmount() : java.math.BigDecimal.ZERO)
                .total(cmd.total())
                .items(orderItems)
                .build();

        if (cmd.items() != null) {
            for (CreateOrderCommand.CreateOrderItem it : cmd.items()) {
                OrderItem oi = OrderItem.builder()
                        .order(order)
                        .productId(it.productId())
                        .variantId(it.variantId())
                        .productName(it.productName())
                        .productSku(it.productSku() != null ? it.productSku() : "")
                        .variantLabel(it.variantLabel())
                        .quantity(it.quantity())
                        .unitPrice(it.unitPrice())
                        .lineTotal(it.unitPrice().multiply(java.math.BigDecimal.valueOf(it.quantity())))
                        .build();
                orderItems.add(oi);
            }
        }

        return orderRepository.save(order).getId();
    }

    @Transactional
    public void markPaid(Long orderId, String iyzicoPaymentId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(OrderMessages.ORDER_NOT_FOUND.get() + orderId));
        order.setStatus(Order.OrderStatus.PAID);
        if (iyzicoPaymentId != null) order.setIyzicoPaymentId(iyzicoPaymentId);
        orderRepository.save(order);
        // Stok düşümü ödeme öncesi (initiate) yapılıyor — burada tekrar düşmüyoruz.
    }

    @Transactional
    public void markFailed(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(OrderMessages.ORDER_NOT_FOUND.get() + orderId));
        order.setStatus(Order.OrderStatus.CANCELLED);
        orderRepository.save(order);
    }

    @Transactional
    public void markRefunded(Long orderId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(OrderMessages.ORDER_NOT_FOUND.get() + orderId));
        order.setStatus(Order.OrderStatus.REFUNDED);
        order.setRefundedAt(LocalDateTime.now());
        order.setRefundReason(reason);
        orderRepository.save(order);
    }

    @Transactional
    public void setIyzicoToken(Long orderId, String token) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(OrderMessages.ORDER_NOT_FOUND.get() + orderId));
        order.setIyzicoToken(token);
        orderRepository.save(order);
    }

    @Transactional
    public void updateInvoiceMetadata(Long orderId, String parasutContactId, String parasutInvoiceId,
                               String parasutInvoiceStatus, String parasutEBelgeUrl) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(OrderMessages.ORDER_NOT_FOUND.get() + orderId));
        if (parasutContactId != null) order.setParasutContactId(parasutContactId);
        if (parasutInvoiceId != null) order.setParasutInvoiceId(parasutInvoiceId);
        if (parasutInvoiceStatus != null) {
            try {
                order.setParasutInvoiceStatus(Order.ParasutInvoiceStatus.valueOf(parasutInvoiceStatus));
            } catch (Exception ignored) {}
        }
        if (parasutEBelgeUrl != null) order.setParasutEBelgeUrl(parasutEBelgeUrl);
        orderRepository.save(order);
    }

    // ------------------------------------------------------------------ helpers

    private Order.PaymentMethod parsePaymentMethod(String s) {
        if (s == null) return Order.PaymentMethod.COD;
        try { return Order.PaymentMethod.valueOf(s); } catch (Exception e) { return Order.PaymentMethod.COD; }
    }

    private Order.InvoiceType parseInvoiceType(String s) {
        if (s == null || s.isBlank()) return null;
        try { return Order.InvoiceType.valueOf(s.toUpperCase()); } catch (Exception e) { return null; }
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

    private String buildItemsHtml(Order order) {
        if (order.getItems() == null || order.getItems().isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (OrderItem item : order.getItems()) {
            java.math.BigDecimal lineTotal = item.getUnitPrice()
                    .multiply(java.math.BigDecimal.valueOf(item.getQuantity()));
            sb.append("""
                    <tr>
                      <td style="padding:10px 16px;font-size:14px;color:#1a1a1a;border-top:1px solid #f1f5f9">%s</td>
                      <td style="padding:10px 16px;font-size:14px;color:#475569;text-align:center;border-top:1px solid #f1f5f9">%d</td>
                      <td style="padding:10px 16px;font-size:14px;color:#1a1a1a;text-align:right;border-top:1px solid #f1f5f9">₺%s</td>
                    </tr>
                    """.formatted(item.getProductName(), item.getQuantity(), lineTotal.toString()));
        }
        return sb.toString();
    }

    private String buildTelegramMessage(Order order, UserSummary user, OrderRequest req) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
        StringBuilder sb = new StringBuilder();
        sb.append("🛒 <b>Yeni Sipariş #").append(order.getId()).append("</b>\n");
        sb.append("👤 ").append(user.firstName()).append(" ").append(user.lastName() != null ? user.lastName() : "")
          .append(" (").append(user.email()).append(")\n");
        sb.append("📞 ").append(req.phone()).append("\n");
        sb.append("📍 ").append(req.city()).append(" / ").append(req.district()).append("\n");
        sb.append(req.address()).append("\n\n");
        sb.append("📦 <b>Ürünler:</b>\n");
        for (OrderItemRequest item : req.items()) {
            java.math.BigDecimal lineTotal = item.unitPrice()
                    .multiply(java.math.BigDecimal.valueOf(item.quantity()));
            sb.append("- ").append(item.productName())
              .append(" x").append(item.quantity())
              .append(" → ₺").append(lineTotal).append("\n");
        }
        sb.append("\n💰 <b>Toplam: ₺").append(req.totalAmount()).append("</b>\n");
        sb.append("💳 Ödeme: 💵 Teslimatta Öde\n");
        if (order.getCreatedAt() != null) {
            sb.append("🕐 ").append(order.getCreatedAt().format(fmt));
        }
        return sb.toString();
    }
}
