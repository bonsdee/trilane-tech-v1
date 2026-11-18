package com.trilanetech.api.settings;

import com.trilanetech.api.catalog.ServiceOffering;
import com.trilanetech.api.catalog.ServiceOfferingRepository;
import com.trilanetech.api.portfolio.PortfolioService;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The pilot offer for the Launch Bundle. It is shown only while it is switched
 * on, at least one spot remains, and the Launch Bundle itself is published.
 */
@Service
public class SettingsService {

    static final String PILOT_ENABLED = "pilot.enabled";
    static final String PILOT_PRICE = "pilot.price";
    static final String PILOT_SPOTS = "pilot.spots_remaining";
    /** The service the pilot price applies to. */
    public static final String PILOT_SERVICE_SLUG = "launch-bundle";

    private final SiteSettingRepository settings;
    private final ServiceOfferingRepository services;
    private final PortfolioService portfolio;

    public SettingsService(SiteSettingRepository settings, ServiceOfferingRepository services,
                           PortfolioService portfolio) {
        this.settings = settings;
        this.services = services;
        this.portfolio = portfolio;
    }

    public record PilotSettings(boolean enabled, BigDecimal price, int spotsRemaining, String serviceName,
                                BigDecimal regularPrice, boolean live) {}

    public record PilotRequest(
            @NotNull(message = "Choose on or off.") Boolean enabled,
            @NotNull(message = "Enter the pilot price.") @DecimalMin(value = "0", message = "Price cannot be negative.")
            @DecimalMax(value = "99999999.99", message = "Price is too large.")
            @Digits(integer = 8, fraction = 2, message = "Use at most 2 decimal places.") BigDecimal price,
            @NotNull(message = "Enter the spots remaining.") @Min(value = 0, message = "Use 0 or more.")
            @Max(value = 1000, message = "Use at most 1,000.") Integer spotsRemaining) {}

    public record PublicPilot(boolean active, BigDecimal price, BigDecimal regularPrice, Integer spotsRemaining,
                              String serviceSlug, String serviceName) {}

    public record PublicSite(PublicPilot pilot, boolean portfolioVisible) {}

    @Transactional(readOnly = true)
    public PilotSettings pilot() {
        boolean enabled = Boolean.parseBoolean(value(PILOT_ENABLED, "false"));
        BigDecimal price = new BigDecimal(value(PILOT_PRICE, "0"));
        int spots = Integer.parseInt(value(PILOT_SPOTS, "0"));
        Optional<ServiceOffering> service = services.findBySlug(PILOT_SERVICE_SLUG);
        boolean live = enabled && spots > 0 && service.map(ServiceOffering::isPublished).orElse(false);
        return new PilotSettings(enabled, price, spots, service.map(ServiceOffering::getName).orElse(null),
                service.map(ServiceOffering::getPrice).orElse(null), live);
    }

    @Transactional
    public PilotSettings updatePilot(PilotRequest request) {
        put(PILOT_ENABLED, String.valueOf(request.enabled()));
        put(PILOT_PRICE, request.price().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString());
        put(PILOT_SPOTS, String.valueOf(request.spotsRemaining()));
        return pilot();
    }

    @Transactional(readOnly = true)
    public PublicSite publicSite() {
        PilotSettings p = pilot();
        PublicPilot pilot = p.live()
                ? new PublicPilot(true, p.price(), p.regularPrice(), p.spotsRemaining(), PILOT_SERVICE_SLUG, p.serviceName())
                : new PublicPilot(false, null, null, null, null, null);
        return new PublicSite(pilot, portfolio.anyPublished());
    }

    private String value(String key, String fallback) {
        return settings.findByKey(key).map(SiteSetting::getValue).orElse(fallback);
    }

    private void put(String key, String value) {
        SiteSetting setting = settings.findByKey(key).orElseGet(() -> new SiteSetting(key, value));
        setting.setValue(value);
        settings.save(setting);
    }
}
