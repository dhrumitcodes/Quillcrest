package com.payroll.platform.dto;

public class UserSummaryDTO {
    private final Long id;
    private final String email;
    private final String role;
    private final Long companyId;

    public UserSummaryDTO(Long id, String email, String role, Long companyId) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.companyId = companyId;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public Long getCompanyId() { return companyId; }
}
