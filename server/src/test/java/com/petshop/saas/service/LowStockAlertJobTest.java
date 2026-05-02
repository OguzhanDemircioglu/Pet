package com.petshop.saas.service;

import com.petshop.auth.entity.User;
import com.petshop.auth.repository.UserRepository;
import com.petshop.catalog.entity.Product;
import com.petshop.catalog.repository.ProductRepository;
import com.petshop.notification.api.NotificationFacade;
import com.petshop.tenant.entity.Company;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.repository.CompanyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class LowStockAlertJobTest {

    private CompanyRepository companyRepo;
    private ProductRepository productRepo;
    private UserRepository userRepo;
    private NotificationFacade notification;
    private LowStockAlertJob job;

    @BeforeEach
    void init() {
        companyRepo = mock(CompanyRepository.class);
        productRepo = mock(ProductRepository.class);
        userRepo = mock(UserRepository.class);
        notification = mock(NotificationFacade.class);
        job = new LowStockAlertJob(companyRepo, productRepo, userRepo, notification);
        ReflectionTestUtils.setField(job, "frontendUrl", "http://localhost:3000");
    }

    private static Company company(Long id, Plan plan, boolean alertEnabled, String email) {
        return Company.builder()
                .id(id).slug("c" + id).name("Co" + id).plan(plan)
                .isActive(true).lowStockThreshold(5)
                .lowStockAlertEnabled(alertEnabled)
                .notificationEmail(email).build();
    }

    private static Product product(Long id, Long cid, String name, int stock) {
        return Product.builder().id(id).companyId(cid).name(name).sku("SKU-" + id)
                .basePrice(BigDecimal.ONE).stockQuantity(stock).reservedQuantity(0)
                .isActive(true).isFeatured(false).build();
    }

    @Test
    void free_plan_skipped() {
        Company c = company(1L, Plan.FREE, true, "a@b.com");
        when(companyRepo.findAll()).thenReturn(List.of(c));
        job.runDailyAlerts();
        verify(productRepo, never()).findLowStockByCompany(anyLong(), anyInt(), any());
        verify(notification, never()).enqueueSaasNotification(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void disabled_alert_skipped() {
        Company c = company(1L, Plan.PRO, false, "a@b.com");
        when(companyRepo.findAll()).thenReturn(List.of(c));
        job.runDailyAlerts();
        verify(notification, never()).enqueueSaasNotification(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void empty_low_stock_skipped() {
        Company c = company(1L, Plan.PRO, true, "a@b.com");
        when(companyRepo.findAll()).thenReturn(List.of(c));
        when(productRepo.findLowStockByCompany(eq(1L), eq(5), any())).thenReturn(List.of());
        job.runDailyAlerts();
        verify(notification, never()).enqueueSaasNotification(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void low_stock_sends_email_with_explicit_address() {
        Company c = company(1L, Plan.PRO, true, "ops@x.com");
        when(companyRepo.findAll()).thenReturn(List.of(c));
        when(productRepo.findLowStockByCompany(eq(1L), eq(5), any()))
                .thenReturn(List.of(product(10L, 1L, "Mama", 3), product(11L, 1L, "Mama 2", 1)));

        job.runDailyAlerts();

        verify(notification).enqueueSaasNotification(
                eq("ops@x.com"),
                contains("Düşük Stok"),
                eq("Düşük Stoklu Ürünler"),
                contains("2 ürün"),
                contains("Mama"),
                eq("Ürünleri Görüntüle"),
                eq("http://localhost:3000/urunler"));
    }

    @Test
    void low_stock_falls_back_to_first_admin_email_when_company_email_missing() {
        Company c = company(1L, Plan.PRO, true, null);
        when(companyRepo.findAll()).thenReturn(List.of(c));
        when(productRepo.findLowStockByCompany(eq(1L), anyInt(), any()))
                .thenReturn(List.of(product(10L, 1L, "X", 1)));
        User admin = User.builder().id(1L).email("admin@x.com").role(User.Role.ADMIN).isActive(true).build();
        when(userRepo.findByCompanyIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(admin));

        job.runDailyAlerts();

        verify(notification).enqueueSaasNotification(eq("admin@x.com"), any(), any(), any(), any(), any(), any());
    }

    @Test
    void no_admin_no_notification_email_skipped() {
        Company c = company(1L, Plan.PRO, true, null);
        when(companyRepo.findAll()).thenReturn(List.of(c));
        when(productRepo.findLowStockByCompany(eq(1L), anyInt(), any()))
                .thenReturn(List.of(product(10L, 1L, "X", 1)));
        when(userRepo.findByCompanyIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
        // Email yok → bildirim atma, hata vermeyecek
        job.runDailyAlerts();
        verify(notification, never()).enqueueSaasNotification(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void exception_in_one_company_does_not_block_others() {
        Company c1 = company(1L, Plan.PRO, true, "a@b.com");
        Company c2 = company(2L, Plan.PRO, true, "b@c.com");
        when(companyRepo.findAll()).thenReturn(List.of(c1, c2));
        when(productRepo.findLowStockByCompany(eq(1L), anyInt(), any()))
                .thenThrow(new RuntimeException("DB err"));
        when(productRepo.findLowStockByCompany(eq(2L), anyInt(), any()))
                .thenReturn(List.of(product(10L, 2L, "X", 1)));

        job.runDailyAlerts();
        verify(notification).enqueueSaasNotification(eq("b@c.com"), any(), any(), any(), any(), any(), any());
    }
}
