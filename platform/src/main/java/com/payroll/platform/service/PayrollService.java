package com.payroll.platform.service;

import com.payroll.platform.dto.*;
import java.util.List;

public interface PayrollService {
    SalaryResponseDTO setSalaryStructure(SalaryRequestDTO requestDTO);
    SalaryResponseDTO getSalaryStructureByEmployee(Long employeeId);
    PaySlipResponseDTO processMonthlyPayroll(ProcessPayrollRequestDTO requestDTO);
    List<PaySlipResponseDTO> getEmployeePaySlips(Long employeeId);
    List<BulkPayrollResultDTO> processBulkPayroll(BulkPayrollRequestDTO requestDTO);
}