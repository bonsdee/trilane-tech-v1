package com.trilanetech.api.team;

import com.trilanetech.api.common.ApiResponse;
import com.trilanetech.api.team.TeamService.TeamMemberDto;
import com.trilanetech.api.team.TeamService.TeamMemberRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

public final class TeamControllers {

    private TeamControllers() {}

    @RestController
    @RequestMapping("/api/v1/public/team")
    public static class PublicTeamController {
        private final TeamService team;

        public PublicTeamController(TeamService team) {
            this.team = team;
        }

        @GetMapping
        public ApiResponse<List<TeamMemberDto>> list() {
            return ApiResponse.of(team.published());
        }
    }

    @RestController
    @RequestMapping("/api/v1/admin/team")
    public static class AdminTeamController {
        private final TeamService team;

        public AdminTeamController(TeamService team) {
            this.team = team;
        }

        @GetMapping
        public ApiResponse<List<TeamMemberDto>> list() {
            return ApiResponse.of(team.all());
        }

        @PostMapping
        @ResponseStatus(HttpStatus.CREATED)
        public ApiResponse<TeamMemberDto> create(@Valid @RequestBody TeamMemberRequest body) {
            return ApiResponse.of(team.create(body));
        }

        @PutMapping("/{id}")
        public ApiResponse<TeamMemberDto> update(@PathVariable long id, @Valid @RequestBody TeamMemberRequest body) {
            return ApiResponse.of(team.update(id, body));
        }

        @DeleteMapping("/{id}")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void delete(@PathVariable long id) {
            team.delete(id);
        }
    }
}
