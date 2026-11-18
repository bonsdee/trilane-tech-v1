package com.trilanetech.api.email;

import com.trilanetech.api.common.AppProperties;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Sends email through SMTP. Failures are logged and swallowed: the caller's
 * work (for example saving a lead) has already been committed and must not be
 * undone because a mail server was unavailable. Addresses and message bodies
 * are not written to the log.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final AppProperties props;

    public EmailService(JavaMailSender mailSender, AppProperties props) {
        this.mailSender = mailSender;
        this.props = props;
    }

    /** Returns true if the message was handed to the mail server. */
    public boolean send(List<String> to, String replyTo, String subject, EmailTemplates.Rendered body,
                        String kind) {
        if (to == null || to.isEmpty()) {
            log.warn("Email not sent: kind={} reason=no-recipients-configured", kind);
            return false;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(props.mail().from());
            helper.setTo(to.toArray(String[]::new));
            if (replyTo != null && !replyTo.isBlank()) {
                helper.setReplyTo(replyTo);
            }
            helper.setSubject(subject);
            helper.setText(body.text(), body.html());
            mailSender.send(message);
            log.info("Email sent: kind={} recipients={}", kind, to.size());
            return true;
        } catch (Exception e) {
            log.error("Email delivery failed: kind={} recipients={} error={}", kind, to.size(), e.toString());
            return false;
        }
    }
}
