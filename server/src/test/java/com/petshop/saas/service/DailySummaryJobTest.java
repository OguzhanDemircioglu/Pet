package com.petshop.saas.service;

import com.petshop.auth.entity.User;
import com.petshop.auth.repository.UserRepository;
import com.petshop.notification.api.NotificationFacade;
import com.petshop.order.entity.Order;
import com.petshop.order.repository.OrderRepository;
import com.petshop.tenant.entity.Company;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.repository.CompanyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DailySummaryJobTest {

    private CompanyRepository companyRepo;
    private OrderRepository orderRepo;
    private UserRepository userRepo;
    private NotificationFacade notif;
    private DailySummaryJob job;

    @BeforeEach
    void init() {
        companyRepo = mock(CompanyRepository.class);
        orderRepo = mock(OrderRepository.class);
        userRepo = mock(UserRepository.class);
        notif = mock(NotificationFacade.class);
        job = new DailySummaryJob(companyRepo, orderRepo, userRepo, notif);
        ReflectionTestUtils.setField(job, "frontendUrl", "http://app");
    }

    private Company company(Long id, Plan plan, boolean enabled, String email) {
        return Company.builder().id(id).slug("c" + id).name("Co" + id).plan(plan)
                .isActive(true).dailySummaryEnabled(enabled)
                .notificationEmail(email).lowStockThreshold(5).build();
    }

    private Order order(Long id, String number, BigDecimal total, String customer) {
        return Order.builder().id(id).companyId(1L).orderNumber(number).guestName(customer)
                .subtotal(total).discountAmount(BigDecimal.ZERO).total(total)
                .status(Order.OrderStatus.PAID).paymentMethod(Order.PaymentMethod.COD).build();
    }

    @SuppressWarnings("unchecked")
    private Page<Order> mockOrdersPage(List<Order> orders) {
        return new PageImpl<>(orders, Pageable.ofSize(1000), orders.size());
    }

    @Test
    void free_plan_skipped() {
        when(companyRepo.findAll()).thenReturn(List.of(company(1L, Plan.FREE, true, "a@b.com")));
        job.runDailySummary();
        verify(orderRepo, never()).searchByCompany(any(), any(), any(), any(), any());
    }

    @Test
    void disabled_skipped() {
        when(companyRepo.findAll()).thenReturn(List.of(company(1L, Plan.PRO, false, "a@b.com")));
        job.runDailySummary();
        verify(notif, never()).enqueueSaasNotification(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void no_sales_today_no_email() {
        when(companyRepo.findAll()).thenReturn(List.of(company(1L, Plan.PRO, true, "a@b.com")));
        when(orderRepo.searchByCompany(eq(1L), any(), any(), isNull(), any()))
                .thenReturn(mockOrdersPage(List.of()));
        job.runDailySummary();
        verify(notif, never()).enqueueSaasNotification(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void sends_summary_with_total_and_aov() {
        when(companyRepo.findAll()).thenReturn(List.of(company(1L, Plan.PRO, true, "ops@x.com")));
        when(orderRepo.searchByCompany(eq(1L), any(), any(), isNull(), any()))
                .thenReturn(mockOrdersPage(List.of(
                        order(1L, "PT001", new BigDecimal("100"), "Ali"),
                        order(2L, "PT002", new BigDecimal("50"),  "Veli")
                )));

        job.runDailySummary();

        verify(notif).enqueueSaasNotification(
                eq("ops@x.com"),
                contains("Günlük Özet"),
                eq("Bugünün Özeti"),
                contains("2 satış"),
                contains("75.00"), // aov 150/2 = 75
                eq("Satışları Görüntüle"),
                eq("http://app/satislar"));
    }

    @Test
    void falls_back_to_admin_email() {
        when(companyRepo.findAll()).thenReturn(List.of(company(1L, Plan.PRO, true, null)));
        when(orderRepo.searchByCompany(eq(1L), any(), any(), isNull(), any()))
                .thenReturn(mockOrdersPage(List.of(order(1L, "PT001", BigDecimal.TEN, "X"))));
        when(userRepo.findByCompanyIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(
                User.builder().id(1L).email("admin@x.com").role(User.Role.ADMIN).isActive(true).build()
        ));

        job.runDailySummary();

        verify(notif).enqueueSaasNotification(eq("admin@x.com"), any(), any(), any(), any(), any(), any());
    }

    @Test
    void exception_in_one_company_does_not_stop_others() {
        when(companyRepo.findAll()).thenReturn(List.of(
                company(1L, Plan.PRO, true, "a@x.com"),
                company(2L, Plan.PRO, true, "b@x.com")
        ));
        when(orderRepo.searchByCompany(eq(1L), any(), any(), isNull(), any()))
                .thenThrow(new RuntimeException("boom"));
        when(orderRepo.searchByCompany(eq(2L), any(), any(), isNull(), any()))
                .thenReturn(mockOrdersPage(List.of(order(1L, "X", BigDecimal.ONE, "Y"))));

        job.runDailySummary();

        verify(notif).enqueueSaasNotification(eq("b@x.com"), any(), any(), any(), any(), any(), any());
    }
}
