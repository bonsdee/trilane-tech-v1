package com.trilanetech.api.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class RateLimiterTest {

    static class MovableClock extends Clock {
        Instant now = Instant.parse("2026-11-17T00:00:00Z");
        @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }

    @Test
    void allowsFivePerHourPerAddress() {
        MovableClock clock = new MovableClock();
        RateLimiter limiter = new RateLimiter(5, Duration.ofHours(1), clock);
        for (int i = 0; i < 5; i++) {
            assertThat(limiter.tryAcquire("1.2.3.4")).isTrue();
        }
        assertThat(limiter.tryAcquire("1.2.3.4")).isFalse();
        assertThat(limiter.tryAcquire("5.6.7.8")).isTrue();

        clock.now = clock.now.plus(Duration.ofMinutes(61));
        assertThat(limiter.tryAcquire("1.2.3.4")).isTrue();
    }
}
