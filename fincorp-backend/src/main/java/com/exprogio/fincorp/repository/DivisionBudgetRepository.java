package com.exprogio.fincorp.repository;

import com.exprogio.fincorp.model.DivisionBudget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DivisionBudgetRepository extends JpaRepository<DivisionBudget, String> {
}
