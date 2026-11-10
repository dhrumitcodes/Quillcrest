package com.payroll.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class BulkPayrollRequestDTO {

    @NotBlank(message = "Pay period is mandatory")
    @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "Pay period must match format YYYY-MM")
    private String payPeriod;

    // Only used by SUPER_ADMIN (who is not tied to a company).
    // Company admins always run for their own company.
    private Long companyId;

    public String getPayPeriod() { return payPeriod; }
    public void setPayPeriod(String payPeriod) { this.payPeriod = payPeriod; }

    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
}
