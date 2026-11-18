package com.trilanetech.api.team;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    List<TeamMember> findAllByOrderByDisplayOrderAscIdAsc();

    List<TeamMember> findByPublishedTrueOrderByDisplayOrderAscIdAsc();
}
