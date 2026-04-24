package com.petshop.dto.request;

import java.math.BigDecimal;
import java.util.List;

public record OrderRequest(
        String fullName,
        String phone,
        String city,
        String district,
        String address,
        BigDecimal totalAmount,
        List<OrderItemRequest> items,
        // ─── Fatura bilgileri (checkout'ta zorunlu) ────────────────────────
        String invoiceType,        // "INDIVIDUAL" | "CORPORATE"
        String invoiceIdentityNo,  // TCKN (11) veya VKN (10)
        String invoiceTitle,       // Kurumsal ünvan (CORPORATE ise)
        String invoiceTaxOffice,   // Vergi dairesi (CORPORATE ise)
        String invoiceAddress,
        String invoiceCity,
        String invoiceDistrict
) {}
