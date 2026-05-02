package com.petshop.saas.service;

import com.petshop.catalog.entity.Product;
import com.petshop.catalog.repository.ProductRepository;
import com.petshop.saas.dto.BulkImportResult;
import com.petshop.tenant.service.PlanLimitService;
import com.petshop.tenant.service.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

class SaasImportServiceTest {

    private ProductRepository repo;
    private PlanLimitService planLimit;
    private SaasImportService service;

    @BeforeEach
    void setUp() {
        repo = mock(ProductRepository.class);
        planLimit = mock(PlanLimitService.class);
        service = new SaasImportService(repo, planLimit, mock(com.petshop.audit.service.AuditLogger.class));
        TenantContext.set(1L, "PRO");
        when(repo.findBySku(any())).thenReturn(Optional.empty());
        when(repo.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));
    }

    @AfterEach
    void clear() { TenantContext.clear(); }

    private MockMultipartFile csv(String content) {
        return new MockMultipartFile("file", "products.csv", "text/csv", content.getBytes());
    }

    @Test
    void successful_import_creates_all_products() {
        var f = csv("""
                name,sku,price,stock
                Royal Canin Mama,RC-1,189.90,42
                Whiskas,WS-1,79.50,150
                """);
        BulkImportResult r = service.importProductsCsv(f);
        assertThat(r.totalRows()).isEqualTo(2);
        assertThat(r.createdCount()).isEqualTo(2);
        assertThat(r.skippedCount()).isZero();
        assertThat(r.errors()).isEmpty();
        verify(repo, times(2)).save(any(Product.class));
    }

    @Test
    void duplicate_sku_in_file_is_skipped() {
        var f = csv("""
                name,sku,price,stock
                Mama 1,SAME,10,5
                Mama 2,SAME,20,10
                """);
        BulkImportResult r = service.importProductsCsv(f);
        assertThat(r.createdCount()).isEqualTo(1);
        assertThat(r.skippedCount()).isEqualTo(1);
        assertThat(r.errors()).hasSize(1);
        assertThat(r.errors().get(0).reason()).contains("tekrar eden SKU");
    }

    @Test
    void existing_sku_in_db_is_skipped() {
        when(repo.findBySku("EXISTING")).thenReturn(Optional.of(new Product()));
        var f = csv("""
                name,sku,price,stock
                X,EXISTING,10,5
                """);
        BulkImportResult r = service.importProductsCsv(f);
        assertThat(r.createdCount()).isZero();
        assertThat(r.skippedCount()).isEqualTo(1);
        assertThat(r.errors().get(0).reason()).contains("zaten kayıtlı");
    }

    @Test
    void missing_required_columns_returns_error() {
        var f = csv("""
                ad,kod,fiyat
                X,Y,1
                """);
        BulkImportResult r = service.importProductsCsv(f);
        assertThat(r.createdCount()).isZero();
        assertThat(r.errors().get(0).reason()).contains("Başlık");
    }

    @Test
    void invalid_number_skipped_with_error() {
        var f = csv("""
                name,sku,price,stock
                X,X-1,not-a-number,5
                Y,Y-1,99,abc
                Z,Z-1,15,3
                """);
        BulkImportResult r = service.importProductsCsv(f);
        assertThat(r.createdCount()).isEqualTo(1); // sadece Z geçer
        assertThat(r.skippedCount()).isEqualTo(2);
    }

    @Test
    void plan_limit_exception_aborts_remaining_rows() {
        // İlk 2 satır geçer, 3.'de plan limit
        doNothing().doNothing().doThrow(new com.petshop.tenant.exception.PlanLimitExceededException("limit"))
                .when(planLimit).assertCanAddProduct(anyLong());
        var f = csv("""
                name,sku,price,stock
                A,A-1,10,5
                B,B-1,10,5
                C,C-1,10,5
                D,D-1,10,5
                """);
        BulkImportResult r = service.importProductsCsv(f);
        assertThat(r.createdCount()).isEqualTo(2);
        assertThat(r.skippedCount()).isGreaterThanOrEqualTo(1);
        assertThat(r.errors()).anyMatch(e -> e.reason().contains("Plan limiti"));
    }

    @Test
    void csv_with_quoted_commas_parsed_correctly() {
        var f = csv("""
                name,sku,price,stock
                "Mama, Premium, 5kg",PREM-5,250,20
                """);
        BulkImportResult r = service.importProductsCsv(f);
        assertThat(r.createdCount()).isEqualTo(1);
    }

    @Test
    void semicolon_separator_supported() {
        var f = csv("""
                name;sku;price;stock
                Mama;SC-1;10;5
                """);
        BulkImportResult r = service.importProductsCsv(f);
        assertThat(r.createdCount()).isEqualTo(1);
    }

    @Test
    void empty_file_returns_zero_with_error() {
        BulkImportResult r = service.importProductsCsv(new MockMultipartFile("file", new byte[0]));
        assertThat(r.totalRows()).isZero();
        assertThat(r.errors()).isNotEmpty();
    }

    // ─── updateProductsCsv ─────────────────────────────────────────────

    @Test
    void update_existing_product_modifies_fields() {
        Product existing = Product.builder()
                .id(99L).companyId(1L).name("Eski").sku("SKU-1")
                .basePrice(new java.math.BigDecimal("10.00"))
                .stockQuantity(5).reservedQuantity(0).build();
        when(repo.findBySku("SKU-1")).thenReturn(Optional.of(existing));

        var f = csv("""
                sku,name,price,stock
                SKU-1,Yeni,99.50,42
                """);
        BulkImportResult r = service.updateProductsCsv(f);
        assertThat(r.createdCount()).isEqualTo(1);
        assertThat(existing.getName()).isEqualTo("Yeni");
        assertThat(existing.getBasePrice().compareTo(new java.math.BigDecimal("99.5"))).isZero();
        assertThat(existing.getStockQuantity()).isEqualTo(42);
    }

    @Test
    void update_blank_fields_preserve_existing() {
        Product existing = Product.builder()
                .id(99L).companyId(1L).name("Eski").sku("SKU-1")
                .basePrice(new java.math.BigDecimal("10.00"))
                .stockQuantity(5).reservedQuantity(0).build();
        when(repo.findBySku("SKU-1")).thenReturn(Optional.of(existing));

        var f = csv("""
                sku,name,price,stock
                SKU-1,,,42
                """);
        service.updateProductsCsv(f);
        assertThat(existing.getName()).isEqualTo("Eski");
        assertThat(existing.getBasePrice().compareTo(new java.math.BigDecimal("10.00"))).isZero();
        assertThat(existing.getStockQuantity()).isEqualTo(42);
    }

    @Test
    void update_unknown_sku_skipped() {
        when(repo.findBySku("NOPE")).thenReturn(Optional.empty());
        var f = csv("""
                sku,price
                NOPE,10
                """);
        BulkImportResult r = service.updateProductsCsv(f);
        assertThat(r.createdCount()).isZero();
        assertThat(r.skippedCount()).isEqualTo(1);
        assertThat(r.errors().get(0).reason()).contains("bulunamadı");
    }

    @Test
    void update_cross_tenant_sku_skipped() {
        Product other = Product.builder().id(99L).companyId(999L).sku("OTHER")
                .basePrice(new java.math.BigDecimal("1")).stockQuantity(1).reservedQuantity(0).build();
        when(repo.findBySku("OTHER")).thenReturn(Optional.of(other));

        var f = csv("""
                sku,price
                OTHER,10
                """);
        BulkImportResult r = service.updateProductsCsv(f);
        assertThat(r.createdCount()).isZero();
        assertThat(r.skippedCount()).isEqualTo(1);
    }

    @Test
    void update_missing_sku_column_returns_error() {
        var f = csv("""
                name,price
                X,10
                """);
        BulkImportResult r = service.updateProductsCsv(f);
        assertThat(r.errors()).isNotEmpty();
        assertThat(r.errors().get(0).reason()).contains("SKU sütunu zorunlu");
    }

    @Test
    void update_negative_stock_skipped() {
        Product existing = Product.builder()
                .id(99L).companyId(1L).sku("SKU-1")
                .basePrice(new java.math.BigDecimal("10")).stockQuantity(5).reservedQuantity(0).build();
        when(repo.findBySku("SKU-1")).thenReturn(Optional.of(existing));

        var f = csv("""
                sku,stock
                SKU-1,-5
                """);
        BulkImportResult r = service.updateProductsCsv(f);
        assertThat(r.skippedCount()).isEqualTo(1);
        assertThat(existing.getStockQuantity()).isEqualTo(5);
    }
}
