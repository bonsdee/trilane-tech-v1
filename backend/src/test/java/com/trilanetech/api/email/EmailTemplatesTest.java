package com.trilanetech.api.email;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;

class EmailTemplatesTest {

    private final EmailTemplates templates = new EmailTemplates();

    @Test
    void valuesAreEscapedInTheHtmlVersion() {
        var rendered = templates.render("lead-acknowledgement",
                Map.of("name", "<b>Eve</b>", "service", "Landing Page", "message", "<script>x</script>\nline two"));
        assertThat(rendered.html()).doesNotContain("<script>").doesNotContain("<b>Eve</b>")
                .contains("&lt;script&gt;").contains("&lt;b&gt;Eve&lt;/b&gt;").contains("line two");
        assertThat(rendered.text()).contains("<b>Eve</b>");
    }

    @Test
    void everyTemplateRendersWithoutLeftoverPlaceholders() {
        Map<String, String> values = Map.of("name", "A", "link", "https://example.com", "validFor", "1 hour",
                "email", "a@example.com", "phone", "—", "company", "—", "website", "—", "service", "X",
                "message", "Hi", "source", "direct");
        for (String name : new String[] {"invite", "password-reset", "lead-notification", "lead-acknowledgement"}) {
            var rendered = templates.render(name, new java.util.HashMap<>(values) {{ put("dashboardLink", "https://x"); }});
            assertThat(rendered.html()).as(name).doesNotContain("{{");
            assertThat(rendered.text()).as(name).doesNotContain("{{");
        }
    }
}
