package com.petshop.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Tekil kayıt (id=1). Site genelinde kullanılan marka/iletişim bilgileri.
 */
@Entity
@Table(name = "site_settings", schema = "petshop")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SiteSettings {

    @Id
    private Long id;

    @Column(name = "brand_part1", nullable = false, length = 60)
    private String brandPart1;

    @Column(name = "brand_part2", nullable = false, length = 60)
    private String brandPart2;

    @Column(name = "contact_email", nullable = false, length = 150)
    private String contactEmail;

    @Column(name = "contact_phone", nullable = false, length = 30)
    private String contactPhone;

    @Column(name = "company_address", length = 500)
    private String companyAddress;

    @Column(name = "contact_hours", length = 120)
    private String contactHours;

    /** "lat,lng" formatında — örn: "41.0082,28.9784" */
    @Column(name = "map_coords", length = 50)
    private String mapCoords;

    @Column(name = "app_domain", length = 100)
    private String appDomain;

    @Column(name = "app_year", length = 4)
    private String appYear;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
