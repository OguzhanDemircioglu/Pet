package com.petshop.repository;

import com.petshop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    boolean existsByEmail(String email);
    Optional<User> findFirstByRole(User.Role role);
    List<User> findByRole(User.Role role);

    @Modifying
    @Query("DELETE FROM User u WHERE u.emailVerified = false AND u.createdAt < :cutoff")
    int deleteUnverifiedBefore(@Param("cutoff") LocalDateTime cutoff);
}
