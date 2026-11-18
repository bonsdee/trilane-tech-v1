package com.trilanetech.api.email;

import com.trilanetech.api.common.AppProperties;
import com.trilanetech.api.lead.LeadCreatedEvent;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * After a lead is committed: tells the team and sends the visitor an
 * acknowledgement. Runs on a background thread; failures are logged by
 * {@link EmailService} and never affect the saved lead.
 */
@Component
public class LeadEmailListener {

    private final EmailService emailService;
    private final EmailTemplates templates;
    private final AppProperties props;

    public LeadEmailListener(EmailService emailService, EmailTemplates templates, AppProperties props) {
        this.emailService = emailService;
        this.templates = templates;
        this.props = props;
    }

    @Async
    @TransactionalEventListener
    public void onLeadCreated(LeadCreatedEvent lead) {
        String service = lead.serviceName() == null ? "Not sure yet" : lead.serviceName();

        Map<String, String> values = new HashMap<>();
        values.put("name", lead.fullName());
        values.put("email", lead.email());
        values.put("phone", orDash(lead.phone()));
        values.put("company", orDash(lead.company()));
        values.put("website", orDash(lead.websiteUrl()));
        values.put("service", service);
        values.put("message", lead.message());
        values.put("source", describeSource(lead));
        values.put("dashboardLink", props.siteBaseUrl() + "/admin/leads/" + lead.leadId());

        List<String> team = props.mail().leadRecipients();
        emailService.send(team, lead.email(), "New lead: " + lead.fullName() + " (" + service + ")",
                templates.render("lead-notification", values), "lead-notification");

        String teamReplyTo = team.isEmpty() ? null : team.getFirst();
        emailService.send(List.of(lead.email()), teamReplyTo, "Thanks for contacting Trilane Tech",
                templates.render("lead-acknowledgement", values), "lead-acknowledgement");
    }

    private static String describeSource(LeadCreatedEvent lead) {
        List<String> parts = new ArrayList<>();
        parts.add(lead.source());
        if (lead.sourcePage() != null) {
            parts.add("page " + lead.sourcePage());
        }
        if (lead.sourceCta() != null) {
            parts.add("button \"" + lead.sourceCta() + "\"");
        }
        return String.join(" · ", parts);
    }

    private static String orDash(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }
}
