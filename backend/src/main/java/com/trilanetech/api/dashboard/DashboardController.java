package com.trilanetech.api.dashboard;

import com.trilanetech.api.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DashboardController {

    private final DashboardService dashboard;

    public DashboardController(DashboardService dashboard) {
        this.dashboard = dashboard;
    }

    @GetMapping("/api/v1/admin/dashboard/summary")
    public ApiResponse<DashboardService.Summary> summary() {
        return ApiResponse.of(dashboard.summary());
    }
}
