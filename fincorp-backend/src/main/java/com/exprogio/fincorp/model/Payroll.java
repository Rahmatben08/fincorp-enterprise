package com.exprogio.fincorp.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payroll")
public class Payroll {

    @Id
    @Column(name = "payroll_id", length = 50)
    private String payrollId;

    @Column(name = "employee_email", nullable = false, length = 150)
    private String employeeEmail;

    @Column(name = "employee_name", nullable = false, length = 150)
    private String employeeName;

    @Column(nullable = false, length = 100)
    private String division;

    @Column(nullable = false, length = 50)
    private String period;

    @Column(name = "base_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal baseSalary;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal allowance;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal bonus;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal tax;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal bpjs;

    @Column(name = "net_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal netSalary;

    @Column(name = "release_date", nullable = false)
    private LocalDate releaseDate;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Payroll() {}

    public Payroll(String payrollId, String employeeEmail, String employeeName, String division, String period, BigDecimal baseSalary, BigDecimal allowance, BigDecimal bonus, BigDecimal tax, BigDecimal bpjs, BigDecimal netSalary, LocalDate releaseDate) {
        this.payrollId = payrollId;
        this.employeeEmail = employeeEmail;
        this.employeeName = employeeName;
        this.division = division;
        this.period = period;
        this.baseSalary = baseSalary;
        this.allowance = allowance;
        this.bonus = bonus;
        this.tax = tax;
        this.bpjs = bpjs;
        this.netSalary = netSalary;
        this.releaseDate = releaseDate;
    }

    public String getPayrollId() {
        return payrollId;
    }

    public void setPayrollId(String payrollId) {
        this.payrollId = payrollId;
    }

    public String getEmployeeEmail() {
        return employeeEmail;
    }

    public void setEmployeeEmail(String employeeEmail) {
        this.employeeEmail = employeeEmail;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getDivision() {
        return division;
    }

    public void setDivision(String division) {
        this.division = division;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public BigDecimal getBaseSalary() {
        return baseSalary;
    }

    public void setBaseSalary(BigDecimal baseSalary) {
        this.baseSalary = baseSalary;
    }

    public BigDecimal getAllowance() {
        return allowance;
    }

    public void setAllowance(BigDecimal allowance) {
        this.allowance = allowance;
    }

    public BigDecimal getBonus() {
        return bonus;
    }

    public void setBonus(BigDecimal bonus) {
        this.bonus = bonus;
    }

    public BigDecimal getTax() {
        return tax;
    }

    public void setTax(BigDecimal tax) {
        this.tax = tax;
    }

    public BigDecimal getBpjs() {
        return bpjs;
    }

    public void setBpjs(BigDecimal bpjs) {
        this.bpjs = bpjs;
    }

    public BigDecimal getNetSalary() {
        return netSalary;
    }

    public void setNetSalary(BigDecimal netSalary) {
        this.netSalary = netSalary;
    }

    public LocalDate getReleaseDate() {
        return releaseDate;
    }

    public void setReleaseDate(LocalDate releaseDate) {
        this.releaseDate = releaseDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String payrollId;
        private String employeeEmail;
        private String employeeName;
        private String division;
        private String period;
        private BigDecimal baseSalary;
        private BigDecimal allowance;
        private BigDecimal bonus;
        private BigDecimal tax;
        private BigDecimal bpjs;
        private BigDecimal netSalary;
        private LocalDate releaseDate;

        public Builder payrollId(String payrollId) {
            this.payrollId = payrollId;
            return this;
        }

        public Builder employeeEmail(String employeeEmail) {
            this.employeeEmail = employeeEmail;
            return this;
        }

        public Builder employeeName(String employeeName) {
            this.employeeName = employeeName;
            return this;
        }

        public Builder division(String division) {
            this.division = division;
            return this;
        }

        public Builder period(String period) {
            this.period = period;
            return this;
        }

        public Builder baseSalary(BigDecimal baseSalary) {
            this.baseSalary = baseSalary;
            return this;
        }

        public Builder allowance(BigDecimal allowance) {
            this.allowance = allowance;
            return this;
        }

        public Builder bonus(BigDecimal bonus) {
            this.bonus = bonus;
            return this;
        }

        public Builder tax(BigDecimal tax) {
            this.tax = tax;
            return this;
        }

        public Builder bpjs(BigDecimal bpjs) {
            this.bpjs = bpjs;
            return this;
        }

        public Builder netSalary(BigDecimal netSalary) {
            this.netSalary = netSalary;
            return this;
        }

        public Builder releaseDate(LocalDate releaseDate) {
            this.releaseDate = releaseDate;
            return this;
        }

        public Payroll build() {
            return new Payroll(payrollId, employeeEmail, employeeName, division, period, baseSalary, allowance, bonus, tax, bpjs, netSalary, releaseDate);
        }
    }
}
