package com.exprogio.fincorp.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "employee_id")
    private Long employeeId;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false, length = 100)
    private String division;

    @Column(name = "base_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal baseSalary;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal allowance;

    @Column(name = "kpi_target", nullable = false)
    private Integer kpiTarget;

    @Column(name = "kpi_achieved", nullable = false)
    private Integer kpiAchieved;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public Employee() {}

    public Employee(Long employeeId, String email, String fullName, String division, BigDecimal baseSalary, BigDecimal allowance, Integer kpiTarget, Integer kpiAchieved) {
        this.employeeId = employeeId;
        this.email = email;
        this.fullName = fullName;
        this.division = division;
        this.baseSalary = baseSalary;
        this.allowance = allowance;
        this.kpiTarget = kpiTarget;
        this.kpiAchieved = kpiAchieved;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getDivision() {
        return division;
    }

    public void setDivision(String division) {
        this.division = division;
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

    public Integer getKpiTarget() {
        return kpiTarget;
    }

    public void setKpiTarget(Integer kpiTarget) {
        this.kpiTarget = kpiTarget;
    }

    public Integer getKpiAchieved() {
        return kpiAchieved;
    }

    public void setKpiAchieved(Integer kpiAchieved) {
        this.kpiAchieved = kpiAchieved;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long employeeId;
        private String email;
        private String fullName;
        private String division;
        private BigDecimal baseSalary;
        private BigDecimal allowance;
        private Integer kpiTarget;
        private Integer kpiAchieved;

        public Builder employeeId(Long employeeId) {
            this.employeeId = employeeId;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder fullName(String fullName) {
            this.fullName = fullName;
            return this;
        }

        public Builder division(String division) {
            this.division = division;
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

        public Builder kpiTarget(Integer kpiTarget) {
            this.kpiTarget = kpiTarget;
            return this;
        }

        public Builder kpiAchieved(Integer kpiAchieved) {
            this.kpiAchieved = kpiAchieved;
            return this;
        }

        public Employee build() {
            return new Employee(employeeId, email, fullName, division, baseSalary, allowance, kpiTarget, kpiAchieved);
        }
    }
}
