package com.payroll.platform.service.impl;

import com.payroll.platform.dto.EmployeeRequestDTO;
import com.payroll.platform.dto.EmployeeResponseDTO;
import com.payroll.platform.exception.EmployeeNotFoundException;
import com.payroll.platform.model.Company;
import com.payroll.platform.model.Department;
import com.payroll.platform.model.Employee;
import com.payroll.platform.model.User;
import com.payroll.platform.repository.CompanyRepository;
import com.payroll.platform.repository.DepartmentRepository;
import com.payroll.platform.repository.EmployeeRepository;
import com.payroll.platform.repository.UserRepository;
import com.payroll.platform.service.EmployeeService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    public EmployeeServiceImpl(
            EmployeeRepository employeeRepository,
            CompanyRepository companyRepository,
            DepartmentRepository departmentRepository,
            UserRepository userRepository
    ) {
        this.employeeRepository = employeeRepository;
        this.companyRepository = companyRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
    }

    @Override
    @PreAuthorize(
            "hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')"
    )
    public EmployeeResponseDTO createEmployee(
            EmployeeRequestDTO dto
    ) {

        Company company =
                companyRepository.findById(dto.getCompanyId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Company not found with ID: "
                                                + dto.getCompanyId()
                                )
                        );

        ensureCompanyAccess(company.getId());

        Department department =
                departmentRepository.findById(
                        dto.getDepartmentId()
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Department not found with ID: "
                                        + dto.getDepartmentId()
                        )
                );

        if (!department.getCompany()
                .getId()
                .equals(company.getId())) {

            throw new IllegalArgumentException(
                    "The specified department does not belong to this company context."
            );
        }

        if (employeeRepository
                .existsByCompanyIdAndEmailIgnoreCase(
                        dto.getCompanyId(),
                        dto.getEmail()
                )) {

            throw new IllegalArgumentException(
                    "Employee with email '"
                            + dto.getEmail()
                            + "' already exists in this company."
            );
        }

        if (employeeRepository.existsByPanNumber(
                dto.getPanNumber()
        )) {

            throw new IllegalArgumentException(
                    "An employee with PAN '"
                            + dto.getPanNumber()
                            + "' already exists — this looks like a duplicate profile."
            );
        }

        if (employeeRepository.existsByAadhaarNumber(
                dto.getAadhaarNumber()
        )) {

            throw new IllegalArgumentException(
                    "An employee with this Aadhaar number already exists — this looks like a duplicate profile."
            );
        }

        Employee employee = new Employee(
                dto.getFirstName(),
                dto.getLastName(),
                dto.getEmail(),
                dto.getPosition(),
                dto.getHireDate(),
                company,
                department
        );

        employee.setPanNumber(dto.getPanNumber());
        employee.setAadhaarNumber(dto.getAadhaarNumber());

        return mapToResponseDTO(
                employeeRepository.save(employee)
        );
    }

    @Override
    @PreAuthorize(
            "hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'AUDITOR', 'EMPLOYEE')"
    )
    @Transactional(readOnly = true)
    public EmployeeResponseDTO getEmployeeById(
            Long id
    ) {

        Employee employee =
                employeeRepository.findById(id)
                        .orElseThrow(() ->
                                new EmployeeNotFoundException(
                                        "Employee record not found with ID: "
                                                + id
                                )
                        );

        ensureEmployeeAccess(employee);

        return mapToResponseDTO(employee);
    }

    @Override
    @PreAuthorize(
            "hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'AUDITOR' , 'EMPLOYEE')"
    )
    @Transactional(readOnly = true)
    public Page<EmployeeResponseDTO> getEmployeesByCompany(
            Long companyId,
            String searchLastName,
            Pageable pageable
    ) {

        ensureCompanyAccess(companyId);

        // Plain employees only get their own record, not the whole roster
        User currentUser = getCurrentUser();
        if ("ROLE_EMPLOYEE".equals(currentUser.getRole())) {
            java.util.List<Employee> own = employeeRepository
                    .findByCompanyIdAndEmailIgnoreCase(companyId, currentUser.getEmail())
                    .map(java.util.List::of)
                    .orElse(java.util.List.of());
            return new org.springframework.data.domain.PageImpl<>(own, pageable, own.size())
                    .map(this::mapToResponseDTO);
        }

        Page<Employee> employees;

        if (searchLastName != null &&
                !searchLastName.trim().isEmpty()) {

            employees =
                    employeeRepository
                            .findByCompanyIdAndLastNameContainingIgnoreCase(
                                    companyId,
                                    searchLastName,
                                    pageable
                            );

        } else {

            employees =
                    employeeRepository.findByCompanyId(
                            companyId,
                            pageable
                    );
        }

        return employees.map(this::mapToResponseDTO);
    }

    @Override
    @PreAuthorize(
            "hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'AUDITOR' , 'EMPLOYEE')"
    )
    @Transactional(readOnly = true)
    public Page<EmployeeResponseDTO> getEmployeesByDepartment(
            Long departmentId,
            Pageable pageable
    ) {

        Department department =
                departmentRepository.findById(departmentId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Department not found with ID: "
                                                + departmentId
                                )
                        );

        ensureCompanyAccess(
                department.getCompany().getId()
        );

        return employeeRepository
                .findByDepartmentId(
                        departmentId,
                        pageable
                )
                .map(this::mapToResponseDTO);
    }
    @Override
    @PreAuthorize(
            "hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')"
    )
    public EmployeeResponseDTO updateEmployee(
            Long id,
            EmployeeRequestDTO dto
    ) {

        Employee employee =
                employeeRepository.findById(id)
                        .orElseThrow(() ->
                                new EmployeeNotFoundException(
                                        "Employee record not found with ID: "
                                                + id
                                )
                        );

        ensureCompanyAccess(
                employee.getCompany().getId()
        );

        if (!employee.getEmail()
                .equalsIgnoreCase(dto.getEmail()) &&
                employeeRepository
                        .existsByCompanyIdAndEmailIgnoreCase(
                                employee.getCompany().getId(),
                                dto.getEmail()
                        )) {

            throw new IllegalArgumentException(
                    "Email record already registered within this corporate context."
            );
        }

        Department department =
                departmentRepository.findById(
                        dto.getDepartmentId()
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Department not found with ID: "
                                        + dto.getDepartmentId()
                        )
                );

        // Prevent moving an employee to another company's department
        if (!department.getCompany()
                .getId()
                .equals(employee.getCompany().getId())) {

            throw new AccessDeniedException(
                    "Employee cannot be assigned to a department belonging to another company"
            );
        }

        employee.setFirstName(dto.getFirstName());
        employee.setLastName(dto.getLastName());
        employee.setEmail(dto.getEmail());
        employee.setPosition(dto.getPosition());
        employee.setHireDate(dto.getHireDate());
        employee.setDepartment(department);

        return mapToResponseDTO(
                employeeRepository.save(employee)
        );
    }

    @Override
    @PreAuthorize(
            "hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')"
    )
    public void deleteEmployee(Long id) {

        Employee employee =
                employeeRepository.findById(id)
                        .orElseThrow(() ->
                                new EmployeeNotFoundException(
                                        "Cannot delete. Employee record not found with ID: "
                                                + id
                                )
                        );

        ensureCompanyAccess(
                employee.getCompany().getId()
        );

        employeeRepository.delete(employee);
    }

    private User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new AccessDeniedException(
                    "Authentication required"
            );
        }

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "Authenticated user not found"
                        )
                );
    }

    private boolean isSuperAdmin() {

        return "ROLE_SUPER_ADMIN"
                .equals(getCurrentUser().getRole());
    }

    private Long getCurrentUserCompanyId() {

        User user = getCurrentUser();

        if (user.getCompanyId() == null) {

            throw new AccessDeniedException(
                    "User is not associated with a company"
            );
        }

        return user.getCompanyId();
    }

    private void ensureCompanyAccess(
            Long targetCompanyId
    ) {

        if (isSuperAdmin()) {
            return;
        }

        Long currentCompanyId =
                getCurrentUserCompanyId();

        if (!currentCompanyId.equals(targetCompanyId)) {

            throw new AccessDeniedException(
                    "You do not have access to this company's data"
            );
        }
    }

    private void ensureEmployeeAccess(
            Employee employee
    ) {

        User user = getCurrentUser();

        if ("ROLE_SUPER_ADMIN".equals(user.getRole())) {
            return;
        }

        // Employee can only see their own employee record
        if ("ROLE_EMPLOYEE".equals(user.getRole())) {

            if (!employee.getEmail()
                    .equalsIgnoreCase(user.getEmail())) {

                throw new AccessDeniedException(
                        "Employees can only access their own employee record"
                );
            }

            return;
        }

        // Company admin / auditor
        ensureCompanyAccess(
                employee.getCompany().getId()
        );
    }

    private EmployeeResponseDTO mapToResponseDTO(
            Employee emp
    ) {

        EmployeeResponseDTO dto =
                new EmployeeResponseDTO();

        dto.setId(emp.getId());
        dto.setFirstName(emp.getFirstName());
        dto.setLastName(emp.getLastName());
        dto.setEmail(emp.getEmail());
        dto.setPosition(emp.getPosition());
        dto.setPanNumber(emp.getPanNumber());
        dto.setAadhaarNumber(
                maskAadhaar(emp.getAadhaarNumber())
        );
        dto.setHireDate(emp.getHireDate());

        dto.setCompanyId(
                emp.getCompany().getId()
        );

        dto.setCompanyName(
                emp.getCompany().getName()
        );

        dto.setDepartmentId(
                emp.getDepartment().getId()
        );

        dto.setDepartmentName(
                emp.getDepartment().getName()
        );

        dto.setCreatedAt(
                emp.getCreatedAt()
        );

        return dto;
    }

    private String maskAadhaar(
            String aadhaar
    ) {

        if (aadhaar == null ||
                aadhaar.length() != 12) {

            return aadhaar;
        }

        return "XXXX-XXXX-"
                + aadhaar.substring(8);
    }
}