package com.petshop.saas.service;

import com.petshop.catalog.entity.Product;
import com.petshop.catalog.repository.ProductRepository;
import com.petshop.exception.BusinessException;
import com.petshop.saas.dto.CreateProductRequest;
import com.petshop.saas.dto.ProductDto;
import com.petshop.saas.dto.UpdateProductRequest;
import com.petshop.tenant.exception.CrossTenantAccessException;
import com.petshop.tenant.service.PlanLimitService;
import com.petshop.tenant.service.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SaasProductService {

    private final ProductRepository productRepository;
    private final PlanLimitService planLimitService;

    @Transactional(readOnly = true)
    public Page<ProductDto> list(int page, int size) {
        Long cid = TenantContext.require();
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by("createdAt").descending());
        return productRepository.findByCompanyId(cid, pageable).map(ProductDto::from);
    }

    @Transactional(readOnly = true)
    public ProductDto getById(Long id) {
        Long cid = TenantContext.require();
        Product p = productRepository.findByIdAndCompanyId(id, cid)
                .orElseThrow(() -> new CrossTenantAccessException("Product " + id + " bulunamadı (company=" + cid + ")"));
        return ProductDto.from(p);
    }

    @Transactional
    public ProductDto create(CreateProductRequest req) {
        Long cid = TenantContext.require();
        planLimitService.assertCanAddProduct(cid);

        if (productRepository.findBySku(req.sku()).isPresent()) {
            throw new BusinessException("Bu SKU zaten kullanılıyor: " + req.sku());
        }

        Product p = Product.builder()
                .companyId(cid)
                .name(req.name())
                .slug(slugify(req.name()) + "-" + System.currentTimeMillis())
                .sku(req.sku())
                .basePrice(req.price())
                .stockQuantity(req.stock())
                .reservedQuantity(0)
                .unit("adet")
                .isActive(true)
                .isFeatured(false)
                .build();
        return ProductDto.from(productRepository.save(p));
    }

    @Transactional
    public ProductDto update(Long id, UpdateProductRequest req) {
        Long cid = TenantContext.require();
        Product p = productRepository.findByIdAndCompanyId(id, cid)
                .orElseThrow(() -> new CrossTenantAccessException("Product " + id));
        p.setName(req.name());
        p.setBasePrice(req.price());
        p.setStockQuantity(req.stock());
        if (req.active() != null) p.setIsActive(req.active());
        return ProductDto.from(productRepository.save(p));
    }

    @Transactional
    public void delete(Long id) {
        Long cid = TenantContext.require();
        Product p = productRepository.findByIdAndCompanyId(id, cid)
                .orElseThrow(() -> new CrossTenantAccessException("Product " + id));
        productRepository.delete(p);
    }

    private String slugify(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase(Locale.ROOT);
        n = n.replaceAll("[^a-z0-9\\s-]", "").trim().replaceAll("\\s+", "-").replaceAll("-+", "-");
        return n.length() > 80 ? n.substring(0, 80) : n;
    }
}
