package com.petshop.saas.service;

import com.petshop.catalog.entity.Product;
import com.petshop.catalog.repository.ProductRepository;
import com.petshop.exception.BusinessException;
import com.petshop.order.entity.Order;
import com.petshop.order.entity.OrderItem;
import com.petshop.order.repository.OrderRepository;
import com.petshop.saas.dto.CreateSaleRequest;
import com.petshop.saas.dto.SaleDto;
import com.petshop.tenant.exception.CrossTenantAccessException;
import com.petshop.tenant.service.PlanLimitService;
import com.petshop.tenant.service.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class SaasSalesService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final PlanLimitService planLimitService;
    private final com.petshop.audit.service.AuditLogger auditLogger;

    @Transactional
    public SaleDto create(CreateSaleRequest req) {
        Long cid = TenantContext.require();

        Order order = Order.builder()
                .companyId(cid)
                .orderNumber(generateOrderNumber())
                .guestName(req.customerName())
                .notes(req.notes())
                .status(Order.OrderStatus.PAID)
                .paymentMethod(Order.PaymentMethod.COD)
                .subtotal(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (CreateSaleRequest.Item line : req.items()) {
            Product p = productRepository.findByIdAndCompanyId(line.productId(), cid)
                    .orElseThrow(() -> new CrossTenantAccessException("Product " + line.productId()));

            int available = p.getStockQuantity() - p.getReservedQuantity();
            if (available < line.quantity()) {
                throw new BusinessException("Stok yetersiz: " + p.getName() + " (mevcut: " + available + ")");
            }
            p.setStockQuantity(p.getStockQuantity() - line.quantity());
            productRepository.save(p);

            BigDecimal lineTotal = p.getBasePrice().multiply(BigDecimal.valueOf(line.quantity()));
            total = total.add(lineTotal);

            OrderItem oi = OrderItem.builder()
                    .order(order)
                    .productId(p.getId())
                    .productName(p.getName())
                    .productSku(p.getSku())
                    .quantity(line.quantity())
                    .unitPrice(p.getBasePrice())
                    .lineTotal(lineTotal)
                    .build();
            order.getItems().add(oi);
        }

        order.setSubtotal(total);
        order.setTotal(total);
        Order saved = orderRepository.save(order);
        auditLogger.log("SALE_CREATE", "order", saved.getId(),
                "no=" + saved.getOrderNumber() + " items=" + saved.getItems().size() + " total=" + saved.getTotal());
        return SaleDto.from(saved);
    }

    @Transactional(readOnly = true)
    public Page<SaleDto> list(int page, int size) {
        return search(page, size, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<SaleDto> search(int page, int size,
                                java.time.LocalDate from, java.time.LocalDate to, String q) {
        Long cid = TenantContext.require();
        planLimitService.assertFeatureSalesHistory(cid);
        java.time.LocalDateTime fromDt = from != null
                ? from.atStartOfDay()
                : java.time.LocalDateTime.of(1970, 1, 1, 0, 0);
        java.time.LocalDateTime toDt = to != null
                ? to.plusDays(1).atStartOfDay()
                : java.time.LocalDateTime.of(9999, 12, 31, 0, 0);
        String qNorm = (q == null || q.isBlank()) ? "" : q.trim();
        return orderRepository
                .searchByCompany(cid, fromDt, toDt, qNorm, PageRequest.of(page, Math.min(size, 100)))
                .map(SaleDto::from);
    }

    @Transactional(readOnly = true)
    public List<SaleDto> recent() {
        Long cid = TenantContext.require();
        return orderRepository.findTop10ByCompanyIdOrderByCreatedAtDesc(cid)
                .stream().map(SaleDto::from).toList();
    }

    @Transactional(readOnly = true)
    public SaleDto getById(Long id) {
        Long cid = TenantContext.require();
        Order o = orderRepository.findByIdAndCompanyId(id, cid)
                .orElseThrow(() -> new CrossTenantAccessException("Order " + id));
        return SaleDto.from(o);
    }

    private String generateOrderNumber() {
        String prefix = "PT" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMddHHmmss"));
        return prefix + ThreadLocalRandom.current().nextInt(100, 1000);
    }
}
