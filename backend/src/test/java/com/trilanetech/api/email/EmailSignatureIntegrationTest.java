package com.trilanetech.api.email;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.trilanetech.api.IntegrationTest;
import org.junit.jupiter.api.Test;

class EmailSignatureIntegrationTest extends IntegrationTest {

    @Test
    void signedInAdminGetsTheSignaturePage() throws Exception {
        createAdmin("Admin", "admin@example.com");
        mvc.perform(get("/api/v1/admin/email-signatures").header("Authorization", bearer(token("admin@example.com"))))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(jsonPath("$.data.html").value(containsString("Trilane Tech email signatures")))
                .andExpect(jsonPath("$.data.html").value(containsString("https://trilanetech.com/email/jl.jpg")));
    }

    @Test
    void signaturePageNeedsSignIn() throws Exception {
        mvc.perform(get("/api/v1/admin/email-signatures")).andExpect(status().isUnauthorized());
    }
}
