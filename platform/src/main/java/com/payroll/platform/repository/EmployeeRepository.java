package com.payroll.platform.repository;

import com.payroll.platform.model.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByCompanyIdAndEmailIgnoreCase(Long companyId, String email);
    boolean existsByPanNumber(String panNumber);
    boolean existsByAadhaarNumber(String aadhaarNumber);
    java.util.Optional<Employee> findByCompanyIdAndEmailIgnoreCase(Long companyId, String email);
    Page<Employee> findByCompanyId(Long companyId, Pageable pageable);
    Page<Employee> findByDepartmentId(Long departmentId, Pageable pageable);
    Page<Employee> findByCompanyIdAndLastNameContainingIgnoreCase(Long companyId, String lastName, Pageable pageable);
}