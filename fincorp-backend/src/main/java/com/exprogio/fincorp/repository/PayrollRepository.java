package com.exprogio.fincorp.repository;

import com.exprogio.fincorp.model.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, String> {
    List<Payroll> findByEmployeeEmail(String employeeEmail);
    List<Payroll> findByPeriod(String period);
}
