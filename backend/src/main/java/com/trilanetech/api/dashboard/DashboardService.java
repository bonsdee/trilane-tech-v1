package com.trilanetech.api.dashboard;

import com.trilanetech.api.common.AppProperties;
import com.trilanetech.api.lead.LeadSources;
import com.trilanetech.api.lead.LeadStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Numbers for the dashboard overview screen. */
@Service
public class DashboardService {

    private final NamedParameterJdbcTemplate jdbc;
    private final ZoneId zone;

    public DashboardService(NamedParameterJdbcTemplate jdbc, AppProperties props) {
        this.jdbc = jdbc;
        this.zone = ZoneId.of(props.timezone());
    }

    public record Count(String key, String label, long count) {}

    public record OverdueLead(Long id, String fullName, String status, LocalDate followUpOn, String assignedToName) {}

    public record Summary(long totalLeads, long newThisWeek, long newThisMonth, List<Count> byStatus,
                          List<Count> bySource, List<Count> byService, long overdueFollowUps,
                          List<OverdueLead> overdue, long won, long lost, BigDecimal conversionRate,
                          LocalDate weekStart, LocalDate monthStart) {}

    @Transactional(readOnly = true)
    public Summary summary() {
        LocalDate today = LocalDate.now(zone);
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate monthStart = today.withDayOfMonth(1);
        var params = new MapSqlParameterSource()
                .addValue("weekStart", Timestamp.from(weekStart.atStartOfDay(zone).toInstant()))
                .addValue("monthStart", Timestamp.from(monthStart.atStartOfDay(zone).toInstant()))
                .addValue("today", today);

        Map<String, Object> totals = jdbc.queryForMap("""
                SELECT count(*) AS total,
                       count(*) FILTER (WHERE created_at >= :weekStart) AS week,
                       count(*) FILTER (WHERE created_at >= :monthStart) AS month,
                       count(*) FILTER (WHERE status = 'WON') AS won,
                       count(*) FILTER (WHERE status = 'LOST') AS lost,
                       count(*) FILTER (WHERE follow_up_on < :today AND status NOT IN ('WON', 'LOST')) AS overdue
                FROM leads
                """, params);

        Map<String, Long> statusCounts = new LinkedHashMap<>();
        jdbc.query("SELECT status, count(*) AS n FROM leads GROUP BY status", rs -> {
            statusCounts.put(rs.getString("status"), rs.getLong("n"));
        });
        List<Count> byStatus = new ArrayList<>();
        for (LeadStatus status : LeadStatus.values()) {
            byStatus.add(new Count(status.name(), status.label(), statusCounts.getOrDefault(status.name(), 0L)));
        }

        List<Count> bySource = jdbc.query("SELECT " + LeadSources.SQL_EXPRESSION + " AS source, count(*) AS n "
                        + "FROM leads GROUP BY 1 ORDER BY n DESC, source ASC LIMIT 10",
                (rs, i) -> new Count(rs.getString("source"), rs.getString("source"), rs.getLong("n")));

        List<Count> byService = jdbc.query("""
                SELECT coalesce(s.id::text, 'none') AS key, coalesce(s.name, 'Not specified') AS label, count(*) AS n
                FROM leads l LEFT JOIN services s ON s.id = l.service_id
                GROUP BY 1, 2 ORDER BY n DESC, label ASC
                """, (rs, i) -> new Count(rs.getString("key"), rs.getString("label"), rs.getLong("n")));

        List<OverdueLead> overdue = jdbc.query("""
                SELECT l.id, l.full_name, l.status, l.follow_up_on, u.full_name AS assignee
                FROM leads l LEFT JOIN users u ON u.id = l.assigned_to
                WHERE l.follow_up_on < :today AND l.status NOT IN ('WON', 'LOST')
                ORDER BY l.follow_up_on ASC, l.id ASC LIMIT 5
                """, params, (rs, i) -> new OverdueLead(rs.getLong("id"), rs.getString("full_name"),
                LeadStatus.valueOf(rs.getString("status")).label(), rs.getObject("follow_up_on", LocalDate.class),
                rs.getString("assignee")));

        long won = ((Number) totals.get("won")).longValue();
        long lost = ((Number) totals.get("lost")).longValue();
        BigDecimal rate = won + lost == 0 ? null
                : BigDecimal.valueOf(won).divide(BigDecimal.valueOf(won + lost), 4, RoundingMode.HALF_UP);

        return new Summary(((Number) totals.get("total")).longValue(), ((Number) totals.get("week")).longValue(),
                ((Number) totals.get("month")).longValue(), byStatus, bySource, byService,
                ((Number) totals.get("overdue")).longValue(), overdue, won, lost, rate, weekStart, monthStart);
    }
}
