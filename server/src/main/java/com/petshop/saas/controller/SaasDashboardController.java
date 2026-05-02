package com.petshop.saas.controller;

import com.petshop.catalog.repository.ProductRepository;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.order.repository.OrderRepository;
import com.petshop.saas.dto.DashboardStats;
import com.petshop.saas.dto.ProductDto;
import com.petshop.saas.dto.SaleDto;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.service.PlanLimitService;
import com.petshop.tenant.service.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/saas/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SaasDashboardController {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PlanLimitService planLimitService;

    private static final int LOW_STOCK_THRESHOLD = 5;

    @GetMapping
    public ResponseEntity<DataGenericResponse<DashboardStats>> stats() {
        Long cid = TenantContext.require();
        Plan plan = planLimitService.getPlan(cid);

        long productCount = productRepository.countByCompanyId(cid);
        long salesCount = orderRepository.countByCompanyId(cid);

        List<ProductDto> lowStock = productRepository
                .findLowStockByCompany(cid, LOW_STOCK_THRESHOLD, PageRequest.of(0, 5))
                .stream().map(ProductDto::from).toList();

        List<SaleDto> recent = orderRepository
                .findTop10ByCompanyIdOrderByCreatedAtDesc(cid)
                .stream().map(SaleDto::from).toList();

        int limit = plan == Plan.FREE ? PlanLimitService.FREE_PRODUCT_LIMIT : -1;

        return ResponseEntity.ok(DataGenericResponse.of(
                new DashboardStats(productCount, salesCount, limit, plan.name(), lowStock, recent)));
    }
}
