package com.trilanetech.api;

import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.trilanetech.api.common.RateLimiter;
import com.trilanetech.api.user.Role;
import com.trilanetech.api.user.User;
import com.trilanetech.api.user.UserRepository;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.ObjectMapper;

/**
 * Base class for tests that run the whole application against the real
 * PostgreSQL test database. Each test starts from a freshly migrated schema
 * with the seed content. Email is captured by a mock instead of being sent.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class IntegrationTest {

    protected static final String PASSWORD = "Correct-Horse-42";

    @Autowired protected MockMvc mvc;
    @Autowired protected ObjectMapper json;
    @Autowired protected UserRepository users;
    @Autowired protected PasswordEncoder encoder;
    @Autowired protected JdbcTemplate jdbc;
    @Autowired protected RateLimiter rateLimiter;
    @Autowired private Flyway flyway;

    @MockitoBean protected JavaMailSender mailSender;
    @Autowired private ThreadPoolTaskExecutor applicationTaskExecutor;

    /** Lets background email work from this test finish before the next test resets the mocks. */
    @AfterEach
    void waitForBackgroundWork() throws InterruptedException {
        long deadline = System.currentTimeMillis() + 5000;
        while (System.currentTimeMillis() < deadline && (applicationTaskExecutor.getActiveCount() > 0
                || applicationTaskExecutor.getThreadPoolExecutor().getQueue().size() > 0)) {
            Thread.sleep(20);
        }
    }

    @BeforeEach
    void resetState() {
        flyway.clean();
        flyway.migrate();
        rateLimiter.reset();
        reset(mailSender);
        when(mailSender.createMimeMessage()).thenAnswer(i -> new MimeMessage(Session.getInstance(new Properties())));
    }

    protected User createAdmin(String name, String email) {
        User user = new User(name, email, Role.ADMIN);
        user.setPasswordHash(encoder.encode(PASSWORD));
        return users.save(user);
    }

    protected String toJson(Object body) {
        return json.writeValueAsString(body);
    }

    protected MvcResult loginResult(String email, String password) throws Exception {
        return mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(toJson(java.util.Map.of("email", email, "password", password)))).andReturn();
    }

    /** Signs in and returns the access token. */
    protected String token(String email) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(java.util.Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.data.accessToken");
    }

    protected String bearer(String token) {
        return "Bearer " + token;
    }
}
