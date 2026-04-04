package com.offcats.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * Hibernate başlamadan önce petshop schema'sını oluşturur.
 * Aiven DB'de schema yoksa JPA ddl-auto:update hata verir.
 */
@Configuration
@Slf4j
public class SchemaInitializer {

    @Value("${spring.jpa.properties.hibernate.default_schema:petshop}")
    private String schemaName;

    @Bean
    public HibernatePropertiesCustomizer schemaCreatorCustomizer(DataSource dataSource) {
        return hibernateProperties -> {
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement()) {
                stmt.execute("CREATE SCHEMA IF NOT EXISTS " + schemaName);
                log.info("Schema '{}' hazır", schemaName);
            } catch (Exception e) {
                log.warn("Schema oluşturma hatası (zaten var olabilir): {}", e.getMessage());
            }
        };
    }
}
