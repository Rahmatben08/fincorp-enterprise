package com.exprogio.fincorp.controller;

import com.exprogio.fincorp.model.DivisionBudget;
import com.exprogio.fincorp.repository.DivisionBudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/budgets")
@CrossOrigin(origins = "*")
public class BudgetController {

    @Autowired
    private DivisionBudgetRepository budgetRepository;

    @GetMapping
    public List<DivisionBudget> getAllBudgets() {
        return budgetRepository.findAll();
    }
}
