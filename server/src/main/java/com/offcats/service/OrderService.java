package com.offcats.service;

import com.offcats.dto.request.OrderItemRequest;
import com.offcats.dto.request.OrderRequest;
import com.offcats.dto.response.OrderResponse;
import com.offcats.entity.Order;
import com.offcats.entity.OrderItem;
import com.offcats.entity.Product;
import com.offcats.entity.User;
import com.offcats.exception.ResourceNotFoundException;
import com.offcats.repository.OrderRepository;
import com.offcats.repository.ProductRepository;
import com.offcats.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final TelegramService telegramService;

    @Transactional
    public OrderResponse createOrder(Long userId, OrderRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı: " + userId));

        // Sipariş numarası üret
        String orderNumber = generateOrderNumber();

        // OrderItem listesi oluştur
        List<OrderItem> orderItems = new ArrayList<>();
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(user)
                .status(Order.OrderStatus.PENDING)
                .guestName(req.fullName())
                .guestPhone(req.phone())
                .shippingCity(req.city())
                .shippingDistrict(req.district())
                .shippingAddress(req.address())
                .total(req.totalAmount())
                .subtotal(req.totalAmount())
                .discountAmount(java.math.BigDecimal.ZERO)
                .vatAmount(java.math.BigDecimal.ZERO)
                .items(orderItems)
                .build();

        // Items'ları dönüştür ve order'a bağla
        for (OrderItemRequest itemReq : req.items()) {
            // Ürünü bul (referans için), bulunamazsa sadece id ile devam et
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
                    .vatRate(java.math.BigDecimal.ZERO)
                    .lineTotal(itemReq.unitPrice().multiply(java.math.BigDecimal.valueOf(itemReq.quantity())))
                    .build();
            orderItems.add(item);
        }

        Order savedOrder = orderRepository.save(order);
        log.info("Sipariş oluşturuldu: #{} — kullanıcı: {}", orderNumber, userId);

        // Bildirim kaydet
        try {
            String notifMessage = "Siparişiniz #" + savedOrder.getId()
                    + " alındı. En kısa sürede sizinle iletişime geçeceğiz.";
            notificationService.createNotification(user, notifMessage, "ORDER");
        } catch (Exception e) {
            log.error("Bildirim kaydedilemedi (sipariş etkilenmedi): {}", e.getMessage());
        }

        // Email gönder
        try {
            String itemsHtml = buildItemsHtml(savedOrder);
            String deliveryAddress = req.city() + " / " + req.district() + "\n" + req.address();
            emailService.sendOrderConfirmation(
                    user.getEmail(),
                    user.getFirstName() != null ? user.getFirstName() : req.fullName(),
                    savedOrder.getId(),
                    itemsHtml,
                    deliveryAddress,
                    req.totalAmount().toString()
            );
        } catch (Exception e) {
            log.error("Sipariş emaili gönderilemedi (sipariş etkilenmedi): {}", e.getMessage());
        }

        // Telegram bildir
        try {
            String telegramMsg = buildTelegramMessage(savedOrder, user, req);
            telegramService.sendMessage(telegramMsg);
        } catch (Exception e) {
            log.error("Telegram bildirimi gönderilemedi (sipariş etkilenmedi): {}", e.getMessage());
        }

        return OrderResponse.from(savedOrder);
    }

    public List<OrderResponse> getUserOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(OrderResponse::from)
                .collect(Collectors.toList());
    }

    // ------------------------------------------------------------------ helpers

    private String generateOrderNumber() {
        return orderRepository.findLastOrderNumber()
                .map(last -> {
                    try {
                        long num = Long.parseLong(last.substring(2));
                        return "PT" + String.format("%08d", num + 1);
                    } catch (Exception e) {
                        return "PT" + String.format("%08d", System.currentTimeMillis() % 100_000_000L);
                    }
                })
                .orElse("PT" + String.format("%08d", 1L));
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

    private String buildTelegramMessage(Order order, User user, OrderRequest req) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
        StringBuilder sb = new StringBuilder();
        sb.append("🛒 <b>Yeni Sipariş #").append(order.getId()).append("</b>\n");
        sb.append("👤 ").append(user.getFirstName()).append(" ").append(user.getLastName())
          .append(" (").append(user.getEmail()).append(")\n");
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
        if (order.getCreatedAt() != null) {
            sb.append("🕐 ").append(order.getCreatedAt().format(fmt));
        }
        return sb.toString();
    }
}
