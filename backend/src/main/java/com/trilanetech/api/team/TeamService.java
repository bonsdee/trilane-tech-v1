package com.trilanetech.api.team;

import com.trilanetech.api.common.ApiException;
import com.trilanetech.api.common.Texts;
import com.trilanetech.api.file.FileService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TeamService {

    public record TeamMemberDto(Long id, String fullName, String position, String bio, Long photoFileId,
                                String photoUrl, int displayOrder, boolean published) {
        static TeamMemberDto from(TeamMember m) {
            return new TeamMemberDto(m.getId(), m.getFullName(), m.getPosition(), m.getBio(), m.getPhotoFileId(),
                    FileService.urlFor(m.getPhotoFileId()), m.getDisplayOrder(), m.isPublished());
        }
    }

    public record TeamMemberRequest(
            @NotBlank(message = "Enter a name.") @Size(max = 120, message = "Use at most 120 characters.") String fullName,
            @Size(max = 120, message = "Use at most 120 characters.") String position,
            @Size(max = 3000, message = "Use at most 3,000 characters.") String bio,
            Long photoFileId,
            @Min(value = 0, message = "Order must be 0 or more.") @Max(value = 10000, message = "Order is too large.") Integer displayOrder,
            Boolean published) {}

    private final TeamMemberRepository members;
    private final FileService files;

    public TeamService(TeamMemberRepository members, FileService files) {
        this.members = members;
        this.files = files;
    }

    @Transactional(readOnly = true)
    public List<TeamMemberDto> published() {
        return members.findByPublishedTrueOrderByDisplayOrderAscIdAsc().stream().map(TeamMemberDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<TeamMemberDto> all() {
        return members.findAllByOrderByDisplayOrderAscIdAsc().stream().map(TeamMemberDto::from).toList();
    }

    @Transactional
    public TeamMemberDto create(TeamMemberRequest request) {
        TeamMember member = new TeamMember();
        apply(member, request);
        return TeamMemberDto.from(members.save(member));
    }

    @Transactional
    public TeamMemberDto update(long id, TeamMemberRequest request) {
        TeamMember member = members.findById(id).orElseThrow(() -> ApiException.notFound("Team member"));
        apply(member, request);
        return TeamMemberDto.from(members.save(member));
    }

    @Transactional
    public void delete(long id) {
        TeamMember member = members.findById(id).orElseThrow(() -> ApiException.notFound("Team member"));
        members.delete(member);
    }

    private void apply(TeamMember m, TeamMemberRequest r) {
        files.requireExists(r.photoFileId(), "photoFileId");
        m.setFullName(Texts.clean(r.fullName()));
        m.setPosition(Texts.clean(r.position()));
        m.setBio(Texts.clean(r.bio()));
        m.setPhotoFileId(r.photoFileId());
        m.setDisplayOrder(r.displayOrder() == null ? 0 : r.displayOrder());
        m.setPublished(r.published() == null || r.published());
    }
}
