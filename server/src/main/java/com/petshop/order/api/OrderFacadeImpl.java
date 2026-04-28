package com.petshop.order.api;

import com.petshop.order.entity.Order;
import com.petshop.order.entity.OrderItem;
import com.petshop.order.repository.OrderRepository;
import com.petshop.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
class OrderFacadeImpl implements OrderFacade {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Override
    @Transactional(readOnly = true)
    public Optional<OrderView> findOrder(Long orderId) {
        if (orderId == null) return Optional.empty();
        return orderRepository.findById(orderId).map(OrderFacadeImpl::toView);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean userPurchasedProduct(Long userId, Long productId) {
        if (userId == null || productId == null) return false;
        return !orderRepository.findOrderIdsByUserProductStatus(
                userId, productId, Order.OrderStatus.DELIVERED).isEmpty();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Long> findDeliveredOrderIdContaining(Long userId, Long productId) {
        if (userId == null || productId == null) return Optional.empty();
        List<Long> ids = orderRepository.findOrderIdsByUserProductStatus(
                userId, productId, Order.OrderStatus.DELIVERED);
        return ids.isEmpty() ? Optional.empty() : Optional.of(ids.get(0));
    }

    @Override
    public Long createPendingOrder(CreateOrderCommand cmd) {
        return orderService.createPending(cmd);
    }

    @Override
    public void markPaid(Long orderId, String iyzicoPaymentId) {
        orderService.markPaid(orderId, iyzicoPaymentId);
    }

    @Override
    public void markFailed(Long orderId) {
        orderService.markFailed(orderId);
    }

    @Override
    public void markRefunded(Long orderId, String reason) {
        orderService.markRefunded(orderId, reason);
    }

    @Override
    public void setIyzicoToken(Long orderId, String token) {
        orderService.setIyzicoToken(orderId, token);
    }

    @Override
    public void updateInvoiceMetadata(Long orderId, String parasutContactId, String parasutInvoiceId,
                                       String parasutInvoiceStatus, String parasutEBelgeUrl) {
        orderService.updateInvoiceMetadata(orderId, parasutContactId, parasutInvoiceId,
                parasutInvoiceStatus, parasutEBelgeUrl);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Long> findOrderIdByIyzicoToken(String token) {
        if (token == null) return Optional.empty();
        return orderRepository.findByIyzicoToken(token).map(Order::getId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Long> findBestSellerProductIds(int limit) {
        if (limit <= 0) return List.of();
        var statuses = List.of(
                Order.OrderStatus.PAID,
                Order.OrderStatus.PROCESSING,
                Order.OrderStatus.SHIPPED,
                Order.OrderStatus.DELIVERED);
        var rows = orderRepository.findBestSellerProductIdsByStatuses(
                statuses, org.springframework.data.domain.PageRequest.of(0, limit));
        return rows.stream().map(r -> (Long) r[0]).toList();
    }

    static OrderView toView(Order o) {
        List<OrderItemView> items = o.getItems() == null ? List.of() :
                o.getItems().stream().map(OrderFacadeImpl::toItemView).toList();
        return new OrderView(
                o.getId(),
                o.getOrderNumber(),
                o.getUserId(),
                o.getGuestEmail(),
                o.getGuestName(),
                o.getGuestPhone(),
                o.getStatus() != null ? o.getStatus().name() : null,
                o.getPaymentMethod() != null ? o.getPaymentMethod().name() : null,
                o.getSubtotal(),
                o.getDiscountAmount(),
                o.getTotal(),
                o.getShippingAddress(),
                o.getShippingCity(),
                o.getShippingDistrict(),
                o.getShippingPostalCode(),
                o.getInvoiceType() != null ? o.getInvoiceType().name() : null,
                o.getInvoiceIdentityNo(),
                o.getInvoiceTitle(),
                o.getInvoiceTaxOffice(),
                o.getInvoiceAddress(),
                o.getInvoiceCity(),
                o.getInvoiceDistrict(),
                o.getParasutContactId(),
                o.getParasutInvoiceId(),
                o.getParasutInvoiceStatus() != null ? o.getParasutInvoiceStatus().name() : null,
                o.getParasutEBelgeUrl(),
                o.getIyzicoPaymentId(),
                o.getRefundedAt(),
                o.getRefundReason(),
                o.getCreatedAt(),
                items
        );
    }

    static OrderItemView toItemView(OrderItem i) {
        return new OrderItemView(
                i.getId(),
                i.getProductId(),
                i.getVariantId(),
                i.getProductName(),
                i.getProductSku(),
                i.getVariantLabel(),
                i.getQuantity() != null ? i.getQuantity() : 0,
                i.getUnitPrice(),
                i.getLineTotal()
        );
    }
}
