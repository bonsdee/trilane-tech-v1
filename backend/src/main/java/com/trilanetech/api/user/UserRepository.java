package com.trilanetech.api.user;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, Long> {

    @Query("select u from User u where lower(u.email) = lower(:email)")
    Optional<User> findByEmailIgnoreCase(String email);

    @Query("select count(u) > 0 from User u where lower(u.email) = lower(:email)")
    boolean existsByEmailIgnoreCase(String email);

    /** Active admins who can actually sign in (they have set a password). */
    @Query("select count(u) from User u where u.active = true and u.role = :role "
            + "and u.passwordHash is not null and u.id <> :excludeId")
    long countUsableAdminsExcluding(Role role, Long excludeId);

    List<User> findAllByOrderByFullNameAsc();
}
