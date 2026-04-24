package com.petshop.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders", schema = "petshop",
       indexes = {
           @Index(name = "idx_order_user", columnList = "user_id"),
           @Index(name = "idx_order_status", columnList = "status"),
           @Index(name = "idx_order_number", columnList = "order_number")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true, length = 20)
    private String orderNumber;

    // Kayıtlı kullanıcı veya misafir — en az biri dolu olmalı
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "guest_email", length = 150)
    private String guestEmail;

    @Column(name = "guest_name", length = 200)
    private String guestName;

    @Column(name = "guest_phone", length = 20)
    private String guestPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderStatus status = OrderStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod = PaymentMethod.COD;

    @Column(name = "iyzico_token", length = 200)
    private String iyzicoToken;

    // Teslimat adresi (JSON veya ayrı alanlar)
    @Column(name = "shipping_address", columnDefinition = "TEXT")
    private String shippingAddress;

    @Column(name = "shipping_city", length = 100)
    private String shippingCity;

    @Column(name = "shipping_district", length = 100)
    private String shippingDistrict;

    @Column(name = "shipping_postal_code", length = 20)
    private String shippingPostalCode;

    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "total", nullable = false, precision = 12, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // ─── Fatura bilgileri (Paraşüt) ─────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_type", length = 20)
    private InvoiceType invoiceType;

    @Column(name = "invoice_identity_no", length = 11)
    private String invoiceIdentityNo;   // TCKN (11) veya VKN (10)

    @Column(name = "invoice_title", length = 255)
    private String invoiceTitle;         // Kurumsal ünvan

    @Column(name = "invoice_tax_office", length = 100)
    private String invoiceTaxOffice;

    @Column(name = "invoice_address", columnDefinition = "TEXT")
    private String invoiceAddress;

    @Column(name = "invoice_city", length = 50)
    private String invoiceCity;

    @Column(name = "invoice_district", length = 50)
    private String invoiceDistrict;

    @Column(name = "parasut_contact_id", length = 50)
    private String parasutContactId;

    @Column(name = "parasut_invoice_id", length = 50)
    private String parasutInvoiceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "parasut_invoice_status", length = 20)
    private ParasutInvoiceStatus parasutInvoiceStatus;

    @Column(name = "parasut_ebelge_url", length = 500)
    private String parasutEBelgeUrl;

    // ─── iyzico / İade ───────────────────────────────────────────────────────
    @Column(name = "iyzico_payment_id", length = 100)
    private String iyzicoPaymentId;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "refund_reason", length = 500)
    private String refundReason;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum OrderStatus {
        PENDING,        // Ödeme bekleniyor
        PAID,           // Ödendi
        PROCESSING,     // Hazırlanıyor
        SHIPPED,        // Kargoya verildi
        DELIVERED,      // Teslim edildi
        CANCELLED,      // İptal
        REFUNDED        // İade
    }

    public enum PaymentMethod {
        COD,            // Teslimatta öde
        CREDIT_CARD     // Kredi kartı (iyzico)
    }

    public enum InvoiceType {
        INDIVIDUAL,     // Bireysel — e-Arşiv (TCKN)
        CORPORATE       // Kurumsal — e-Fatura (VKN)
    }

    public enum ParasutInvoiceStatus {
        PENDING,        // Kuyrukta
        CREATED,        // Fatura + e-belge başarıyla kesildi
        FAILED,         // 3 deneme sonrası hata
        CANCELLED       // İade sonrası iptal edildi
    }
}
