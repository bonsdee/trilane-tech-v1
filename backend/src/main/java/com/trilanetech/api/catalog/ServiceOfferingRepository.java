package com.trilanetech.api.catalog;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, Long> {

    @EntityGraph(attributePaths = "items")
    List<ServiceOffering> findAllByOrderByDisplayOrderAscIdAsc();

    @EntityGraph(attributePaths = "items")
    List<ServiceOffering> findByPublishedTrueOrderByDisplayOrderAscIdAsc();

    Optional<ServiceOffering> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
