package com.trilanetech.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.after;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.mail.Address;
import jakarta.mail.Message;
import jakarta.mail.internet.MimeMessage;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.mail.MailSendException;
import org.springframework.test.web.servlet.ResultActions;

class LeadSubmissionIntegrationTest extends IntegrationTest {

    static Map<String, Object> validLead() {
        Map<String, Object> lead = new HashMap<>();
        lead.put("fullName", "Maria Santos");
        lead.put("email", "Maria@Example.com");
        lead.put("phone", "+63 917 123 4567");
        lead.put("company", "Santos Bakery");
        lead.put("websiteUrl", "santosbakery.ph");
        lead.put("serviceSlug", "launch-bundle");
        lead.put("message", "We need a website and help answering inquiries.");
        lead.put("sourcePage", "/services");
        lead.put("sourceCta", "services-launch-bundle");
        lead.put("referrer", "https://www.google.com/search?q=web+design");
        lead.put("utmSource", "");
        lead.put("utmMedium", "");
        lead.put("utmCampaign", "");
        return lead;
    }

    ResultActions submit(Map<String, Object> body) throws Exception {
        return mvc.perform(post("/api/v1/public/leads").contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    @Test
    void validSubmissionIsStoredWithItsSource() throws Exception {
        submit(validLead()).andExpect(status().isCreated()).andExpect(jsonPath("$.data.received").value(true));
        Map<String, Object> row = jdbc.queryForMap("select l.*, s.slug from leads l join services s on s.id = l.service_id");
        assertThat(row.get("email")).isEqualTo("maria@example.com");
        assertThat(row.get("status")).isEqualTo("NEW");
        assertThat(row.get("slug")).isEqualTo("launch-bundle");
        assertThat(row.get("source_page")).isEqualTo("/services");
        assertThat(row.get("source_cta")).isEqualTo("services-launch-bundle");
        assertThat(row.get("referrer")).isEqualTo("https://www.google.com/search?q=web+design");
        assertThat(row.get("utm_source")).isNull();
    }

    @Test
    void teamIsNotifiedAndTheLeadGetsAnAcknowledgement() throws Exception {
        submit(validLead()).andExpect(status().isCreated());
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, timeout(5000).times(2)).send(captor.capture());
        List<MimeMessage> sent = captor.getAllValues();

        MimeMessage team = sent.stream().filter(m -> to(m).contains("team@example.com")).findFirst().orElseThrow();
        assertThat(team.getSubject()).isEqualTo("New lead: Maria Santos (Launch Bundle)");
        assertThat(Arrays.toString(team.getReplyTo())).contains("maria@example.com");

        MimeMessage ack = sent.stream().filter(m -> to(m).contains("maria@example.com")).findFirst().orElseThrow();
        assertThat(ack.getSubject()).isEqualTo("Thanks for contacting Trilane Tech");
        assertThat(Arrays.toString(ack.getReplyTo())).contains("team@example.com");
    }

    @Test
    void leadIsKeptWhenEmailDeliveryFails() throws Exception {
        doThrow(new MailSendException("SMTP server unavailable")).when(mailSender).send(any(MimeMessage.class));
        submit(validLead()).andExpect(status().isCreated());
        verify(mailSender, timeout(5000).times(2)).send(any(MimeMessage.class));
        assertThat(jdbc.queryForObject("select count(*) from leads", Integer.class)).isEqualTo(1);
    }

    @Test
    void invalidFieldsAreReportedOneByOne() throws Exception {
        Map<String, Object> lead = validLead();
        lead.put("fullName", " ");
        lead.put("email", "not-an-email");
        lead.put("phone", "call me maybe");
        lead.put("websiteUrl", "no website");
        lead.put("message", "short");
        submit(lead).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.fields.fullName").exists())
                .andExpect(jsonPath("$.error.fields.email").exists())
                .andExpect(jsonPath("$.error.fields.phone").exists())
                .andExpect(jsonPath("$.error.fields.websiteUrl").exists())
                .andExpect(jsonPath("$.error.fields.message").exists());
        assertThat(jdbc.queryForObject("select count(*) from leads", Integer.class)).isZero();
    }

    @Test
    void overlongFieldsAreRejected() throws Exception {
        Map<String, Object> lead = validLead();
        lead.put("fullName", "x".repeat(121));
        lead.put("message", "y".repeat(5001));
        submit(lead).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fields.fullName").exists())
                .andExpect(jsonPath("$.error.fields.message").exists());
    }

    @Test
    void longTrackingValuesAreTrimmedNotRejected() throws Exception {
        Map<String, Object> lead = validLead();
        lead.put("utmCampaign", "c".repeat(500));
        lead.put("referrer", "https://example.com/" + "r".repeat(900));
        submit(lead).andExpect(status().isCreated());
        assertThat(jdbc.queryForObject("select length(utm_campaign) from leads", Integer.class)).isEqualTo(120);
        assertThat(jdbc.queryForObject("select length(referrer) from leads", Integer.class)).isEqualTo(500);
    }

    @Test
    void unknownServiceIsRejected() throws Exception {
        Map<String, Object> lead = validLead();
        lead.put("serviceSlug", "does-not-exist");
        submit(lead).andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.fields.serviceSlug").exists());
    }

    @Test
    void serviceIsOptional() throws Exception {
        Map<String, Object> lead = validLead();
        lead.remove("serviceSlug");
        submit(lead).andExpect(status().isCreated());
        assertThat(jdbc.queryForObject("select service_id from leads", Long.class)).isNull();
    }

    @Test
    void spamTrapSubmissionsLookSuccessfulButAreNotStored() throws Exception {
        Map<String, Object> lead = validLead();
        lead.put("nickname", "I am a bot");
        submit(lead).andExpect(status().isCreated()).andExpect(jsonPath("$.data.received").value(true));
        assertThat(jdbc.queryForObject("select count(*) from leads", Integer.class)).isZero();
        verify(mailSender, after(500).never()).send(any(MimeMessage.class));
    }

    @Test
    void sixthSubmissionFromOneAddressWithinAnHourIsRefused() throws Exception {
        for (int i = 0; i < 5; i++) {
            submit(validLead()).andExpect(status().isCreated());
        }
        submit(validLead()).andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("RATE_LIMITED"));
        assertThat(jdbc.queryForObject("select count(*) from leads", Integer.class)).isEqualTo(5);
    }

    @Test
    void htmlInTheMessageIsEscapedInTheTeamEmail() throws Exception {
        Map<String, Object> lead = validLead();
        lead.put("message", "<script>alert('x')</script> please call me back");
        submit(lead).andExpect(status().isCreated());
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, timeout(5000).times(2)).send(captor.capture());
        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
        captor.getAllValues().getFirst().writeTo(out);
        String raw = out.toString(java.nio.charset.StandardCharsets.UTF_8).replace("=\r\n", "");
        // The HTML part carries the escaped text (the plain-text part shows it literally, which is safe).
        assertThat(raw).contains("&lt;script&gt;");
    }

    private static String to(Message message) {
        try {
            Address[] recipients = message.getRecipients(Message.RecipientType.TO);
            return Arrays.toString(recipients);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
