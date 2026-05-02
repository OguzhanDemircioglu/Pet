package com.petshop.saas.dto;

import java.math.BigDecimal;

public record DailySalesPoint(String date, long count, BigDecimal total) {}
