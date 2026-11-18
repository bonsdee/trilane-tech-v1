package com.trilanetech.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.trilanetech.api.user.User;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

class LeadManagementIntegrationTest extends IntegrationTest {

    private String auth;
    private User admin;

    @BeforeEach
    void seedLeads() throws Exception {
        admin = createAdmin("Jivonz", "admin@example.com");
        auth = bearer(token("admin@example.com"));
        insertLead("Maria Santos", "maria@example.com", "Santos Bakery", "launch-bundle", "NEW", null, "https://www.google.com/search", 0);
        insertLead("Ben Cruz", "ben@example.com", null, "landing-page", "CONTACTED", "Facebook", null, 1);
        insertLead("Ana Reyes", "ana@example.com", "Reyes Dental", null, "WON", null, null, 2);
        insertLead("Leo Lim", "leo@example.com", "=cmd|'/C calc'!A0", "website-care", "LOST", null, null, 40);
    }

    private void insertLead(String name, String email, String company, String serviceSlug, String status,
                            String utmSource, String referrer, int daysAgo) {
        jdbc.update("""
                insert into leads (full_name, email, company, service_id, message, status, utm_source, referrer, created_at, updated_at)
                values (?, ?, ?, (select id from services where slug = ?), ?, ?, ?, ?, now() - make_interval(days => ?), now())
                """, name, email, company, serviceSlug, "Hello, I would like to know more.", status, utmSource, referrer,
                daysAgo);
    }

    private long id(String name) {
        return jdbc.queryForObject("select id from leads where full_name = ?", Long.class, name);
    }

    private MockHttpServletRequestBuilder list() {
        return get("/api/v1/admin/leads").header("Authorization", auth);
    }

    @Test
    void listsNewestFirstWithPagingMeta() throws Exception {
        mvc.perform(list().param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].fullName").value("Maria Santos"))
                .andExpect(jsonPath("$.meta.totalElements").value(4))
                .andExpect(jsonPath("$.meta.totalPages").value(2))
                .andExpect(jsonPath("$.meta.page").value(0));
        mvc.perform(list().param("size", "2").param("page", "1"))
                .andExpect(jsonPath("$.data[0].fullName").value("Ana Reyes"));
    }

    @Test
    void filtersByStatusServiceSearchAndSource() throws Exception {
        mvc.perform(list().param("status", "CONTACTED")).andExpect(jsonPath("$.data[*].fullName").value(Matchers.contains("Ben Cruz")));
        mvc.perform(list().param("q", "dental")).andExpect(jsonPath("$.data[*].fullName").value(Matchers.contains("Ana Reyes")));
        mvc.perform(list().param("q", "%")).andExpect(jsonPath("$.data.length()").value(0));
        mvc.perform(list().param("serviceId", "none")).andExpect(jsonPath("$.data[*].fullName").value(Matchers.contains("Ana Reyes")));
        long landing = jdbc.queryForObject("select id from services where slug = 'landing-page'", Long.class);
        mvc.perform(list().param("serviceId", String.valueOf(landing))).andExpect(jsonPath("$.data[*].fullName").value(Matchers.contains("Ben Cruz")));
        mvc.perform(list().param("source", "google.com")).andExpect(jsonPath("$.data[*].fullName").value(Matchers.contains("Maria Santos")));
        mvc.perform(list().param("source", "facebook")).andExpect(jsonPath("$.data[*].fullName").value(Matchers.contains("Ben Cruz")));
        mvc.perform(list().param("source", "direct")).andExpect(jsonPath("$.meta.totalElements").value(2));
    }

    @Test
    void filtersByDateRangeAssigneeAndOverdue() throws Exception {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Manila"));
        mvc.perform(list().param("from", today.minusDays(3).toString()).param("to", today.toString()))
                .andExpect(jsonPath("$.meta.totalElements").value(3));
        mvc.perform(list().param("to", today.minusDays(30).toString()))
                .andExpect(jsonPath("$.data[*].fullName").value(Matchers.contains("Leo Lim")));

        long maria = id("Maria Santos");
        mvc.perform(patch("/api/v1/admin/leads/" + maria).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("assignedToId", admin.getId(), "followUpOn", today.minusDays(1).toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.assignedToName").value("Jivonz"))
                .andExpect(jsonPath("$.data.overdue").value(true));
        // A closed lead with a past follow-up date is not overdue.
        jdbc.update("update leads set follow_up_on = ? where full_name = 'Ana Reyes'", today.minusDays(5));

        mvc.perform(list().param("assignedTo", String.valueOf(admin.getId())))
                .andExpect(jsonPath("$.data[*].fullName").value(Matchers.contains("Maria Santos")));
        mvc.perform(list().param("assignedTo", "unassigned")).andExpect(jsonPath("$.meta.totalElements").value(3));
        mvc.perform(list().param("overdue", "true")).andExpect(jsonPath("$.data[*].fullName").value(Matchers.contains("Maria Santos")));
    }

    @Test
    void sortingIsLimitedToKnownColumns() throws Exception {
        mvc.perform(list().param("sort", "fullName,asc")).andExpect(jsonPath("$.data[0].fullName").value("Ana Reyes"));
        mvc.perform(list().param("sort", "passwordHash,asc")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fields.sort").exists());
    }

    @Test
    void updatesStatusAssigneeAndFollowUpAndCanClearThem() throws Exception {
        long ben = id("Ben Cruz");
        mvc.perform(patch("/api/v1/admin/leads/" + ben).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PROPOSAL_SENT\",\"assignedToId\":" + admin.getId() + ",\"followUpOn\":\"2030-01-15\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PROPOSAL_SENT"))
                .andExpect(jsonPath("$.data.statusLabel").value("Proposal Sent"))
                .andExpect(jsonPath("$.data.followUpOn").value("2030-01-15"));
        mvc.perform(patch("/api/v1/admin/leads/" + ben).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assignedToId\":null,\"followUpOn\":null}"))
                .andExpect(jsonPath("$.data.assignedToId").doesNotExist())
                .andExpect(jsonPath("$.data.followUpOn").doesNotExist())
                .andExpect(jsonPath("$.data.status").value("PROPOSAL_SENT"));
    }

    @Test
    void rejectsInvalidUpdates() throws Exception {
        long ben = id("Ben Cruz");
        mvc.perform(patch("/api/v1/admin/leads/" + ben).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"MAYBE\"}")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.fields.status").exists());
        mvc.perform(patch("/api/v1/admin/leads/" + ben).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"x@example.com\"}")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.fields.email").exists());
        mvc.perform(patch("/api/v1/admin/leads/" + ben).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"followUpOn\":\"next week\"}")).andExpect(status().isBadRequest());
        mvc.perform(patch("/api/v1/admin/leads/999999").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"WON\"}")).andExpect(status().isNotFound());
    }

    @Test
    void notesCanBeAddedListedAndDeletedAndGoWithTheLead() throws Exception {
        long maria = id("Maria Santos");
        mvc.perform(post("/api/v1/admin/leads/" + maria + "/notes").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"Called; proposal on Friday.\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.authorName").value("Jivonz"));
        mvc.perform(post("/api/v1/admin/leads/" + maria + "/notes").header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"  \"}")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/admin/leads/" + maria + "/notes").header("Authorization", auth))
                .andExpect(jsonPath("$.data.length()").value(1));
        long noteId = jdbc.queryForObject("select id from lead_notes", Long.class);
        // A note can only be deleted through its own lead.
        mvc.perform(delete("/api/v1/admin/leads/" + id("Ben Cruz") + "/notes/" + noteId).header("Authorization", auth))
                .andExpect(status().isNotFound());

        mvc.perform(delete("/api/v1/admin/leads/" + maria).header("Authorization", auth)).andExpect(status().isNoContent());
        assertThat(jdbc.queryForObject("select count(*) from lead_notes", Integer.class)).isZero();
        mvc.perform(get("/api/v1/admin/leads/" + maria).header("Authorization", auth)).andExpect(status().isNotFound());
    }

    @Test
    void csvExportFollowsTheFilterAndNeutralisesFormulas() throws Exception {
        String csv = mvc.perform(get("/api/v1/admin/leads/export").header("Authorization", auth).param("status", "LOST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", Matchers.startsWith("text/csv")))
                .andExpect(header().string("Content-Disposition", Matchers.containsString("attachment")))
                .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        String[] lines = csv.split("\r\n");
        assertThat(lines).hasSize(2);
        assertThat(lines[0]).startsWith("﻿\"Created\",\"Name\",\"Email\"");
        assertThat(lines[1]).contains("\"Leo Lim\"").contains("\"'=cmd|'/C calc'!A0\"").doesNotContain("Maria");
    }

    @Test
    void deletingAServiceKeepsItsLeads() throws Exception {
        long careId = jdbc.queryForObject("select id from services where slug = 'website-care'", Long.class);
        mvc.perform(delete("/api/v1/admin/services/" + careId).header("Authorization", auth)).andExpect(status().isNoContent());
        assertThat(jdbc.queryForObject("select service_id from leads where full_name = 'Leo Lim'", Long.class)).isNull();
    }

    @Test
    void overviewCountsLeads() throws Exception {
        long maria = id("Maria Santos");
        jdbc.update("update leads set follow_up_on = current_date - 3 where id = ?", maria);
        mvc.perform(get("/api/v1/admin/dashboard/summary").header("Authorization", auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalLeads").value(4))
                .andExpect(jsonPath("$.data.newThisMonth").value(Matchers.greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.won").value(1))
                .andExpect(jsonPath("$.data.lost").value(1))
                .andExpect(jsonPath("$.data.conversionRate").value(0.5))
                .andExpect(jsonPath("$.data.overdueFollowUps").value(1))
                .andExpect(jsonPath("$.data.overdue[0].fullName").value("Maria Santos"))
                .andExpect(jsonPath("$.data.byStatus.length()").value(6))
                .andExpect(jsonPath("$.data.bySource[?(@.key == 'direct')].count").value(Matchers.contains(2)))
                .andExpect(jsonPath("$.data.byService[?(@.key == 'none')].count").value(Matchers.contains(1)));
    }
}
