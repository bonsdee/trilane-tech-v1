package com.trilanetech.api.lead;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/** Writes leads as CSV that opens safely in Excel, Numbers and Google Sheets. */
public final class LeadCsv {

    private static final String[] HEADER = {
            "Created", "Name", "Email", "Phone", "Company", "Website", "Service", "Status", "Assigned to",
            "Follow-up", "Source", "Source page", "Button", "Referrer", "UTM source", "UTM medium", "UTM campaign",
            "Message"};
    private static final DateTimeFormatter CREATED = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private LeadCsv() {}

    public static String write(List<Lead> leads, ZoneId zone) {
        StringBuilder out = new StringBuilder("﻿"); // byte order mark so Excel reads UTF-8
        row(out, HEADER);
        for (Lead l : leads) {
            row(out,
                    CREATED.format(l.getCreatedAt().atZone(zone)),
                    l.getFullName(),
                    l.getEmail(),
                    l.getPhone(),
                    l.getCompany(),
                    l.getWebsiteUrl(),
                    l.getService() == null ? "" : l.getService().getName(),
                    l.getStatus().label(),
                    l.getAssignedTo() == null ? "" : l.getAssignedTo().getFullName(),
                    l.getFollowUpOn() == null ? "" : l.getFollowUpOn().toString(),
                    LeadSources.of(l.getUtmSource(), l.getReferrer()),
                    l.getSourcePage(),
                    l.getSourceCta(),
                    l.getReferrer(),
                    l.getUtmSource(),
                    l.getUtmMedium(),
                    l.getUtmCampaign(),
                    l.getMessage());
        }
        return out.toString();
    }

    private static void row(StringBuilder out, String... values) {
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                out.append(',');
            }
            out.append(cell(values[i]));
        }
        out.append("\r\n");
    }

    /**
     * Quotes every cell, and neutralises values starting with a formula
     * character so a spreadsheet shows them as text instead of running them.
     */
    static String cell(String value) {
        if (value == null) {
            return "\"\"";
        }
        String v = value;
        if (!v.isEmpty() && "=+-@\t\r".indexOf(v.charAt(0)) >= 0) {
            v = "'" + v;
        }
        return "\"" + v.replace("\"", "\"\"") + "\"";
    }
}
