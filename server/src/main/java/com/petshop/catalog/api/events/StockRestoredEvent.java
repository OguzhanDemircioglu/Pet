package com.petshop.catalog.api.events;

/**
 * Published by the catalog module when stock for a product (or specific variant)
 * has been restored — e.g. on order cancellation, refund, or admin restock.
 *
 * Other modules (notably notification, for "back in stock" subscriber emails)
 * may listen via Spring's {@code @EventListener} or Modulith's {@code @ApplicationModuleListener}.
 */
public record StockRestoredEvent(Long productId, Long variantId) {}
