package com.payroll.platform.controller;

import com.payroll.platform.dto.UserProvisionRequestDTO;
import com.payroll.platform.dto.UserSummaryDTO;
import com.payroll.platform.service.UserProvisioningService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies/{companyId}/users")
public class UserProvisioningController {
    private final UserProvisioningService service;

    public UserProvisioningController(UserProvisioningService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<UserSummaryDTO>> list(@PathVariable Long companyId) {
        return ResponseEntity.ok(service.listCompanyUsers(companyId));
    }

    @PostMapping("/company-admin")
    public ResponseEntity<UserSummaryDTO> createCompanyAdmin(
            @PathVariable Long companyId, @Valid @RequestBody UserProvisionRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createCompanyAdmin(companyId, request));
    }

    @PostMapping
    public ResponseEntity<UserSummaryDTO> createTenantUser(
            @PathVariable Long companyId, @Valid @RequestBody UserProvisionRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createTenantUser(companyId, request));
    }
}
