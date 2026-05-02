package com.petshop.tenant.service;

import com.petshop.tenant.entity.Company;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.repository.CompanyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class CompanyServiceTest {

    private CompanyRepository repo;
    private CompanyService service;

    @BeforeEach
    void init() {
        repo = mock(CompanyRepository.class);
        service = new CompanyService(repo);
        when(repo.save(any(Company.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void slugify_handles_turkish_chars() {
        assertThat(CompanyService.slugify("Şirin Petshop")).isEqualTo("sirin-petshop");
        assertThat(CompanyService.slugify("Çağlar's Köpek Dükkanı"))
                .isEqualTo("caglars-kopek-dukkani");
    }

    @Test
    void unique_slug_when_collision() {
        when(repo.existsBySlug("petshop")).thenReturn(true);
        when(repo.existsBySlug("petshop-2")).thenReturn(false);
        Company c = service.createCompany("Petshop", Plan.FREE);
        assertThat(c.getSlug()).isEqualTo("petshop-2");
    }

    @Test
    void empty_name_falls_back_to_shop() {
        when(repo.existsBySlug(anyString())).thenReturn(false);
        Company c = service.createCompany("???", Plan.FREE);
        assertThat(c.getSlug()).isEqualTo("shop");
    }

    @Test
    void default_plan_is_FREE_when_null() {
        when(repo.existsBySlug(anyString())).thenReturn(false);
        Company c = service.createCompany("Test", null);
        assertThat(c.getPlan()).isEqualTo(Plan.FREE);
    }
}
