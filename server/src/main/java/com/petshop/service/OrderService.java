package com.petshop.service;

import com.petshop.dto.request.OrderItemRequest;
import com.petshop.dto.request.OrderRequest;
import com.petshop.dto.response.OrderResponse;
import com.petshop.entity.Order;
import com.petshop.entity.OrderItem;
import com.petshop.entity.Product;
import com.petshop.entity.User;
import com.petshop.constant.OrderMessages;
import com.petshop.constant.ProductMessages;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.entity.ProductVariant;
import com.petshop.repository.OrderRepository;
import com.petshop.repository.ProductRepository;
import com.petshop.repository.ProductVariantRepository;
import com.petshop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Sort;

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
    private final ProductVariantRepository productVariantRepository;
    private final NotificationService notificationService;
    private final NotificationOutboxService notificationOutboxService;
    private final TelegramOutboxService telegramOutboxService;

    @Transactional
    public OrderResponse createOrder(Long userId, OrderRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(OrderMessages.USER_NOT_FOUND.get() + userId));

        // Sipariş kaydedilmeden önce stok kontrolü
        for (OrderItemRequest itemReq : req.items()) {
            if (itemReq.productId() == null) continue;
            if (itemReq.variantId() != null) {
                ProductVariant v = productVariantRepository.findById(itemReq.variantId()).orElse(null);
                if (v != null && v.getAvailableStock() < itemReq.quantity()) {
                    throw new com.petshop.exception.BusinessException(
                            ProductMessages.INSUFFICIENT_STOCK.format(
                                    itemReq.productName() + " (" + v.getLabel() + ")",
                                    v.getAvailableStock(), itemReq.quantity()));
                }
            } else {
                Product p = productRepository.findById(itemReq.productId()).orElse(null);
                if (p == null) continue;
                if (p.getStockQuantity() < itemReq.quantity()) {
                    throw new com.petshop.exception.BusinessException(
                            ProductMessages.INSUFFICIENT_STOCK.format(
                                    itemReq.productName(), p.getStockQuantity(), itemReq.quantity()));
                }
            }
        }

        // Sipariş numarası üret
        String orderNumber = generateOrderNumber();

        // OrderItem listesi oluştur
        List<OrderItem> orderItems = new ArrayList<>();
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(user)
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

        // Items'ları dönüştür ve order'a bağla
        for (OrderItemRequest itemReq : req.items()) {
            Product product = null;
            if (itemReq.productId() != null) {
                product = productRepository.findById(itemReq.productId()).orElse(null);
            }

            ProductVariant variant = null;
            String variantLabel = null;
            if (itemReq.variantId() != null) {
                variant = productVariantRepository.findById(itemReq.variantId()).orElse(null);
                if (variant != null) variantLabel = variant.getLabel();
            }

            OrderItem item = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .productName(itemReq.productName())
                    .productSku(product != null && product.getSku() != null ? product.getSku() : "")
                    .variant(variant)
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
            if (itemReq.variantId() != null) {
                ProductVariant v = productVariantRepository.findById(itemReq.variantId()).orElse(null);
                if (v == null) continue;
                v.setStockQuantity(v.getStockQuantity() - itemReq.quantity());
                productVariantRepository.save(v);
                log.info("Varyant stok düşüldü: varyant #{} ({}) → {} adet, kalan: {}",
                        v.getId(), v.getLabel(), itemReq.quantity(), v.getStockQuantity());
            } else if (itemReq.productId() != null) {
                Product p = productRepository.findById(itemReq.productId()).orElse(null);
                if (p == null) continue;
                p.setStockQuantity(p.getStockQuantity() - itemReq.quantity());
                productRepository.save(p);
                log.info("Stok düşüldü: ürün #{} ({}) → {} adet, kalan: {}",
                        p.getId(), p.getName(), itemReq.quantity(), p.getStockQuantity());
            }
        }

        // Admin bildirimi gönder
        try {
            notificationService.createAdminNotificationsForOrder(savedOrder);
        } catch (Exception e) {
            log.error("Admin bildirimi gönderilemedi: {}", e.getMessage());
        }

        // Bildirim kaydet
        try {
            String notifMessage = OrderMessages.ORDER_NOTIFICATION_TEMPLATE.format(savedOrder.getId());
            notificationService.createNotification(user, notifMessage, OrderMessages.NOTIFICATION_TYPE_ORDER.get());
        } catch (Exception e) {
            log.error(OrderMessages.LOG_NOTIF_FAIL.get(), e.getMessage());
        }

        // Email kuyruğa al
        try {
            String itemsHtml = buildItemsHtml(savedOrder);
            String deliveryAddress = req.city() + " / " + req.district() + "\n" + req.address();
            notificationOutboxService.enqueueOrderConfirmation(
                    user.getEmail(),
                    user.getFirstName() != null ? user.getFirstName() : req.fullName(),
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
            telegramOutboxService.enqueue(telegramMsg);
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
        // Stok sipariş oluşturulduğunda zaten düşüldü — sadece durum güncelle
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
            if (item.getVariant() != null) {
                ProductVariant v = productVariantRepository.findById(item.getVariant().getId()).orElse(null);
                if (v == null) continue;
                v.setStockQuantity(v.getStockQuantity() + item.getQuantity());
                productVariantRepository.save(v);
                log.info("Varyant stok iade edildi: varyant #{} ({}) → {} adet, yeni: {}",
                        v.getId(), v.getLabel(), item.getQuantity(), v.getStockQuantity());
            } else if (item.getProduct() != null) {
                Product p = productRepository.findById(item.getProduct().getId()).orElse(null);
                if (p == null) continue;
                p.setStockQuantity(p.getStockQuantity() + item.getQuantity());
                productRepository.save(p);
                log.info("Stok iade edildi: ürün #{} ({}) → {} adet geri eklendi, yeni: {}",
                        p.getId(), p.getName(), item.getQuantity(), p.getStockQuantity());
            }
        }
        order.setStatus(Order.OrderStatus.CANCELLED);
        return OrderResponse.from(orderRepository.save(order));
    }

    // ------------------------------------------------------------------ helpers

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
        sb.append("💳 Ödeme: 💵 Teslimatta Öde\n");
        if (order.getCreatedAt() != null) {
            sb.append("🕐 ").append(order.getCreatedAt().format(fmt));
        }
        return sb.toString();
    }
}
