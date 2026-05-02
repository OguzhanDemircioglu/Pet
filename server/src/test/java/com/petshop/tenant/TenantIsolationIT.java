package com.petshop.tenant;

import com.petshop.catalog.entity.Product;
import com.petshop.catalog.repository.ProductRepository;
import com.petshop.tenant.entity.Company;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.repository.CompanyRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.PageRequest;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end tenant izolasyon testi.
 * Docker gerektirir. Yerel Docker yoksa @EnabledIfSystemProperty ile devre dışı kalır.
 * Çalıştırmak için: mvn test -Dtest=TenantIsolationIT -DdockerAvailable=true
 */
@Testcontainers
@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
@EnabledIfSystemProperty(named = "dockerAvailable", matches = "true")
class TenantIsolationIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withInitScript("test-schema.sql");

    @Autowired CompanyRepository companyRepo;
    @Autowired ProductRepository productRepo;

    @Test
    void cross_tenant_findById_returns_empty() {
        Company a = companyRepo.save(Company.builder().name("A").slug("a").plan(Plan.PRO).isActive(true).build());
        Company b = companyRepo.save(Company.builder().name("B").slug("b").plan(Plan.PRO).isActive(true).build());

        Product pa = productRepo.save(Product.builder()
                .companyId(a.getId()).name("PA").slug("pa").sku("PA-1")
                .basePrice(BigDecimal.TEN).stockQuantity(10).reservedQuantity(0)
                .isActive(true).isFeatured(false).unit("adet").build());

        // B's tenant cannot see A's product
        Optional<Product> byB = productRepo.findByIdAndCompanyId(pa.getId(), b.getId());
        assertThat(byB).isEmpty();

        // A's tenant can
        Optional<Product> byA = productRepo.findByIdAndCompanyId(pa.getId(), a.getId());
        assertThat(byA).isPresent();
    }

    @Test
    void list_only_returns_own_company_products() {
        Company a = companyRepo.save(Company.builder().name("A2").slug("a2").plan(Plan.PRO).isActive(true).build());
        Company b = companyRepo.save(Company.builder().name("B2").slug("b2").plan(Plan.PRO).isActive(true).build());

        productRepo.save(Product.builder().companyId(a.getId()).name("A1").slug("a1").sku("A-1")
                .basePrice(BigDecimal.ONE).stockQuantity(1).reservedQuantity(0)
                .isActive(true).isFeatured(false).unit("adet").build());
        productRepo.save(Product.builder().companyId(b.getId()).name("B1").slug("b1").sku("B-1")
                .basePrice(BigDecimal.ONE).stockQuantity(1).reservedQuantity(0)
                .isActive(true).isFeatured(false).unit("adet").build());

        var aList = productRepo.findByCompanyId(a.getId(), PageRequest.of(0, 10));
        var bList = productRepo.findByCompanyId(b.getId(), PageRequest.of(0, 10));

        assertThat(aList.getContent()).hasSize(1);
        assertThat(aList.getContent().get(0).getSku()).isEqualTo("A-1");
        assertThat(bList.getContent()).hasSize(1);
        assertThat(bList.getContent().get(0).getSku()).isEqualTo("B-1");
    }
}
