package com.trilanetech.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

class ContentIntegrationTest extends IntegrationTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D, 'I', 'H', 'D', 'R'};
    private String auth;

    @BeforeEach
    void signIn() throws Exception {
        createAdmin("Admin", "admin@example.com");
        auth = bearer(token("admin@example.com"));
    }

    @Test
    void seededServicesAreGroupedWithPricesAndItems() throws Exception {
        mvc.perform(get("/api/v1/public/services"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].category").value("ONE_TIME"))
                .andExpect(jsonPath("$.data[0].services.length()").value(3))
                .andExpect(jsonPath("$.data[1].services.length()").value(3))
                .andExpect(jsonPath("$.data[2].services.length()").value(2))
                .andExpect(jsonPath("$.data[0].services[0].name").value("Foundation Website"))
                .andExpect(jsonPath("$.data[0].services[0].price").value(2800.0))
                .andExpect(jsonPath("$.data[2].services[0].regularPrice").value(4600.0))
                .andExpect(jsonPath("$.data[1].services[1].hours").value(10));
    }

    @Test
    void unpublishedServicesAreHiddenFromThePublic() throws Exception {
        jdbc.update("update services set published = false where slug = 'landing-page'");
        mvc.perform(get("/api/v1/public/services")).andExpect(jsonPath("$.data[0].services.length()").value(2));
        mvc.perform(get("/api/v1/admin/services").header("Authorization", auth)).andExpect(jsonPath("$.data.length()").value(8));
    }

    @Test
    void pilotOfferDisappearsWhenSpotsRunOutOrItIsSwitchedOff() throws Exception {
        // Held back from the public site by default; switching it on shows it.
        mvc.perform(get("/api/v1/public/site")).andExpect(jsonPath("$.data.pilot.active").value(false))
                .andExpect(jsonPath("$.data.pilot.price").doesNotExist());
        mvc.perform(put("/api/v1/admin/settings/pilot").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":true,\"price\":2900,\"spotsRemaining\":5}")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/public/site"))
                .andExpect(jsonPath("$.data.pilot.active").value(true))
                .andExpect(jsonPath("$.data.pilot.price").value(2900.0))
                .andExpect(jsonPath("$.data.pilot.regularPrice").value(3600.0))
                .andExpect(jsonPath("$.data.pilot.spotsRemaining").value(5));
        mvc.perform(put("/api/v1/admin/settings/pilot").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":true,\"price\":2900,\"spotsRemaining\":0}")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/public/site")).andExpect(jsonPath("$.data.pilot.active").value(false))
                .andExpect(jsonPath("$.data.pilot.price").doesNotExist());
        mvc.perform(put("/api/v1/admin/settings/pilot").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":false,\"price\":2900,\"spotsRemaining\":3}")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/public/site")).andExpect(jsonPath("$.data.pilot.active").value(false));
        mvc.perform(put("/api/v1/admin/settings/pilot").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":true,\"price\":-5,\"spotsRemaining\":-1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fields.price").exists())
                .andExpect(jsonPath("$.error.fields.spotsRemaining").exists());
    }

    @Test
    void serviceSlugsMustBeUniqueAndWellFormed() throws Exception {
        Map<String, Object> body = Map.of("slug", "landing-page", "name", "Copy", "category", "ONE_TIME",
                "price", 10, "billingPeriod", "ONCE");
        mvc.perform(post("/api/v1/admin/services").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content(toJson(body))).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.fields.slug").exists());
        mvc.perform(post("/api/v1/admin/services").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("slug", "Not A Slug", "name", "X", "category", "NOPE", "price", 1, "billingPeriod", "ONCE"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fields.category").exists());
    }

    @Test
    void serviceItemsAreReplacedOnUpdate() throws Exception {
        long id = jdbc.queryForObject("select id from services where slug = 'landing-page'", Long.class);
        Map<String, Object> body = Map.of("slug", "landing-page", "name", "Landing Page", "category", "ONE_TIME",
                "price", 1250, "billingPeriod", "ONCE", "published", true,
                "items", List.of(Map.of("kind", "INCLUDED", "text", "One page"), Map.of("kind", "NOT_INCLUDED", "text", "Copywriting")));
        mvc.perform(put("/api/v1/admin/services/" + id).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.price").value(1250.0))
                .andExpect(jsonPath("$.data.items.length()").value(2))
                .andExpect(jsonPath("$.data.items[1].kind").value("NOT_INCLUDED"));
        assertThat(jdbc.queryForObject("select count(*) from service_items where service_id = ?", Integer.class, id)).isEqualTo(2);
    }

    @Test
    void portfolioStaysHiddenUntilAProjectIsPublished() throws Exception {
        mvc.perform(get("/api/v1/public/site")).andExpect(jsonPath("$.data.portfolioVisible").value(false));
        String created = mvc.perform(post("/api/v1/admin/portfolio").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"sample\",\"title\":\"Sample\",\"published\":false}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(created, "$.data.id");
        mvc.perform(get("/api/v1/public/portfolio/sample")).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/public/site")).andExpect(jsonPath("$.data.portfolioVisible").value(false));

        mvc.perform(put("/api/v1/admin/portfolio/" + id).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"slug\":\"sample\",\"title\":\"Sample\",\"published\":true}")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/public/site")).andExpect(jsonPath("$.data.portfolioVisible").value(true));
        mvc.perform(get("/api/v1/public/portfolio/sample")).andExpect(status().isOk()).andExpect(jsonPath("$.data.title").value("Sample"));
    }

    @Test
    void portfolioProjectUrlMustBeAWebAddress() throws Exception {
        mvc.perform(post("/api/v1/admin/portfolio").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"x\",\"title\":\"X\",\"projectUrl\":\"javascript:alert(1)\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.fields.projectUrl").exists());
    }

    @Test
    void imagesAreCheckedByContentStoredAndServed() throws Exception {
        String uploaded = mvc.perform(multipart("/api/v1/admin/files").file(new MockMultipartFile("file", "logo.png", "image/png", PNG))
                        .header("Authorization", auth))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.contentType").value("image/png"))
                .andReturn().getResponse().getContentAsString();
        String url = JsonPath.read(uploaded, "$.data.url");
        mvc.perform(get(url)).andExpect(status().isOk()).andExpect(content().contentType("image/png")).andExpect(content().bytes(PNG));
        String key = jdbc.queryForObject("select storage_key from stored_files", String.class);
        assertThat(key).matches("[a-f0-9-]{36}\\.png");

        // A script renamed to .png is refused.
        mvc.perform(multipart("/api/v1/admin/files").file(new MockMultipartFile("file", "evil.png", "image/png", "<svg onload=alert(1)>".getBytes()))
                        .header("Authorization", auth))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.fields.file").exists());
    }

    @Test
    void teamPhotoMustReferenceAnExistingImage() throws Exception {
        long id = jdbc.queryForObject("select id from team_members order by id limit 1", Long.class);
        mvc.perform(put("/api/v1/admin/team/" + id).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Jivonz\",\"photoFileId\":424242}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.fields.photoFileId").exists());
    }

    @Test
    void faqsCanBeHidden() throws Exception {
        mvc.perform(get("/api/v1/public/faqs")).andExpect(jsonPath("$.data.length()").value(14));
        mvc.perform(post("/api/v1/admin/faqs").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"question\":\"Hidden?\",\"answer\":\"Yes.\",\"published\":false}")).andExpect(status().isCreated());
        mvc.perform(get("/api/v1/public/faqs")).andExpect(jsonPath("$.data.length()").value(14));
        mvc.perform(get("/api/v1/admin/faqs").header("Authorization", auth)).andExpect(jsonPath("$.data.length()").value(16));
    }

    @Test
    void everyAppTableHasRowLevelSecurityOn() {
        // V6: Supabase's Data API must not be able to read our tables. Flyway's own
        // history table is switched on by hand (see V6), so it is not checked here.
        List<String> unprotected = jdbc.queryForList(
                "SELECT tablename FROM pg_tables WHERE schemaname = 'public' "
                        + "AND tablename <> 'flyway_schema_history' AND NOT rowsecurity",
                String.class);
        assertThat(unprotected).isEmpty();
    }

    @Test
    void revisionsOnePointOneContentIsSeeded() throws Exception {
        mvc.perform(get("/api/v1/public/services"))
                .andExpect(jsonPath("$.data[0].services[0].slug").value("foundation-website"))
                .andExpect(jsonPath("$.data[0].services[0].timeline").value("10–14 business days after we receive all content"))
                .andExpect(jsonPath("$.data[0].services[1].items[?(@.kind == 'NOT_INCLUDED')].text").value(org.hamcrest.Matchers.hasItem("Ad campaign setup")))
                .andExpect(jsonPath("$.data[0].services[2].items[?(@.kind == 'NOT_INCLUDED')].text").value(org.hamcrest.Matchers.hasItem("Moving to a new host")));
        mvc.perform(get("/api/v1/public/faqs"))
                .andExpect(jsonPath("$.data[?(@.question == 'What are your payment terms?')]").exists())
                .andExpect(jsonPath("$.data[?(@.question == 'Can I cancel a retainer?')]").exists())
                .andExpect(jsonPath("$.data[-1].question").value("What currency are your prices in?"));
    }

    @Test
    void pilotFaqIsHiddenAndLocationFaqComesFirst() throws Exception {
        mvc.perform(get("/api/v1/public/faqs"))
                .andExpect(jsonPath("$.data[0].question").value("Where are you based, and when can we reach you?"))
                .andExpect(jsonPath("$.data[?(@.question == 'What is the pilot price?')]").isEmpty());
    }

    @Test
    void bookingLinkIsOptionalAndMustBeHttps() throws Exception {
        mvc.perform(get("/api/v1/public/site")).andExpect(jsonPath("$.data.bookingUrl").doesNotExist());
        mvc.perform(put("/api/v1/admin/settings/booking").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"http://example.com/book\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.fields.url").exists());
        mvc.perform(put("/api/v1/admin/settings/booking").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"javascript:alert(1)\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/v1/admin/settings/booking").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"url\":\"  https://calendar.app.google/abc123  \"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.url").value("https://calendar.app.google/abc123"));
        mvc.perform(get("/api/v1/public/site")).andExpect(jsonPath("$.data.bookingUrl").value("https://calendar.app.google/abc123"));
        mvc.perform(put("/api/v1/admin/settings/booking").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"url\":\"\"}")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/public/site")).andExpect(jsonPath("$.data.bookingUrl").doesNotExist());
    }

    @Test
    void conceptProjectsAreMarked() throws Exception {
        mvc.perform(post("/api/v1/admin/portfolio").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"concept-cafe\",\"title\":\"Cafe site\",\"published\":true,\"concept\":true}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.concept").value(true));
        mvc.perform(get("/api/v1/public/portfolio")).andExpect(jsonPath("$.data[0].concept").value(true));
        mvc.perform(get("/api/v1/public/portfolio/concept-cafe")).andExpect(jsonPath("$.data.concept").value(true));
    }
}
