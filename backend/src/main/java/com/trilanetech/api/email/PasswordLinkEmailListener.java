package com.trilanetech.api.email;

import com.trilanetech.api.auth.PasswordLinkEvent;
import com.trilanetech.api.auth.PasswordToken;
import java.util.List;
import java.util.Map;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

/** Emails invite and password reset links once the token is safely stored. */
@Component
public class PasswordLinkEmailListener {

    private final EmailService emailService;
    private final EmailTemplates templates;

    public PasswordLinkEmailListener(EmailService emailService, EmailTemplates templates) {
        this.emailService = emailService;
        this.templates = templates;
    }

    @Async
    @TransactionalEventListener(fallbackExecution = true)
    public void onPasswordLink(PasswordLinkEvent event) {
        boolean invite = event.purpose() == PasswordToken.Purpose.INVITE;
        String template = invite ? "invite" : "password-reset";
        String subject = invite ? "You're invited to the Trilane Tech dashboard"
                : "Reset your Trilane Tech dashboard password";
        var body = templates.render(template, Map.of(
                "name", event.fullName(),
                "link", event.link(),
                "validFor", event.validFor()));
        emailService.send(List.of(event.email()), null, subject, body, template);
    }
}
