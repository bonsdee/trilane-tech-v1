package com.trilanetech.api.lead;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface LeadRepository extends JpaRepository<Lead, Long>, JpaSpecificationExecutor<Lead> {

    @Override
    @EntityGraph(attributePaths = {"service", "assignedTo"})
    Page<Lead> findAll(Specification<Lead> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"service", "assignedTo"})
    List<Lead> findAll(Specification<Lead> spec, Sort sort);

    @EntityGraph(attributePaths = {"service", "assignedTo"})
    Optional<Lead> findWithDetailsById(Long id);
}
