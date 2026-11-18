package com.trilanetech.api.lead;

import java.time.Instant;

/**
 * Published after a lead is saved. The email listener is the first subscriber;
 * a CRM sync (for example GoHighLevel) can subscribe the same way later.
 * Carries a snapshot so listeners need no database access.
 */
public record LeadCreatedEvent(Long leadId, String fullName, String email, String phone, String company,
                               String websiteUrl, String serviceName, String message, String sourcePage,
                               String sourceCta, String source, Instant createdAt) {

    static LeadCreatedEvent from(Lead lead) {
        return new LeadCreatedEvent(lead.getId(), lead.getFullName(), lead.getEmail(), lead.getPhone(),
                lead.getCompany(), lead.getWebsiteUrl(),
                lead.getService() == null ? null : lead.getService().getName(), lead.getMessage(),
                lead.getSourcePage(), lead.getSourceCta(), LeadSources.of(lead.getUtmSource(), lead.getReferrer()),
                lead.getCreatedAt());
    }
}
