package com.scholarme.features.dashboard;

import com.scholarme.features.dashboard.dto.DashboardStatsDto;
import com.scholarme.shared.dto.ApiResponse;
import com.scholarme.shared.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Dashboard Feature Controller
 * Provides dashboard statistics for authenticated users
 */
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getStats(
            @AuthenticationPrincipal User user) {
        DashboardStatsDto stats = dashboardService.getStatsForUser(user);
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
