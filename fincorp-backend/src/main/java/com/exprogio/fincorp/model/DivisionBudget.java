package com.exprogio.fincorp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "division_budgets")
public class DivisionBudget {
    @Id
    private String budgetId;
    
    private String divisionName;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal allocatedBudget;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal usedBudget;
    
    private String period; // e.g., "Tahun 2026"

    public DivisionBudget() {}

    public DivisionBudget(String budgetId, String divisionName, BigDecimal allocatedBudget, BigDecimal usedBudget, String period) {
        this.budgetId = budgetId;
        this.divisionName = divisionName;
        this.allocatedBudget = allocatedBudget;
        this.usedBudget = usedBudget;
        this.period = period;
    }

    public String getBudgetId() { return budgetId; }
    public void setBudgetId(String budgetId) { this.budgetId = budgetId; }
    public String getDivisionName() { return divisionName; }
    public void setDivisionName(String divisionName) { this.divisionName = divisionName; }
    public BigDecimal getAllocatedBudget() { return allocatedBudget; }
    public void setAllocatedBudget(BigDecimal allocatedBudget) { this.allocatedBudget = allocatedBudget; }
    public BigDecimal getUsedBudget() { return usedBudget; }
    public void setUsedBudget(BigDecimal usedBudget) { this.usedBudget = usedBudget; }
    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String budgetId;
        private String divisionName;
        private BigDecimal allocatedBudget;
        private BigDecimal usedBudget;
        private String period;

        public Builder budgetId(String budgetId) { this.budgetId = budgetId; return this; }
        public Builder divisionName(String divisionName) { this.divisionName = divisionName; return this; }
        public Builder allocatedBudget(BigDecimal allocatedBudget) { this.allocatedBudget = allocatedBudget; return this; }
        public Builder usedBudget(BigDecimal usedBudget) { this.usedBudget = usedBudget; return this; }
        public Builder period(String period) { this.period = period; return this; }

        public DivisionBudget build() {
            return new DivisionBudget(budgetId, divisionName, allocatedBudget, usedBudget, period);
        }
    }
}
