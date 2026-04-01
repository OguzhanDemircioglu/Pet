package com.pettoptan.repository;

import com.pettoptan.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
    List<Category> findByParentIsNullAndIsActiveTrue();
    List<Category> findByParentIdAndIsActiveTrue(Long parentId);

    @Query("""
        SELECT DISTINCT c FROM Category c
        LEFT JOIN FETCH c.children ch
        WHERE c.parent IS NULL AND c.isActive = true
        ORDER BY c.displayOrder
        """)
    List<Category> findTopLevelWithChildren();

    @Query("SELECT DISTINCT p.category.id FROM Product p WHERE p.isActive = true")
    Set<Long> findCategoryIdsWithActiveProducts();
}
