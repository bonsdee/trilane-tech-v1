package com.trilanetech.api.email;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

/**
 * Fills {{placeholders}} in the email templates under resources/templates/email.
 * Values are HTML-escaped in the HTML version, so text typed into the contact
 * form cannot inject markup into the team's inbox.
 */
@Component
public class EmailTemplates {

    private static final Pattern PLACEHOLDER = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_]+)\\s*}}");
    private final Map<String, String> cache = new ConcurrentHashMap<>();

    public record Rendered(String text, String html) {}

    public Rendered render(String name, Map<String, String> values) {
        String text = fill(load("templates/email/" + name + ".txt"), values, false);
        String html = fill(load("templates/email/" + name + ".html"), values, true);
        return new Rendered(text, html);
    }

    private String fill(String template, Map<String, String> values, boolean html) {
        Matcher matcher = PLACEHOLDER.matcher(template);
        StringBuilder out = new StringBuilder();
        while (matcher.find()) {
            String value = values.getOrDefault(matcher.group(1), "");
            if (value == null) {
                value = "";
            }
            if (html) {
                value = HtmlUtils.htmlEscape(value).replace("\n", "<br>");
            }
            matcher.appendReplacement(out, Matcher.quoteReplacement(value));
        }
        matcher.appendTail(out);
        return out.toString();
    }

    private String load(String path) {
        return cache.computeIfAbsent(path, p -> {
            try (InputStream in = new ClassPathResource(p).getInputStream()) {
                return new String(in.readAllBytes(), StandardCharsets.UTF_8);
            } catch (IOException e) {
                throw new UncheckedIOException("Missing email template " + p, e);
            }
        });
    }
}
