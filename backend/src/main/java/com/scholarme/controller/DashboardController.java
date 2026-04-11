package com.scholarme.controller;

import com.scholarme.dto.ApiResponse;
import com.scholarme.dto.DashboardDtos.*;
import com.scholarme.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * GET /dashboard/stats
     * Headers: Authorization: Bearer {token}
     * Response: { totalSessions, upcomingSessions, completedSessions, ... }
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            UUID userId = UUID.fromString(userDetails.getUsername());
            DashboardStatsDto stats = dashboardService.getStats(userId);
            return ResponseEntity.ok(ApiResponse.ok(stats));
        } catch (Exception e) {
            // Return empty stats on error
            return ResponseEntity.ok(ApiResponse.ok(new DashboardStatsDto()));
        }
    }
}
