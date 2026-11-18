package com.trilanetech.api.user;

import com.trilanetech.api.common.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * On first start, when no accounts exist, creates the admin named by
 * ADMIN_EMAIL and ADMIN_NAME and emails them a set-password link.
 */
@Component
public class FirstAdminInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(FirstAdminInitializer.class);

    private final UserRepository users;
    private final UserService userService;
    private final AppProperties props;

    public FirstAdminInitializer(UserRepository users, UserService userService, AppProperties props) {
        this.users = users;
        this.userService = userService;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (users.count() > 0) {
            return;
        }
        String email = props.admin().email();
        String name = props.admin().name();
        if (email == null || email.isBlank()) {
            log.warn("No accounts exist and ADMIN_EMAIL is not set, so nobody can sign in yet. "
                    + "Set ADMIN_EMAIL and ADMIN_NAME and restart.");
            return;
        }
        userService.invite(name == null || name.isBlank() ? "Admin" : name, email);
        log.info("Created the first admin account from ADMIN_EMAIL and emailed a set-password link.");
    }
}
