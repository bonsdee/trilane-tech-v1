package com.trilanetech.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.trilanetech.api.user.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;

class PermissionsIntegrationTest extends IntegrationTest {

    @ParameterizedTest
    @ValueSource(strings = {"/api/v1/admin/leads", "/api/v1/admin/leads/export", "/api/v1/admin/dashboard/summary",
            "/api/v1/admin/services", "/api/v1/admin/team", "/api/v1/admin/portfolio", "/api/v1/admin/faqs",
            "/api/v1/admin/settings/pilot", "/api/v1/admin/settings/booking", "/api/v1/admin/users", "/api/v1/admin/email-signatures",
            "/api/v1/auth/me"})
    void adminEndpointsNeedASignedInUser(String path) throws Exception {
        mvc.perform(get(path)).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
        mvc.perform(get(path).header("Authorization", "Bearer not.a.real.token")).andExpect(status().isUnauthorized());
    }

    @Test
    void writesAreProtectedToo() throws Exception {
        mvc.perform(post("/api/v1/admin/services").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(put("/api/v1/admin/settings/pilot").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(put("/api/v1/admin/settings/booking").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/v1/admin/leads/1")).andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/v1/admin/users/1").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/admin/files")).andExpect(status().isUnauthorized());
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() throws Exception {
        String forged = "eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ0cmlsYW5lLWFwaSIsInN1YiI6IjEiLCJyb2xlIjoiQURNSU4iLCJleHAiOjQxMDI0NDQ4MDB9."
                + "c2lnbmF0dXJlLXRoYXQtZG9lcy1ub3QtbWF0Y2gtYW55LWtleQ";
        createAdmin("Admin", "admin@example.com");
        mvc.perform(get("/api/v1/admin/leads").header("Authorization", "Bearer " + forged))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void publicEndpointsAreOpen() throws Exception {
        for (String path : new String[] {"/api/v1/public/services", "/api/v1/public/team", "/api/v1/public/portfolio",
                "/api/v1/public/faqs", "/api/v1/public/site"}) {
            mvc.perform(get(path)).andExpect(status().isOk()).andExpect(jsonPath("$.data").exists());
        }
    }

    @Test
    void reservedClientAreaIsClosed() throws Exception {
        mvc.perform(get("/api/v1/client/projects")).andExpect(status().isUnauthorized());
    }

    @Test
    void adminCanUseTheDashboardApi() throws Exception {
        createAdmin("Admin", "admin@example.com");
        mvc.perform(get("/api/v1/admin/leads").header("Authorization", bearer(token("admin@example.com"))))
                .andExpect(status().isOk());
    }

    @Test
    void cannotDeactivateYourOwnAccount() throws Exception {
        User me = createAdmin("Admin", "admin@example.com");
        createAdmin("Other", "other@example.com");
        mvc.perform(patch("/api/v1/admin/users/" + me.getId()).header("Authorization", bearer(token("admin@example.com")))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"active\":false}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.message").value("You cannot deactivate your own account."));
    }

    @Test
    void lastActiveAdminCannotBeDeactivated() throws Exception {
        createAdmin("Admin", "admin@example.com");
        User other = createAdmin("Other", "other@example.com");
        String token = token("admin@example.com");
        // Make "admin" unable to count as an active admin by removing their password,
        // leaving "other" as the only admin who can sign in.
        jdbc.update("update users set password_hash = null where email = 'admin@example.com'");
        mvc.perform(patch("/api/v1/admin/users/" + other.getId()).header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"active\":false}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.message").value("At least one active admin must remain."));
    }

    @Test
    void securityHeadersArePresent() throws Exception {
        mvc.perform(get("/api/v1/public/site"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().exists("Content-Security-Policy"));
    }

    @Test
    void browsersMayOnlyCallFromTheConfiguredSite() throws Exception {
        mvc.perform(get("/api/v1/public/site").header("Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        mvc.perform(get("/api/v1/public/site").header("Origin", "https://evil.example")).andExpect(status().isForbidden());
    }
}
