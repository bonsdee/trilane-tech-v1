package com.trilanetech.api.faq;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FaqRepository extends JpaRepository<Faq, Long> {

    List<Faq> findAllByOrderByDisplayOrderAscIdAsc();

    List<Faq> findByPublishedTrueOrderByDisplayOrderAscIdAsc();
}
