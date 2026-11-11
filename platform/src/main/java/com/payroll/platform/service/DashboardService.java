package com.payroll.platform.service;

import com.payroll.platform.dto.DashboardSummaryDTO;

public interface DashboardService {
    DashboardSummaryDTO getSummary();
    DashboardSummaryDTO getSummary(Long selectedCompanyId);
}
