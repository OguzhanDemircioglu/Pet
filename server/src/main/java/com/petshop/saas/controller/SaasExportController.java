package com.petshop.saas.controller;

import com.petshop.catalog.repository.ProductRepository;
import com.petshop.order.repository.OrderRepository;
import com.petshop.saas.dto.ProductDto;
import com.petshop.saas.dto.SaleDto;
import com.petshop.tenant.entity.Company;
import com.petshop.tenant.service.CompanyService;
import com.petshop.tenant.service.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Tenant verisi JSON yedek/export endpoint'i.
 * Tüm ürünler + son 1000 satış. Audit log dahil değil (ayrı endpoint zaten var).
 */
@RestController
@RequestMapping("/admin/saas/export")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SaasExportController {

    private final CompanyService companyService;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final com.petshop.audit.service.AuditLogger auditLogger;

    @GetMapping
    public ResponseEntity<Map<String, Object>> exportAll() {
        Long cid = TenantContext.require();
        Company c = companyService.getById(cid);

        List<ProductDto> products = productRepository
                .findByCompanyId(cid, PageRequest.of(0, 10_000))
                .map(ProductDto::from)
                .getContent();

        List<SaleDto> orders = orderRepository
                .findByCompanyIdOrderByCreatedAtDesc(cid, PageRequest.of(0, 1000))
                .map(SaleDto::from)
                .getContent();

        auditLogger.log("DATA_EXPORT", "company", cid,
                "products=" + products.size() + " orders=" + orders.size());

        Map<String, Object> body = Map.of(
                "exportedAt", LocalDateTime.now().toString(),
                "company", Map.of(
                        "id", c.getId(),
                        "name", c.getName(),
                        "slug", c.getSlug(),
                        "plan", c.getPlan().name()
                ),
                "products", products,
                "orders", orders
        );

        String filename = "pettoptan-export-" + c.getSlug() + "-"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"))
                + ".json";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(body);
    }
}
