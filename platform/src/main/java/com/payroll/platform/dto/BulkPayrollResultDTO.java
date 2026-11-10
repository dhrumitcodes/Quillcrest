package com.payroll.platform.dto;

public class BulkPayrollResultDTO {

    // PROCESSED, SKIPPED_ALREADY_PROCESSED, SKIPPED_NO_SALARY, FAILED
    private Long employeeId;
    private String employeeName;
    private String status;
    private String message;
    private PaySlipResponseDTO paySlip;

    public BulkPayrollResultDTO(Long employeeId, String employeeName, String status,
                                String message, PaySlipResponseDTO paySlip) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.status = status;
        this.message = message;
        this.paySlip = paySlip;
    }

    public Long getEmployeeId() { return employeeId; }
    public String getEmployeeName() { return employeeName; }
    public String getStatus() { return status; }
    public String getMessage() { return message; }
    public PaySlipResponseDTO getPaySlip() { return paySlip; }
}
