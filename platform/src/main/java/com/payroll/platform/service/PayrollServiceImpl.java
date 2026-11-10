package com.payroll.platform.service.impl;

import com.payroll.platform.dto.*;
import com.payroll.platform.model.*;
import com.payroll.platform.repository.*;
import com.payroll.platform.service.PayrollService;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PayrollServiceImpl implements PayrollService {

    private final SalaryStructureRepository salaryRepository;
    private final PaySlipRepository paySlipRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public PayrollServiceImpl(
            SalaryStructureRepository salaryRepository,
            PaySlipRepository paySlipRepository,
            EmployeeRepository employeeRepository,
            UserRepository userRepository
    ) {

        this.salaryRepository = salaryRepository;
        this.paySlipRepository = paySlipRepository;
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
    }
    @Override
    @PreAuthorize(
            "hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')"
    )
    public SalaryResponseDTO setSalaryStructure(
            SalaryRequestDTO dto
    ) {

        Employee employee =
                getEmployeeWithAccessCheck(
                        dto.getEmployeeId()
                );

        SalaryStructure structure =
                salaryRepository
                        .findByEmployeeId(
                                dto.getEmployeeId()
                        )
                        .orElse(new SalaryStructure());

        structure.setEmployee(employee);
        structure.setBaseSalary(dto.getBaseSalary());
        structure.setAllowances(dto.getAllowances());
        structure.setDeductions(dto.getDeductions());

        return mapToSalaryResponse(
                salaryRepository.save(structure)
        );
    }

    @Override
    @PreAuthorize(
            "hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'AUDITOR', 'EMPLOYEE')"
    )
    @Transactional(readOnly = true)
    public SalaryResponseDTO getSalaryStructureByEmployee(
            Long employeeId
    ) {

        Employee employee =
                getEmployeeWithAccessCheck(employeeId);

        SalaryStructure structure =
                salaryRepository
                        .findByEmployeeId(employee.getId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Salary profile configuration missing for Employee ID: "
                                                + employeeId
                                )
                        );

        return mapToSalaryResponse(structure);
    }


    @Override
    @PreAuthorize(
            "hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')"
    )
    public PaySlipResponseDTO processMonthlyPayroll(
            ProcessPayrollRequestDTO dto
    ) {

        Employee employee =
                getEmployeeWithAccessCheck(
                        dto.getEmployeeId()
                );

        if (paySlipRepository
                .existsByEmployeeIdAndPayPeriod(
                        dto.getEmployeeId(),
                        dto.getPayPeriod()
                )) {

            throw new IllegalArgumentException(
                    "Payroll cycle execution already locked for period: "
                            + dto.getPayPeriod()
            );
        }

        SalaryStructure salary =
                salaryRepository
                        .findByEmployeeId(
                                dto.getEmployeeId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Cannot process payroll. Salary structure not configured yet."
                                )
                        );

        BigDecimal grossPay =
                salary.getBaseSalary()
                        .add(salary.getAllowances());

        BigDecimal netPay =
                grossPay.subtract(
                        salary.getDeductions()
                );

        if (netPay.compareTo(
                BigDecimal.ZERO
        ) < 0) {

            throw new IllegalArgumentException(
                    "Payroll processing aborted: Net payment results in a negative balancing state."
            );
        }

        PaySlip paySlip =
                new PaySlip(
                        employee,
                        dto.getPayPeriod(),
                        grossPay,
                        salary.getDeductions(),
                        netPay
                );

        return mapToPaySlipResponse(
                paySlipRepository.save(paySlip)
        );
    }

    @Override
    @PreAuthorize(
            "hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN', 'AUDITOR', 'EMPLOYEE')"
    )
    @Transactional(readOnly = true)
    public List<PaySlipResponseDTO> getEmployeePaySlips(
            Long employeeId
    ) {

        Employee employee =
                getEmployeeWithAccessCheck(employeeId);

        return paySlipRepository
                .findByEmployeeId(employee.getId())
                .stream()
                .map(this::mapToPaySlipResponse)
                .collect(Collectors.toList());
    }

    @Override
    @PreAuthorize(
            "hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')"
    )
    public List<BulkPayrollResultDTO> processBulkPayroll(
            BulkPayrollRequestDTO dto
    ) {

        User user = getCurrentUser();
        Long companyId;

        if ("ROLE_SUPER_ADMIN".equals(user.getRole())) {
            if (dto.getCompanyId() == null) {
                throw new IllegalArgumentException(
                        "Company ID is required for a super admin bulk run."
                );
            }
            companyId = dto.getCompanyId();
        } else {
            if (user.getCompanyId() == null) {
                throw new AccessDeniedException(
                        "User is not associated with a company"
                );
            }
            // Company admins can only ever run payroll for their own company
            companyId = user.getCompanyId();
        }

        List<Employee> employees =
                employeeRepository
                        .findByCompanyId(companyId, org.springframework.data.domain.Pageable.unpaged())
                        .getContent();

        List<BulkPayrollResultDTO> results = new java.util.ArrayList<>();

        for (Employee employee : employees) {

            String name = employee.getFirstName() + " " + employee.getLastName();

            if (paySlipRepository.existsByEmployeeIdAndPayPeriod(
                    employee.getId(), dto.getPayPeriod())) {

                results.add(new BulkPayrollResultDTO(
                        employee.getId(), name, "SKIPPED_ALREADY_PROCESSED",
                        "Payroll already processed for " + dto.getPayPeriod(), null));
                continue;
            }

            java.util.Optional<SalaryStructure> salaryOpt =
                    salaryRepository.findByEmployeeId(employee.getId());

            if (salaryOpt.isEmpty()) {
                results.add(new BulkPayrollResultDTO(
                        employee.getId(), name, "SKIPPED_NO_SALARY",
                        "No salary structure configured", null));
                continue;
            }

            SalaryStructure salary = salaryOpt.get();

            BigDecimal allowances =
                    salary.getAllowances() != null ? salary.getAllowances() : BigDecimal.ZERO;
            BigDecimal deductions =
                    salary.getDeductions() != null ? salary.getDeductions() : BigDecimal.ZERO;

            BigDecimal grossPay = salary.getBaseSalary().add(allowances);
            BigDecimal netPay = grossPay.subtract(deductions);

            if (netPay.compareTo(BigDecimal.ZERO) < 0) {
                results.add(new BulkPayrollResultDTO(
                        employee.getId(), name, "FAILED",
                        "Net pay would be negative", null));
                continue;
            }

            PaySlip saved = paySlipRepository.save(
                    new PaySlip(employee, dto.getPayPeriod(), grossPay, deductions, netPay)
            );

            results.add(new BulkPayrollResultDTO(
                    employee.getId(), name, "PROCESSED",
                    "Net pay " + netPay, mapToPaySlipResponse(saved)));
        }

        return results;
    }

    private Employee getEmployeeWithAccessCheck(
            Long employeeId
    ) {

        Employee employee =
                employeeRepository.findById(employeeId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Employee profile not found with ID: "
                                                + employeeId
                                )
                        );

        User user = getCurrentUser();
        if ("ROLE_SUPER_ADMIN".equals(
                user.getRole()
        )) {

            return employee;
        }

        if ("ROLE_EMPLOYEE".equals(
                user.getRole()
        )) {

            if (!employee.getEmail()
                    .equalsIgnoreCase(
                            user.getEmail()
                    )) {

                throw new AccessDeniedException(
                        "Employees can only access their own payroll information"
                );
            }

            return employee;
        }

        if (user.getCompanyId() == null) {

            throw new AccessDeniedException(
                    "User is not associated with a company"
            );
        }

        Long employeeCompanyId =
                employee.getCompany().getId();

        if (!user.getCompanyId()
                .equals(employeeCompanyId)) {

            throw new AccessDeniedException(
                    "You do not have access to this company's payroll data"
            );
        }

        return employee;
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

        String email =
                authentication.getName();

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "Authenticated user not found"
                        )
                );
    }

    private SalaryResponseDTO mapToSalaryResponse(
            SalaryStructure s
    ) {

        SalaryResponseDTO dto =
                new SalaryResponseDTO();

        dto.setId(s.getId());

        dto.setEmployeeId(
                s.getEmployee().getId()
        );

        dto.setEmployeeName(
                s.getEmployee().getFirstName()
                        + " "
                        + s.getEmployee().getLastName()
        );

        dto.setBaseSalary(
                s.getBaseSalary()
        );

        dto.setAllowances(
                s.getAllowances()
        );

        dto.setDeductions(
                s.getDeductions()
        );

        return dto;
    }

    private PaySlipResponseDTO mapToPaySlipResponse(
            PaySlip p
    ) {

        PaySlipResponseDTO dto =
                new PaySlipResponseDTO();

        dto.setId(p.getId());

        dto.setEmployeeId(
                p.getEmployee().getId()
        );

        dto.setEmployeeName(
                p.getEmployee().getFirstName()
                        + " "
                        + p.getEmployee().getLastName()
        );

        dto.setPayPeriod(
                p.getPayPeriod()
        );

        dto.setGrossPay(
                p.getGrossPay()
        );

        dto.setTotalDeductions(
                p.getTotalDeductions()
        );

        dto.setNetPay(
                p.getNetPay()
        );

        dto.setProcessedAt(
                p.getProcessedAt()
        );

        return dto;
    }
}