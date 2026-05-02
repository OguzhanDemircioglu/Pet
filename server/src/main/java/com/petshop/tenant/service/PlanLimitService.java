package com.petshop.tenant.service;

import com.petshop.catalog.repository.ProductRepository;
import com.petshop.tenant.entity.Company.Plan;
import com.petshop.tenant.exception.PlanFeatureLockedException;
import com.petshop.tenant.exception.PlanLimitExceededException;
import com.petshop.tenant.repository.CompanyRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlanLimitService {

    public static final int FREE_PRODUCT_LIMIT = 20;
    public static final int FREE_USER_LIMIT = 1;

    private final CompanyRepository companyRepository;
    private final ProductRepository productRepository;
    private final EntityManager entityManager;

    public Plan getPlan(Long companyId) {
        return companyRepository.findPlanById(companyId)
                .orElseThrow(() -> new IllegalStateException("Company bulunamadı: " + companyId));
    }

    /**
     * Race condition'a karşı PostgreSQL advisory lock kullanır.
     * Aynı company için paralel "ürün ekle" istekleri sıraya girer.
     */
    @Transactional
    public void assertCanAddProduct(Long companyId) {
        entityManager.createNativeQuery("SELECT pg_advisory_xact_lock(:cid)")
                .setParameter("cid", companyId)
                .getSingleResult();

        Plan plan = getPlan(companyId);
        if (plan == Plan.FREE) {
            long count = productRepository.countByCompanyId(companyId);
            if (count >= FREE_PRODUCT_LIMIT) {
                throw new PlanLimitExceededException(
                        "FREE plan ürün limiti: " + FREE_PRODUCT_LIMIT + " (mevcut: " + count + ")");
            }
        }
    }

    public void assertFeatureSalesHistory(Long companyId) {
        if (getPlan(companyId) == Plan.FREE) {
            throw new PlanFeatureLockedException("Satış geçmişi PRO plan ile açılır");
        }
    }

    public void assertFeatureLowStockAlert(Long companyId) {
        if (getPlan(companyId) == Plan.FREE) {
            throw new PlanFeatureLockedException("Düşük stok uyarısı PRO plan ile açılır");
        }
    }

    public void assertFeatureMultiUser(Long companyId) {
        if (getPlan(companyId) == Plan.FREE) {
            throw new PlanFeatureLockedException("Çoklu kullanıcı PRO plan ile açılır");
        }
    }

    public void assertFeaturePublicShop(Long companyId) {
        if (!getPlan(companyId).atLeast(Plan.PRO_PLUS)) {
            throw new PlanFeatureLockedException("Public mini vitrin PRO+ plan ile açılır");
        }
    }
}
