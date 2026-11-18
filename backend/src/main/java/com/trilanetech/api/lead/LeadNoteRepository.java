package com.trilanetech.api.lead;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeadNoteRepository extends JpaRepository<LeadNote, Long> {

    @EntityGraph(attributePaths = "author")
    List<LeadNote> findByLeadIdOrderByCreatedAtDescIdDesc(Long leadId);

    Optional<LeadNote> findByIdAndLeadId(Long id, Long leadId);
}
