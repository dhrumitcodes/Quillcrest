package com.payroll.platform.service.impl;

import com.payroll.platform.dto.DashboardSummaryDTO;
import com.payroll.platform.dto.PayrollTrendPointDTO;
import com.payroll.platform.model.Employee;
import com.payroll.platform.model.PaySlip;
import com.payroll.platform.model.SalaryStructure;
import com.payroll.platform.model.User;
import com.payroll.platform.repository.CompanyRepository;
import com.payroll.platform.repository.EmployeeRepository;
import com.payroll.platform.repository.PaySlipRepository;
import com.payroll.platform.repository.SalaryStructureRepository;
import com.payroll.platform.repository.UserRepository;
import com.payroll.platform.service.DashboardService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final PaySlipRepository paySlipRepository;
    private final UserRepository userRepository;

    public DashboardServiceImpl(
            EmployeeRepository employeeRepository,
            CompanyRepository companyRepository,
            SalaryStructureRepository salaryStructureRepository,
            PaySlipRepository paySlipRepository,
            UserRepository userRepository
    ) {
        this.employeeRepository = employeeRepository;
        this.companyRepository = companyRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.paySlipRepository = paySlipRepository;
        this.userRepository = userRepository;
    }

    @Override
    public DashboardSummaryDTO getSummary() {
        return getSummary(null);
    }

    @Override
    public DashboardSummaryDTO getSummary(Long selectedCompanyId) {
        User user = getCurrentUser();
        boolean superAdmin = "ROLE_SUPER_ADMIN".equals(user.getRole());

        // With no selected tenant, retain the platform-wide Super Admin view.
        if (superAdmin && selectedCompanyId == null) {
            long totalEmployees = employeeRepository.count();
            long totalCompanies = companyRepository.count();
            return new DashboardSummaryDTO(totalEmployees, totalCompanies, BigDecimal.ZERO, "—", 0, new ArrayList<>());
        }

        // Super Admins may inspect one selected tenant. Tenant users always
        // remain scoped to their own company; a request parameter cannot
        // override their authenticated company.
        Long companyId = superAdmin ? selectedCompanyId : user.getCompanyId();
        if (superAdmin && !companyRepository.existsById(companyId)) {
            throw new IllegalArgumentException("Selected company was not found.");
        }

        if (companyId == null) {
            throw new AccessDeniedException("Your account is not linked to a company.");
        }

        Page<Employee> employeePage = employeeRepository.findByCompanyId(companyId, Pageable.unpaged());
        List<Employee> employees = employeePage.getContent();

        long totalEmployees = employees.size();
        long pendingActions = 0;
        BigDecimal totalMonthlyPayroll = BigDecimal.ZERO;

        for (Employee emp : employees) {

            boolean missingPan = emp.getPanNumber() == null || emp.getPanNumber().isBlank();
            boolean missingAadhaar = emp.getAadhaarNumber() == null || emp.getAadhaarNumber().isBlank();

            Optional<SalaryStructure> salary = salaryStructureRepository.findByEmployeeId(emp.getId());
            boolean missingSalary = salary.isEmpty();

            if (missingPan || missingAadhaar || missingSalary) {
                pendingActions++;
            }

            if (salary.isPresent()) {
                SalaryStructure s = salary.get();
                BigDecimal net = s.getBaseSalary()
                        .add(s.getAllowances() != null ? s.getAllowances() : BigDecimal.ZERO)
                        .subtract(s.getDeductions() != null ? s.getDeductions() : BigDecimal.ZERO);
                totalMonthlyPayroll = totalMonthlyPayroll.add(net);
            }
        }

        String complianceScore = totalEmployees == 0
                ? "—"
                : BigDecimal.valueOf(totalEmployees - pendingActions)
                .divide(BigDecimal.valueOf(totalEmployees), 3, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(1, RoundingMode.HALF_UP) + "%";

        List<PaySlip> paySlips = paySlipRepository.findByEmployee_Company_IdOrderByPayPeriodAsc(companyId);

        Map<String, BigDecimal> trendMap = new LinkedHashMap<>();
        for (PaySlip slip : paySlips) {
            trendMap.merge(slip.getPayPeriod(), slip.getNetPay(), BigDecimal::add);
        }

        List<PayrollTrendPointDTO> payrollTrend = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : trendMap.entrySet()) {
            payrollTrend.add(new PayrollTrendPointDTO(entry.getKey(), entry.getValue()));
        }

        return new DashboardSummaryDTO(
                totalEmployees,
                1,
                totalMonthlyPayroll,
                complianceScore,
                pendingActions,
                payrollTrend
        );
    }

    private User getCurrentUser() {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found"));
    }
}