package com.payroll.platform.service;

import com.payroll.platform.dto.UserProvisionRequestDTO;
import com.payroll.platform.dto.UserSummaryDTO;
import com.payroll.platform.model.Company;
import com.payroll.platform.model.User;
import com.payroll.platform.repository.CompanyRepository;
import com.payroll.platform.repository.EmployeeRepository;
import com.payroll.platform.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class UserProvisioningService {
    private final UserRepository users;
    private final CompanyRepository companies;
    private final EmployeeRepository employees;
    private final PasswordEncoder passwordEncoder;

    public UserProvisioningService(UserRepository users, CompanyRepository companies,
                                   EmployeeRepository employees, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.companies = companies;
        this.employees = employees;
        this.passwordEncoder = passwordEncoder;
    }

    public UserSummaryDTO createCompanyAdmin(Long companyId, UserProvisionRequestDTO request) {
        requireRole("ROLE_SUPER_ADMIN");
        if (!"ROLE_COMPANY_ADMIN".equals(request.getRole())) {
            throw new IllegalArgumentException("Super Admin can provision only a Company Admin here");
        }
        return create(companyId, request);
    }

    public UserSummaryDTO createTenantUser(Long companyId, UserProvisionRequestDTO request) {
        User actor = currentUser();
        if (!"ROLE_COMPANY_ADMIN".equals(actor.getRole()) ||
                actor.getCompanyId() == null || !actor.getCompanyId().equals(companyId)) {
            throw new AccessDeniedException("You can manage users only in your own company");
        }
        if (!"ROLE_AUDITOR".equals(request.getRole()) && !"ROLE_EMPLOYEE".equals(request.getRole())) {
            throw new AccessDeniedException("Company Admin can create only Auditor or Employee accounts");
        }
        if ("ROLE_EMPLOYEE".equals(request.getRole()) &&
                !employees.findByCompanyIdAndEmailIgnoreCase(companyId, request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Create the employee profile in this company before enabling its login");
        }
        return create(companyId, request);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDTO> listCompanyUsers(Long companyId) {
        User actor = currentUser();
        if (!"ROLE_SUPER_ADMIN".equals(actor.getRole()) &&
                (!"ROLE_COMPANY_ADMIN".equals(actor.getRole()) ||
                        actor.getCompanyId() == null || !actor.getCompanyId().equals(companyId))) {
            throw new AccessDeniedException("You can view users only in your own company");
        }
        return users.findByCompanyId(companyId).stream()
                .map(user -> new UserSummaryDTO(user.getId(), user.getEmail(), user.getRole(), user.getCompanyId()))
                .toList();
    }

    private UserSummaryDTO create(Long companyId, UserProvisionRequestDTO request) {
        Company company = companies.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (users.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("An account with this email already exists");
        }
        User user = new User(email, passwordEncoder.encode(request.getPassword()), request.getRole());
        user.setCompanyId(company.getId());
        User saved = users.save(user);
        return new UserSummaryDTO(saved.getId(), saved.getEmail(), saved.getRole(), saved.getCompanyId());
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) throw new AccessDeniedException("Authentication required");
        return users.findByEmail(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found"));
    }

    private void requireRole(String role) {
        if (!role.equals(currentUser().getRole())) throw new AccessDeniedException("Insufficient permissions");
    }
}
