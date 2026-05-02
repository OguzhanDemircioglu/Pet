package com.petshop.tenant.service;

import com.petshop.tenant.entity.Company;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;

    @Transactional
    public Company createCompany(String name, Plan plan) {
        String slug = generateUniqueSlug(name);
        Company c = Company.builder()
                .name(name)
                .slug(slug)
                .plan(plan == null ? Plan.FREE : plan)
                .isActive(true)
                .build();
        return companyRepository.save(c);
    }

    public Company getById(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Company bulunamadı: " + id));
    }

    private String generateUniqueSlug(String name) {
        String base = slugify(name);
        if (base.isBlank()) base = "shop";
        String candidate = base;
        int suffix = 2;
        while (companyRepository.existsBySlug(candidate)) {
            candidate = base + "-" + suffix++;
            if (suffix > 1000) {
                throw new IllegalStateException("Slug üretilemedi: " + name);
            }
        }
        return candidate;
    }

    static String slugify(String input) {
        if (input == null) return "";
        String n = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase(Locale.ROOT)
                .replace('ı', 'i').replace('ğ', 'g').replace('ş', 's')
                .replace('ü', 'u').replace('ö', 'o').replace('ç', 'c');
        n = n.replaceAll("[^a-z0-9\\s-]", "")
             .trim()
             .replaceAll("\\s+", "-")
             .replaceAll("-+", "-");
        if (n.length() > 80) n = n.substring(0, 80);
        return n;
    }
}
