package com.payroll.platform.repository;

import com.payroll.platform.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);\n    java.util.List<User> findByCompanyId(Long companyId);
}