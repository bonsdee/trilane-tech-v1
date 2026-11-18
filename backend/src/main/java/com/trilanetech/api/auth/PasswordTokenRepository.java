package com.trilanetech.api.auth;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface PasswordTokenRepository extends JpaRepository<PasswordToken, Long> {

    Optional<PasswordToken> findByTokenHash(String tokenHash);

    /** Retires every unused link for a user so only the newest one works. */
    @Modifying
    @Query("update PasswordToken t set t.usedAt = :now where t.user.id = :userId and t.usedAt is null")
    int retireAllForUser(Long userId, Instant now);
}
