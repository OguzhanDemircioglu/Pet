package com.petshop;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

/**
 * Spring Modulith sınır doğrulama testleri.
 *
 * {@link #verifiesModularStructure()} her PR'da CI'da çalışır — cross-module
 * entity/repository/service erişimi ortaya çıkarsa build kırılır.
 *
 * {@link #writesDocumentation()} target/spring-modulith-docs/ altında PlantUML +
 * AsciiDoc dosyalar üretir (her modül için bir component diagram).
 */
class ModularityTests {

    ApplicationModules modules = ApplicationModules.of(PetshopApplication.class);

    @Test
    void verifiesModularStructure() {
        modules.verify();
    }

    @Test
    void writesDocumentation() {
        new Documenter(modules).writeDocumentation();
    }
}
