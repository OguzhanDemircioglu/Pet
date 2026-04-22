package com.petshop.service;

import com.iyzipay.model.CheckoutForm;
import com.iyzipay.model.CheckoutFormInitialize;
import com.iyzipay.request.CreateCheckoutFormInitializeRequest;
import com.iyzipay.request.RetrieveCheckoutFormRequest;
import com.petshop.dto.request.OrderItemRequest;
import com.petshop.dto.request.OrderRequest;
import com.petshop.dto.response.PaymentInitiateResponse;
import com.petshop.entity.Order;
import com.petshop.entity.User;
import com.petshop.exception.BusinessException;
import com.petshop.repository.OrderRepository;
import com.petshop.repository.ProductRepository;
import com.petshop.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PaymentServiceTest {

//    @Mock private OrderRepository orderRepository;
//    @Mock private UserRepository userRepository;
//    @Mock private ProductRepository productRepository;
//    @Mock private NotificationService notificationService;
//    @Mock private NotificationOutboxService notificationOutboxService;
//    @Mock private TelegramOutboxService telegramOutboxService;
//    @Mock private IyzicoClient iyzicoClient;
//
//    @InjectMocks
//    private PaymentService paymentService;
//
//    private User testUser;
//    private OrderRequest testReq;
//
//    @BeforeEach
//    void setUp() {
//        ReflectionTestUtils.setField(paymentService, "appUrl", "http://localhost:8080");
//        ReflectionTestUtils.setField(paymentService, "frontendUrl", "http://localhost:5173");
//
//        testUser = new User();
//        testUser.setId(1L);
//        testUser.setFirstName("Ali");
//        testUser.setLastName("Veli");
//        testUser.setEmail("ali@test.com");
//
//        testReq = new OrderRequest(
//                "Ali Veli",
//                "05321234567",
//                "İstanbul",
//                "Kadıköy",
//                "Test Sok. No:1",
//                new BigDecimal("250.00"),
//                List.of(new OrderItemRequest(1L, 1,"Kedi Maması", 2, new BigDecimal("125.00")))
//        );
//
//        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
//        when(orderRepository.findLastOrderNumber()).thenReturn(Optional.empty());
//        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
//            Order o = inv.getArgument(0);
//            if (o.getId() == null) {
//                try {
//                    java.lang.reflect.Field f = Order.class.getDeclaredField("id");
//                    f.setAccessible(true);
//                    f.set(o, 42L);
//                } catch (Exception ignored) {}
//            }
//            return o;
//        });
//    }
//
//    // ─── initiate ────────────────────────────────────────────────────────────
//
//    @Test
//    @DisplayName("initiate: iyzico başarılı → PaymentInitiateResponse döner, token kaydedilir")
//    void initiate_success() {
//        CheckoutFormInitialize mockInit = mock(CheckoutFormInitialize.class);
//        when(mockInit.getStatus()).thenReturn("success");
//        when(mockInit.getToken()).thenReturn("iyzico-token-abc123");
//        when(mockInit.getPaymentPageUrl()).thenReturn("https://sandbox.iyzipay.com/checkout/pay/iyzico-token-abc123");
//        when(iyzicoClient.initializeForm(any(CreateCheckoutFormInitializeRequest.class))).thenReturn(mockInit);
//
//        PaymentInitiateResponse response = paymentService.initiate(1L, testReq, "127.0.0.1");
//
//        assertThat(response).isNotNull();
//        assertThat(response.paymentPageUrl()).contains("iyzico-token-abc123");
//        assertThat(response.orderId()).isEqualTo(42L);
//
//        // Token kaydedildi mi?
//        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
//        verify(orderRepository, atLeast(2)).save(orderCaptor.capture());
//        List<Order> savedOrders = orderCaptor.getAllValues();
//        boolean tokenSaved = savedOrders.stream().anyMatch(o -> "iyzico-token-abc123".equals(o.getIyzicoToken()));
//        assertThat(tokenSaved).isTrue();
//
//        // Ödeme yöntemi CREDIT_CARD mı?
//        assertThat(savedOrders.get(0).getPaymentMethod()).isEqualTo(Order.PaymentMethod.CREDIT_CARD);
//    }
//
//    @Test
//    @DisplayName("initiate: iyzico başarısız → BusinessException atılır, sipariş CANCELLED yapılır")
//    void initiate_iyzicoError() {
//        CheckoutFormInitialize mockInit = mock(CheckoutFormInitialize.class);
//        when(mockInit.getStatus()).thenReturn("failure");
//        when(mockInit.getErrorCode()).thenReturn("10051");
//        when(mockInit.getErrorMessage()).thenReturn("Yetersiz bakiye");
//        when(iyzicoClient.initializeForm(any(CreateCheckoutFormInitializeRequest.class))).thenReturn(mockInit);
//
//        assertThatThrownBy(() -> paymentService.initiate(1L, testReq, "127.0.0.1"))
//                .isInstanceOf(BusinessException.class)
//                .hasMessageContaining("Yetersiz bakiye");
//
//        // Sipariş CANCELLED'a çekildi mi?
//        ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
//        verify(orderRepository, atLeast(2)).save(captor.capture());
//        boolean hasCancelled = captor.getAllValues().stream()
//                .anyMatch(o -> Order.OrderStatus.CANCELLED.equals(o.getStatus()));
//        assertThat(hasCancelled).isTrue();
//    }
//
//    @Test
//    @DisplayName("initiate: iyzico SDK exception → BusinessException atılır")
//    void initiate_sdkException() {
//        when(iyzicoClient.initializeForm(any())).thenThrow(new RuntimeException("Bağlantı zaman aşımı"));
//
//        assertThatThrownBy(() -> paymentService.initiate(1L, testReq, "127.0.0.1"))
//                .isInstanceOf(BusinessException.class)
//                .hasMessageContaining("Bağlantı zaman aşımı");
//    }
//
//    // ─── handleCallback ───────────────────────────────────────────────────────
//
//    @Test
//    @DisplayName("handleCallback: ödeme başarılı → sipariş PAID, success URL döner")
//    void handleCallback_paid() {
//        Order order = createTestOrder();
//        when(orderRepository.findByIyzicoToken("test-token")).thenReturn(Optional.of(order));
//
//        CheckoutForm mockForm = mock(CheckoutForm.class);
//        when(mockForm.getStatus()).thenReturn("success");
//        when(mockForm.getPaymentStatus()).thenReturn("SUCCESS");
//        when(mockForm.getPaymentId()).thenReturn("PAY-001");
//        when(mockForm.getPaidPrice()).thenReturn(new BigDecimal("250.00"));
//        when(iyzicoClient.retrieveForm(any(RetrieveCheckoutFormRequest.class))).thenReturn(mockForm);
//        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
//
//        String redirectUrl = paymentService.handleCallback("test-token");
//
//        assertThat(redirectUrl).contains("success=true");
//        assertThat(redirectUrl).contains("orderId=42");
//        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.PAID);
//    }
//
//    @Test
//    @DisplayName("handleCallback: ödeme başarısız → sipariş CANCELLED, failure URL döner")
//    void handleCallback_failed() {
//        Order order = createTestOrder();
//        when(orderRepository.findByIyzicoToken("test-token")).thenReturn(Optional.of(order));
//
//        CheckoutForm mockForm = mock(CheckoutForm.class);
//        when(mockForm.getStatus()).thenReturn("failure");
//        when(mockForm.getPaymentStatus()).thenReturn("FAILURE");
//        when(mockForm.getErrorCode()).thenReturn("10012");
//        when(mockForm.getErrorMessage()).thenReturn("Kart reddedildi");
//        when(iyzicoClient.retrieveForm(any(RetrieveCheckoutFormRequest.class))).thenReturn(mockForm);
//
//        String redirectUrl = paymentService.handleCallback("test-token");
//
//        assertThat(redirectUrl).contains("success=false");
//        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.CANCELLED);
//    }
//
//    @Test
//    @DisplayName("handleCallback: token bulunamıyor → failure URL döner")
//    void handleCallback_tokenNotFound() {
//        when(orderRepository.findByIyzicoToken("unknown-token")).thenReturn(Optional.empty());
//
//        String redirectUrl = paymentService.handleCallback("unknown-token");
//
//        assertThat(redirectUrl).contains("success=false");
//        verifyNoInteractions(iyzicoClient);
//    }
//
//    // ─── helper ───────────────────────────────────────────────────────────────
//
//    private Order createTestOrder() {
//        Order order = Order.builder()
//                .orderNumber("PT00000001")
//                .user(testUser)
//                .status(Order.OrderStatus.PENDING)
//                .paymentMethod(Order.PaymentMethod.CREDIT_CARD)
//                .iyzicoToken("test-token")
//                .total(new BigDecimal("250.00"))
//                .subtotal(new BigDecimal("250.00"))
//                .discountAmount(BigDecimal.ZERO)
//                .vatAmount(BigDecimal.ZERO)
//                .shippingCity("İstanbul")
//                .shippingDistrict("Kadıköy")
//                .shippingAddress("Test Sok.")
//                .guestName("Ali Veli")
//                .guestPhone("05321234567")
//                .items(new java.util.ArrayList<>())
//                .build();
//        try {
//            java.lang.reflect.Field f = Order.class.getDeclaredField("id");
//            f.setAccessible(true);
//            f.set(order, 42L);
//        } catch (Exception ignored) {}
//        return order;
//    }
}
