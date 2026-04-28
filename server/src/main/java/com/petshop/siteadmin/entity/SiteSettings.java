package com.petshop.siteadmin.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "site_settings", schema = "petshop")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SiteSettings {

    @Id
    private Long id;

    @Column(name = "brand_part1", nullable = false, length = 30)
    private String brandPart1;

    @Column(name = "brand_part2", nullable = false, length = 30)
    private String brandPart2;

    @Column(name = "contact_email", nullable = false, length = 100)
    private String contactEmail;

    @Column(name = "contact_phone", nullable = false, length = 20)
    private String contactPhone;

    @Column(name = "company_address", length = 255)
    private String companyAddress;

    @Column(name = "contact_hours", length = 60)
    private String contactHours;

    @Column(name = "map_coords", length = 40)
    private String mapCoords;

    @Column(name = "app_domain", length = 60)
    private String appDomain;

    @Column(name = "app_year", length = 4)
    private String appYear;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
