package com.petshop.saas.controller;

import com.petshop.catalog.repository.ProductRepository;
import com.petshop.dto.response.DataGenericResponse;
import com.petshop.exception.ResourceNotFoundException;
import com.petshop.saas.dto.ProductDto;
import com.petshop.saas.dto.PublicShopDto;
import com.petshop.tenant.entity.Company;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Faz 5 — PRO+ planı public mini vitrin.
 * Auth gerektirmez. Sadece PRO_PLUS şirketler görünür.
 */
@RestController
@RequestMapping("/public/shop")
@RequiredArgsConstructor
public class PublicShopController {

    private final CompanyRepository companyRepository;
    private final ProductRepository productRepository;

    @GetMapping("/{slug}")
    public ResponseEntity<DataGenericResponse<PublicShopDto>> get(@PathVariable String slug) {
        Company c = companyRepository.findBySlug(slug)
                .filter(co -> Boolean.TRUE.equals(co.getIsActive()))
                .filter(co -> co.getPlan() == Plan.PRO_PLUS)
                .orElseThrow(() -> new ResourceNotFoundException("Vitrin bulunamadı"));

        List<ProductDto> products = productRepository
                .findByCompanyId(c.getId(), PageRequest.of(0, 100))
                .stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .map(ProductDto::from)
                .toList();

        return ResponseEntity.ok(DataGenericResponse.of(
                new PublicShopDto(c.getName(), c.getSlug(), products)));
    }
}
