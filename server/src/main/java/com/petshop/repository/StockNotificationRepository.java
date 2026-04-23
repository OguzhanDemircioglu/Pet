package com.petshop.repository;

import com.petshop.entity.StockNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StockNotificationRepository extends JpaRepository<StockNotification, Long> {

    @Query("""
        SELECT n FROM StockNotification n
        WHERE n.productId = :productId
          AND (:variantId IS NULL AND n.variantId IS NULL OR n.variantId = :variantId)
          AND LOWER(n.email) = LOWER(:email)
          AND n.notifiedAt IS NULL
        """)
    Optional<StockNotification> findPending(@Param("productId") Long productId,
                                            @Param("variantId") Long variantId,
                                            @Param("email") String email);

    /** Ürün seviyesi (varyantsız) bekleyen abonelikler */
    @Query("""
        SELECT n FROM StockNotification n
        WHERE n.productId = :productId AND n.variantId IS NULL AND n.notifiedAt IS NULL
        """)
    List<StockNotification> findPendingByProduct(@Param("productId") Long productId);

    /** Belirli varyant için bekleyen abonelikler */
    @Query("""
        SELECT n FROM StockNotification n
        WHERE n.variantId = :variantId AND n.notifiedAt IS NULL
        """)
    List<StockNotification> findPendingByVariant(@Param("variantId") Long variantId);
}
