package com.petshop.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * Flyway disabled iken petshop schema'sını oluşturur.
 * Flyway enabled iken Flyway zaten {@code spring.flyway.schemas} ile yaratıyor.
 *
 * <p>HibernatePropertiesCustomizer kullanmıyoruz — DataSource bağımlılığı
 * Flyway/JPA arasında circular depends-on yaratıyordu.</p>
 */
@Component
@ConditionalOnProperty(name = "spring.flyway.enabled", havingValue = "false")
@RequiredArgsConstructor
@Slf4j
public class SchemaInitializer {

    private final DataSource dataSource;

    @Value("${spring.jpa.properties.hibernate.default_schema:petshop}")
    private String schemaName;

    @PostConstruct
    public void createSchema() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE SCHEMA IF NOT EXISTS " + schemaName);
            log.info("Schema '{}' hazır", schemaName);
        } catch (Exception e) {
            log.warn("Schema oluşturma hatası (zaten var olabilir): {}", e.getMessage());
        }
    }
}
