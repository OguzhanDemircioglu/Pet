package com.petshop.payment.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Payment modülünün config-class registration'ı.
 * IyzicoProperties'i Spring'e bildirir; root application class bu modülün
 * iç tiplerine erişmek zorunda kalmaz.
 */
@Configuration
@EnableConfigurationProperties(IyzicoProperties.class)
class PaymentConfiguration {}
