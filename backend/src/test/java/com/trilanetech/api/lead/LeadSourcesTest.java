package com.trilanetech.api.lead;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class LeadSourcesTest {

    @Test
    void utmSourceWinsOverReferrer() {
        assertThat(LeadSources.of("Facebook ", "https://www.google.com/")).isEqualTo("facebook");
    }

    @Test
    void referrerDomainIsUsedWithoutWww() {
        assertThat(LeadSources.of(null, "https://www.Google.com/search?q=x")).isEqualTo("google.com");
        assertThat(LeadSources.of("", "http://news.example.org:8080/a")).isEqualTo("news.example.org");
    }

    @Test
    void anythingElseIsDirect() {
        assertThat(LeadSources.of(null, null)).isEqualTo("direct");
        assertThat(LeadSources.of(" ", "android-app://com.example")).isEqualTo("direct");
    }
}
