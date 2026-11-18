package com.trilanetech.api.common;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Sliding-window limiter for contact form submissions, keyed by client address.
 * It lives in this application's memory, which is correct for one backend
 * instance; several instances would need a shared store.
 */
@Component
public class RateLimiter {

    private final Map<String, Deque<Instant>> hits = new ConcurrentHashMap<>();
    private final int limit;
    private final Duration window;
    private final Clock clock;

    @org.springframework.beans.factory.annotation.Autowired
    public RateLimiter(AppProperties props) {
        this(props.rateLimit().leadSubmissions(), Duration.ofMinutes(props.rateLimit().windowMinutes()),
                Clock.systemUTC());
    }

    RateLimiter(int limit, Duration window, Clock clock) {
        this.limit = limit;
        this.window = window;
        this.clock = clock;
    }

    /** Records one attempt and returns false if the key is over its limit. */
    public boolean tryAcquire(String key) {
        Instant now = clock.instant();
        Deque<Instant> queue = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (queue) {
            prune(queue, now);
            if (queue.size() >= limit) {
                return false;
            }
            queue.addLast(now);
            return true;
        }
    }

    /** Clears all counters. Used by tests. */
    public void reset() {
        hits.clear();
    }

    @Scheduled(fixedDelay = 600_000)
    void cleanUp() {
        Instant now = clock.instant();
        hits.entrySet().removeIf(entry -> {
            Deque<Instant> queue = entry.getValue();
            synchronized (queue) {
                prune(queue, now);
                return queue.isEmpty();
            }
        });
    }

    private void prune(Deque<Instant> queue, Instant now) {
        Instant cutoff = now.minus(window);
        while (!queue.isEmpty() && !queue.peekFirst().isAfter(cutoff)) {
            queue.pollFirst();
        }
    }
}
