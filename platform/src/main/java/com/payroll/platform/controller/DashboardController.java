package com.payroll.platform.controller;

import com.payroll.platform.dto.DashboardSummaryDTO;
import com.payroll.platform.payload.ApiResponse;
import com.payroll.platform.service.DashboardService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryDTO>> getSummary(
            @org.springframework.web.bind.annotation.RequestParam(required = false) Long companyId) {
        DashboardSummaryDTO summary = dashboardService.getSummary(companyId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Dashboard summary computed", summary));
    }
}