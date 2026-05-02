package com.petshop.web;

import com.petshop.tenant.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * /actuator/health altında "saas" anahtarıyla çıkar.
 * Şirket tablosuna basit bir count sorgusu — DB connection canlı mı doğrular,
 * Flyway migration başarılı mı (companies tablosu var mı) implicit olarak gösterir.
 */
@Component("saas")
@RequiredArgsConstructor
@Slf4j
class SaasHealthIndicator implements HealthIndicator {

    private final CompanyRepository companyRepository;

    @Override
    public Health health() {
        try {
            long count = companyRepository.count();
            return Health.up()
                    .withDetail("companies", count)
                    .withDetail("multitenant", "active")
                    .build();
        } catch (Exception e) {
            log.warn("Saas health check failed", e);
            return Health.down().withException(e).build();
        }
    }
}
