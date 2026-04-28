package com.petshop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Application entry-point. ConfigurationProperties registration'ları her modülün
 * kendi {@code config/} paketinde (PaymentConfiguration, InvoiceConfiguration)
 * yapılır — root application module hiçbir modülün internal'ına erişmez.
 */
@SpringBootApplication
@EnableScheduling
public class PetshopApplication {
    public static void main(String[] args) {
        SpringApplication.run(PetshopApplication.class, args);
    }
}
