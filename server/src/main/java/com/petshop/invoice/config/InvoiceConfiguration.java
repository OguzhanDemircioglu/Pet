package com.petshop.invoice.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Invoice modülünün config-class registration'ı.
 * ParasutProperties'i Spring'e bildirir; root application class bu modülün
 * iç tiplerine erişmek zorunda kalmaz.
 */
@Configuration
@EnableConfigurationProperties(ParasutProperties.class)
class InvoiceConfiguration {}
