package com.trilanetech.api.lead;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;

public final class LeadDtos {

    private LeadDtos() {}

    /**
     * The public contact form. Visitor-typed fields are validated; the
     * automatically captured source fields are trimmed to length instead, so a
     * long tracking tag never blocks someone from getting in touch.
     */
    public record LeadSubmission(
            @NotBlank(message = "Enter your name.") @Size(max = 120, message = "Use at most 120 characters.") String fullName,
            @NotBlank(message = "Enter your email address.") @Email(message = "Enter a valid email address.")
            @Size(max = 254, message = "Use at most 254 characters.") String email,
            @Size(max = 40, message = "Use at most 40 characters.")
            @Pattern(regexp = "^$|^[0-9+()\\-.\\s]{5,40}$", message = "Enter a valid phone number.") String phone,
            @Size(max = 160, message = "Use at most 160 characters.") String company,
            @Size(max = 255, message = "Use at most 255 characters.")
            @Pattern(regexp = "^$|^\\S+\\.\\S+$", message = "Enter a website address, like example.com.") String websiteUrl,
            @Size(max = 80, message = "Choose a service from the list.") String serviceSlug,
            @NotBlank(message = "Tell us a little about what you need.")
            @Size(min = 10, max = 5000, message = "Write between 10 and 5,000 characters.") String message,
            String sourcePage,
            String sourceCta,
            String referrer,
            String utmSource,
            String utmMedium,
            String utmCampaign,
            /** Hidden from people; bots that fill every field fill this one too. */
            String nickname) {}

    public record SubmissionReceived(boolean received) {}

    public record LeadDto(Long id, String fullName, String email, String phone, String company, String websiteUrl,
                          Long serviceId, String serviceName, String message, LeadStatus status, String statusLabel,
                          String sourcePage, String sourceCta, String referrer, String utmSource, String utmMedium,
                          String utmCampaign, String source, Long assignedToId, String assignedToName,
                          LocalDate followUpOn, boolean overdue, Instant createdAt, Instant updatedAt) {

        static LeadDto from(Lead l, LocalDate today) {
            var s = l.getService();
            var a = l.getAssignedTo();
            return new LeadDto(l.getId(), l.getFullName(), l.getEmail(), l.getPhone(), l.getCompany(),
                    l.getWebsiteUrl(), s == null ? null : s.getId(), s == null ? null : s.getName(), l.getMessage(),
                    l.getStatus(), l.getStatus().label(), l.getSourcePage(), l.getSourceCta(), l.getReferrer(),
                    l.getUtmSource(), l.getUtmMedium(), l.getUtmCampaign(),
                    LeadSources.of(l.getUtmSource(), l.getReferrer()), a == null ? null : a.getId(),
                    a == null ? null : a.getFullName(), l.getFollowUpOn(), l.isOverdue(today), l.getCreatedAt(),
                    l.getUpdatedAt());
        }
    }

    public record NoteDto(Long id, String body, Long authorId, String authorName, Instant createdAt) {
        static NoteDto from(LeadNote n) {
            var a = n.getAuthor();
            return new NoteDto(n.getId(), n.getBody(), a == null ? null : a.getId(),
                    a == null ? "Former team member" : a.getFullName(), n.getCreatedAt());
        }
    }

    public record NoteRequest(
            @NotBlank(message = "Write a note first.") @Size(max = 5000, message = "Use at most 5,000 characters.") String body) {}

    /** Filters shared by the list and the CSV export. */
    public record LeadFilter(String q, LeadStatus status, String serviceId, String assignedTo, String source,
                             LocalDate from, LocalDate to, Boolean overdue) {}
}
