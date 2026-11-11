package com.payroll.platform.service.impl;

import com.payroll.platform.dto.EmployeeRequestDTO;
import com.payroll.platform.dto.EmployeeResponseDTO;
import com.payroll.platform.model.Company;
import com.payroll.platform.model.Department;
import com.payroll.platform.model.Employee;
import com.payroll.platform.model.User;
import com.payroll.platform.repository.CompanyRepository;
import com.payroll.platform.repository.DepartmentRepository;
import com.payroll.platform.repository.EmployeeRepository;
import com.payroll.platform.repository.UserRepository;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceImplTest {

    @Mock private EmployeeRepository employeeRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private EmployeeServiceImpl employeeService;

    private Company company;
    private Department department;

    @BeforeEach
    void setUp() {
        company = new Company();
        company.setId(1L);
        company.setName("TechCorp");

        department = new Department();
        department.setId(10L);
        department.setName("Engineering");
        department.setCompany(company);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private void loginAs(String email, String role, Long companyId) {
        User user = new User();
        user.setEmail(email);
        user.setRole(role);
        user.setCompanyId(companyId);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null , List.of())
        );
    }

    private EmployeeRequestDTO validRequest() {
        EmployeeRequestDTO dto = new EmployeeRequestDTO();
        dto.setFirstName("Asha");
        dto.setLastName("Rao");
        dto.setEmail("asha.rao@techcorp.com");
        dto.setPosition("Software Engineer");
        dto.setPanNumber("ABCDE1234F");
        dto.setAadhaarNumber("123456789012");
        dto.setHireDate(LocalDate.now());
        dto.setCompanyId(1L);
        dto.setDepartmentId(10L);
        return dto;
    }

    @Test
    void createEmployee_succeeds_forSuperAdmin() {
        loginAs("admin@quillcrest.com", "ROLE_SUPER_ADMIN", null);

        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(departmentRepository.findById(10L)).thenReturn(Optional.of(department));
        when(employeeRepository.existsByCompanyIdAndEmailIgnoreCase(1L, "asha.rao@techcorp.com")).thenReturn(false);
        when(employeeRepository.existsByPanNumber("ABCDE1234F")).thenReturn(false);
        when(employeeRepository.existsByAadhaarNumber("123456789012")).thenReturn(false);

        Employee saved = new Employee("Asha", "Rao", "asha.rao@techcorp.com", "Software Engineer", LocalDate.now(), company, department);
        saved.setId(99L);
        saved.setPanNumber("ABCDE1234F");
        saved.setAadhaarNumber("123456789012");
        when(employeeRepository.save(any(Employee.class))).thenReturn(saved);

        EmployeeResponseDTO result = employeeService.createEmployee(validRequest());

        assertEquals("Asha", result.getFirstName());
        assertEquals(99L, result.getId());
    }

    @Test
    void createEmployee_deniesAccess_whenCompanyAdminBelongsToDifferentCompany() {
        loginAs("otheradmin@rivalcorp.com", "ROLE_COMPANY_ADMIN", 2L);

        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));

        assertThrows(AccessDeniedException.class, () -> employeeService.createEmployee(validRequest()));
    }

    @Test
    void createEmployee_rejectsDuplicatePan() {
        loginAs("admin@quillcrest.com", "ROLE_SUPER_ADMIN", null);

        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(departmentRepository.findById(10L)).thenReturn(Optional.of(department));
        when(employeeRepository.existsByCompanyIdAndEmailIgnoreCase(1L, "asha.rao@techcorp.com")).thenReturn(false);
        when(employeeRepository.existsByPanNumber("ABCDE1234F")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> employeeService.createEmployee(validRequest()));
    }

    @Test
    void createEmployee_rejectsDepartmentFromAnotherCompany() {
        loginAs("admin@quillcrest.com", "ROLE_SUPER_ADMIN", null);

        Company otherCompany = new Company();
        otherCompany.setId(2L);
        otherCompany.setName("RivalCorp");

        Department mismatchedDept = new Department();
        mismatchedDept.setId(10L);
        mismatchedDept.setCompany(otherCompany);

        when(companyRepository.findById(1L)).thenReturn(Optional.of(company));
        when(departmentRepository.findById(10L)).thenReturn(Optional.of(mismatchedDept));

        assertThrows(IllegalArgumentException.class, () -> employeeService.createEmployee(validRequest()));
    }
    @Test
    void getEmployeesByCompany_deniesCompanyAdmin_forAnotherTenant() {
        loginAs("tenant-admin@example.test", "ROLE_COMPANY_ADMIN", 1L);
        assertThrows(AccessDeniedException.class, () -> employeeService.getEmployeesByCompany(2L, null, org.springframework.data.domain.PageRequest.of(0, 10)));
    }

    @Test
    void getEmployeesByCompany_deniesAuditor_forAnotherTenant() {
        loginAs("tenant-auditor@example.test", "ROLE_AUDITOR", 2L);
        assertThrows(AccessDeniedException.class, () -> employeeService.getEmployeesByCompany(1L, null, org.springframework.data.domain.PageRequest.of(0, 10)));
    }

    @Test
    void getEmployeesByCompany_deniesEmployee_forAnotherTenant() {
        loginAs("tenant-employee@example.test", "ROLE_EMPLOYEE", 1L);
        assertThrows(AccessDeniedException.class, () -> employeeService.getEmployeesByCompany(2L, null, org.springframework.data.domain.PageRequest.of(0, 10)));
    }
}
