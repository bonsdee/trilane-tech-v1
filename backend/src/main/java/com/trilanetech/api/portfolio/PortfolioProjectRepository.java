package com.trilanetech.api.portfolio;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioProjectRepository extends JpaRepository<PortfolioProject, Long> {

    @EntityGraph(attributePaths = "service")
    List<PortfolioProject> findAllByOrderByDisplayOrderAscIdAsc();

    @EntityGraph(attributePaths = "service")
    List<PortfolioProject> findByPublishedTrueOrderByDisplayOrderAscIdAsc();

    @EntityGraph(attributePaths = {"service", "images"})
    Optional<PortfolioProject> findBySlugAndPublishedTrue(String slug);

    @EntityGraph(attributePaths = {"service", "images"})
    Optional<PortfolioProject> findWithDetailsById(Long id);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    boolean existsByPublishedTrue();
}
