package com.trilanetech.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.after;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.trilanetech.api.user.User;
import jakarta.mail.internet.MimeMessage;
import jakarta.servlet.http.Cookie;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

class AuthIntegrationTest extends IntegrationTest {

    private static final String EMAIL = "admin@example.com";

    @Test
    void signInReturnsAccessTokenAndHttpOnlyRefreshCookie() throws Exception {
        createAdmin("Admin", EMAIL);
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", "ADMIN@example.com", "password", PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.expiresIn").value(900))
                .andExpect(jsonPath("$.data.user.email").value(EMAIL))
                .andExpect(jsonPath("$.data.user.passwordHash").doesNotExist())
                .andExpect(cookie().httpOnly("trilane_refresh", true))
                .andExpect(cookie().path("trilane_refresh", "/api/v1/auth"));
    }

    @Test
    void wrongPasswordAndUnknownEmailGetTheSameAnswer() throws Exception {
        createAdmin("Admin", EMAIL);
        MvcResult wrong = loginResult(EMAIL, "not-the-password");
        MvcResult unknown = loginResult("nobody@example.com", "not-the-password");
        assertThat(wrong.getResponse().getStatus()).isEqualTo(401);
        assertThat(unknown.getResponse().getStatus()).isEqualTo(401);
        assertThat(wrong.getResponse().getContentAsString()).isEqualTo(unknown.getResponse().getContentAsString());
    }

    @Test
    void fiveFailedAttemptsLockTheAccountForFifteenMinutes() throws Exception {
        createAdmin("Admin", EMAIL);
        for (int i = 0; i < 5; i++) {
            assertThat(loginResult(EMAIL, "wrong-password-" + i).getResponse().getStatus()).isEqualTo(401);
        }
        // Even the correct password is refused while locked, with the same generic message.
        MvcResult locked = loginResult(EMAIL, PASSWORD);
        assertThat(locked.getResponse().getStatus()).isEqualTo(401);
        assertThat(locked.getResponse().getContentAsString()).contains("INVALID_CREDENTIALS");
        User user = users.findByEmailIgnoreCase(EMAIL).orElseThrow();
        assertThat(user.getLockedUntil()).isNotNull();

        // Once the lock expires, the correct password works again.
        jdbc.update("update users set locked_until = now() - interval '1 minute' where id = ?", user.getId());
        assertThat(loginResult(EMAIL, PASSWORD).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void successfulSignInResetsTheFailureCounter() throws Exception {
        createAdmin("Admin", EMAIL);
        for (int i = 0; i < 4; i++) {
            loginResult(EMAIL, "wrong-password");
        }
        assertThat(loginResult(EMAIL, PASSWORD).getResponse().getStatus()).isEqualTo(200);
        loginResult(EMAIL, "wrong-password");
        assertThat(loginResult(EMAIL, PASSWORD).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void refreshRotatesTheCookieAndReusingAnOldOneEndsAllSessions() throws Exception {
        createAdmin("Admin", EMAIL);
        Cookie first = loginResult(EMAIL, PASSWORD).getResponse().getCookie("trilane_refresh");

        MvcResult refreshed = mvc.perform(post("/api/v1/auth/refresh").cookie(first))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.accessToken").isString()).andReturn();
        Cookie second = refreshed.getResponse().getCookie("trilane_refresh");
        assertThat(second.getValue()).isNotEqualTo(first.getValue());

        // The old cookie no longer works, and using it revokes the newer one too.
        mvc.perform(post("/api/v1/auth/refresh").cookie(first)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/refresh").cookie(second)).andExpect(status().isUnauthorized());
    }

    @Test
    void logoutRevokesTheSession() throws Exception {
        createAdmin("Admin", EMAIL);
        Cookie session = loginResult(EMAIL, PASSWORD).getResponse().getCookie("trilane_refresh");
        mvc.perform(post("/api/v1/auth/logout").cookie(session))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("trilane_refresh", 0));
        mvc.perform(post("/api/v1/auth/refresh").cookie(session)).andExpect(status().isUnauthorized());
    }

    @Test
    void forgotPasswordNeverRevealsWhetherAnAccountExists() throws Exception {
        createAdmin("Admin", EMAIL);
        String known = mvc.perform(post("/api/v1/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("email", EMAIL)))).andExpect(status().isOk()).andReturn()
                .getResponse().getContentAsString();
        String unknown = mvc.perform(post("/api/v1/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("email", "nobody@example.com")))).andExpect(status().isOk()).andReturn()
                .getResponse().getContentAsString();
        assertThat(known).isEqualTo(unknown);
        // Exactly one email: the reset link for the real account.
        verify(mailSender, timeout(5000).times(1)).send(any(MimeMessage.class));
    }

    @Test
    void resetLinkSetsANewPasswordOnceAndEndsOldSessions() throws Exception {
        createAdmin("Admin", EMAIL);
        Cookie oldSession = loginResult(EMAIL, PASSWORD).getResponse().getCookie("trilane_refresh");
        mvc.perform(post("/api/v1/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("email", EMAIL)))).andExpect(status().isOk());
        String token = tokenFromLastEmail();

        mvc.perform(post("/api/v1/auth/set-password").contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("token", token, "password", "short"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fields.password").exists());
        mvc.perform(post("/api/v1/auth/set-password").contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("token", token, "password", "A-brand-new-password")))).andExpect(status().isOk());
        // Single use.
        mvc.perform(post("/api/v1/auth/set-password").contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("token", token, "password", "Another-new-password"))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("INVALID_TOKEN"));

        assertThat(loginResult(EMAIL, "A-brand-new-password").getResponse().getStatus()).isEqualTo(200);
        assertThat(loginResult(EMAIL, PASSWORD).getResponse().getStatus()).isEqualTo(401);
        mvc.perform(post("/api/v1/auth/refresh").cookie(oldSession)).andExpect(status().isUnauthorized());
    }

    @Test
    void expiredLinksAreRefused() throws Exception {
        createAdmin("Admin", EMAIL);
        mvc.perform(post("/api/v1/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("email", EMAIL)))).andExpect(status().isOk());
        String token = tokenFromLastEmail();
        jdbc.update("update password_tokens set expires_at = now() - interval '1 second'");
        mvc.perform(post("/api/v1/auth/set-password").contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("token", token, "password", "A-brand-new-password"))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error.code").value("INVALID_TOKEN"));
    }

    @Test
    void invitedUserSetsAPasswordThenSignsIn() throws Exception {
        createAdmin("Admin", EMAIL);
        String adminToken = token(EMAIL);
        mvc.perform(post("/api/v1/admin/users").header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("fullName", "New Person", "email", "new@example.com"))))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.status").value("INVITED"));
        // Cannot sign in before accepting the invite.
        assertThat(loginResult("new@example.com", "anything-at-all").getResponse().getStatus()).isEqualTo(401);

        String invite = tokenFromLastEmail();
        mvc.perform(post("/api/v1/auth/set-password").contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("token", invite, "password", "Welcome-aboard-1")))).andExpect(status().isOk());
        assertThat(loginResult("new@example.com", "Welcome-aboard-1").getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void inviteLinksLast72HoursAndResetLinksOneHour() throws Exception {
        createAdmin("Admin", EMAIL);
        mvc.perform(post("/api/v1/admin/users").header("Authorization", bearer(token(EMAIL)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("fullName", "New Person", "email", "new@example.com"))));
        mvc.perform(post("/api/v1/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("email", EMAIL))));
        Double inviteHours = jdbc.queryForObject("select extract(epoch from expires_at - created_at) / 3600 "
                + "from password_tokens where purpose = 'INVITE'", Double.class);
        Double resetHours = jdbc.queryForObject("select extract(epoch from expires_at - created_at) / 3600 "
                + "from password_tokens where purpose = 'RESET'", Double.class);
        assertThat(inviteHours).isBetween(71.9, 72.1);
        assertThat(resetHours).isBetween(0.9, 1.1);
        // Only the hash is stored, never the token itself.
        assertThat(jdbc.queryForObject("select count(*) from password_tokens where length(token_hash) = 64",
                Integer.class)).isEqualTo(2);
    }

    @Test
    void deactivatedUserIsSignedOutImmediately() throws Exception {
        createAdmin("Admin", EMAIL);
        User other = createAdmin("Other", "other@example.com");
        String otherToken = token("other@example.com");
        mvc.perform(get("/api/v1/auth/me").header("Authorization", bearer(otherToken))).andExpect(status().isOk());

        mvc.perform(patch("/api/v1/admin/users/" + other.getId()).header("Authorization", bearer(token(EMAIL)))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"active\":false}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("DEACTIVATED"));

        // The still-unexpired access token stops working at once.
        mvc.perform(get("/api/v1/admin/leads").header("Authorization", bearer(otherToken)))
                .andExpect(status().isUnauthorized());
        assertThat(loginResult("other@example.com", PASSWORD).getResponse().getStatus()).isEqualTo(401);
    }

    @Test
    void noEmailIsSentForUnknownAddresses() throws Exception {
        mvc.perform(post("/api/v1/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("email", "nobody@example.com")))).andExpect(status().isOk());
        verify(mailSender, after(500).never()).send(any(MimeMessage.class));
    }

    private String tokenFromLastEmail() throws Exception {
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, timeout(5000).atLeastOnce()).send(captor.capture());
        MimeMessage message = captor.getValue();
        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
        message.writeTo(out);
        String raw = out.toString(java.nio.charset.StandardCharsets.UTF_8).replace("=\r\n", "").replace("=3D", "=");
        Matcher m = Pattern.compile("token=([A-Za-z0-9_-]{43})").matcher(raw);
        assertThat(m.find()).as("email contains a token link").isTrue();
        return m.group(1);
    }
}
