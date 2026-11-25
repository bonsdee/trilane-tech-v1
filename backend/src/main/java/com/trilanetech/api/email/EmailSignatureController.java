package com.trilanetech.api.email;

import com.trilanetech.api.common.ApiResponse;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The team's Gmail signature builder, for signed-in admins only (it lists the
 * team's phone numbers). The page is shown inside the dashboard; the images it
 * uses stay public at /email/ on the website, because Gmail recipients load them.
 */
@RestController
public class EmailSignatureController {

    private static final String PAGE = "email-signatures/signatures.html";

    private final String html;

    public EmailSignatureController() {
        try (var in = new ClassPathResource(PAGE).getInputStream()) {
            this.html = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not read " + PAGE, e);
        }
    }

    public record SignaturePage(String html) {}

    @GetMapping("/api/v1/admin/email-signatures")
    public ResponseEntity<ApiResponse<SignaturePage>> page() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(ApiResponse.of(new SignaturePage(html)));
    }
}
