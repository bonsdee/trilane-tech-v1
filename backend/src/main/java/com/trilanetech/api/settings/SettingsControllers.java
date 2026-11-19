package com.trilanetech.api.settings;

import com.trilanetech.api.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

public final class SettingsControllers {

    private SettingsControllers() {}

    @RestController
    public static class PublicSiteController {
        private final SettingsService settings;

        public PublicSiteController(SettingsService settings) {
            this.settings = settings;
        }

        @GetMapping("/api/v1/public/site")
        public ApiResponse<SettingsService.PublicSite> site() {
            return ApiResponse.of(settings.publicSite());
        }
    }

    @RestController
    public static class AdminSettingsController {
        private final SettingsService settings;

        public AdminSettingsController(SettingsService settings) {
            this.settings = settings;
        }

        @GetMapping("/api/v1/admin/settings/pilot")
        public ApiResponse<SettingsService.PilotSettings> pilot() {
            return ApiResponse.of(settings.pilot());
        }

        @PutMapping("/api/v1/admin/settings/pilot")
        public ApiResponse<SettingsService.PilotSettings> update(@Valid @RequestBody SettingsService.PilotRequest body) {
            return ApiResponse.of(settings.updatePilot(body));
        }

        @GetMapping("/api/v1/admin/settings/booking")
        public ApiResponse<SettingsService.BookingSettings> booking() {
            return ApiResponse.of(settings.booking());
        }

        @PutMapping("/api/v1/admin/settings/booking")
        public ApiResponse<SettingsService.BookingSettings> updateBooking(
                @Valid @RequestBody SettingsService.BookingRequest body) {
            return ApiResponse.of(settings.updateBooking(body));
        }
    }
}
