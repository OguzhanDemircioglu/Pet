package com.petshop.order.api;

import java.util.Optional;

/**
 * Public API of the order module.
 */
public interface OrderFacade {

    Optional<OrderView> findOrder(Long orderId);

    /**
     * Whether the given user has a delivered order containing the given product.
     * Used by the catalog (review eligibility) module.
     */
    boolean userPurchasedProduct(Long userId, Long productId);

    /**
     * Find a delivered order id where {@code userId} bought {@code productId}.
     * Used to attach a productReview to a specific order.
     */
    Optional<Long> findDeliveredOrderIdContaining(Long userId, Long productId);

    // ─── Mutators (used by payment / invoice modules) ─────────────────────

    Long createPendingOrder(CreateOrderCommand cmd);

    void markPaid(Long orderId, String iyzicoPaymentId);

    void markFailed(Long orderId);

    void markRefunded(Long orderId, String reason);

    void setIyzicoToken(Long orderId, String token);

    void updateInvoiceMetadata(Long orderId, String parasutContactId, String parasutInvoiceId,
                                String parasutInvoiceStatus, String parasutEBelgeUrl);

    Optional<Long> findOrderIdByIyzicoToken(String token);

    /**
     * En çok satan ürün ID'lerini döndürür (PAID/PROCESSING/SHIPPED/DELIVERED siparişler
     * üzerinden, satış adedi desc). Catalog modülü best-seller listesi için kullanır.
     */
    java.util.List<Long> findBestSellerProductIds(int limit);
}
