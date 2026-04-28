package com.petshop.notification.service;

import com.petshop.catalog.api.CatalogFacade;
import com.petshop.catalog.api.ProductSummary;
import com.petshop.catalog.api.VariantSummary;
import com.petshop.catalog.api.events.StockRestoredEvent;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.notification.entity.StockNotification;
import com.petshop.notification.repository.StockNotificationRepository;
import com.petshop.siteadmin.api.SiteSettingsFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class StockNotificationService {

    private final StockNotificationRepository repo;
    private final CatalogFacade catalogFacade;
    private final NotificationOutboxService outbox;
    private final SiteSettingsFacade siteSettings;

    public boolean isSubscribed(Long productId, Long variantId, String email) {
        if (email == null || email.isBlank()) return false;
        return repo.findPending(productId, variantId, email.trim()).isPresent();
    }

    @Transactional
    public boolean subscribe(Long productId, Long variantId, String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("E-posta boş olamaz");
        }
        String normalized = email.trim();
        catalogFacade.findProduct(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Ürün bulunamadı", productId));
        if (variantId != null) {
            catalogFacade.findVariant(variantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Varyant bulunamadı", variantId));
        }
        if (repo.findPending(productId, variantId, normalized).isPresent()) {
            return false;
        }
        repo.save(StockNotification.builder()
                .productId(productId)
                .variantId(variantId)
                .email(normalized)
                .build());
        return true;
    }

    @EventListener
    public void onStockRestored(StockRestoredEvent ev) {
        if (ev.variantId() != null) notifyVariantRestocked(ev.variantId());
        else if (ev.productId() != null) notifyProductRestocked(ev.productId());
    }

    @Transactional
    public void notifyProductRestocked(Long productId) {
        List<StockNotification> pending = repo.findPendingByProduct(productId);
        if (pending.isEmpty()) return;
        ProductSummary p = catalogFacade.findProduct(productId).orElse(null);
        if (p == null) return;
        String url = buildProductUrl(p.slug());
        dispatch(pending, p.name(), null, url);
    }

    @Transactional
    public void notifyVariantRestocked(Long variantId) {
        List<StockNotification> pending = repo.findPendingByVariant(variantId);
        if (pending.isEmpty()) return;
        VariantSummary v = catalogFacade.findVariant(variantId).orElse(null);
        if (v == null || v.productId() == null) return;
        ProductSummary p = catalogFacade.findProduct(v.productId()).orElse(null);
        if (p == null) return;
        String url = buildProductUrl(p.slug());
        dispatch(pending, p.name(), v.label(), url);
    }

    private void dispatch(List<StockNotification> list, String productName, String variantLabel, String url) {
        for (StockNotification n : list) {
            try {
                outbox.enqueueStockNotification(n.getEmail(), productName, variantLabel, url);
                n.setNotifiedAt(LocalDateTime.now());
                repo.save(n);
            } catch (Exception e) {
                log.warn("Stok bildirim kuyruğa alınamadı: id={}, email={}, err={}", n.getId(), n.getEmail(), e.getMessage());
            }
        }
    }

    private String buildProductUrl(String slug) {
        String appDomain = siteSettings.getAppDomain();
        String base = appDomain != null && !appDomain.isBlank()
                ? (appDomain.startsWith("http") ? appDomain : "https://" + appDomain)
                : "";
        return base + "/urun/" + slug;
    }
}
