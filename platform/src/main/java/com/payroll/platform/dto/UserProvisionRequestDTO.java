package com.payroll.platform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UserProvisionRequestDTO {
    @NotBlank @Email
    private String email;

    @NotBlank @Size(min = 10, max = 72)
    private String password;

    @NotBlank
    @Pattern(regexp = "ROLE_(COMPANY_ADMIN|AUDITOR|EMPLOYEE)")
    private String role;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
