package com.exprogio.fincorp.controller;

import com.exprogio.fincorp.model.Transaction;
import com.exprogio.fincorp.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private TransactionRepository transactionRepository;

    @GetMapping("/profit-loss")
    public Map<String, Object> getProfitLossReport() {
        List<Transaction> transactions = transactionRepository.findAll();
        
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        
        Map<String, BigDecimal> revenueByCategory = new HashMap<>();
        Map<String, BigDecimal> expenseByCategory = new HashMap<>();

        for (Transaction t : transactions) {
            if ("Pendapatan".equalsIgnoreCase(t.getType())) {
                totalRevenue = totalRevenue.add(t.getAmount());
                revenueByCategory.put(t.getCategory(), 
                    revenueByCategory.getOrDefault(t.getCategory(), BigDecimal.ZERO).add(t.getAmount()));
            } else if ("Pengeluaran".equalsIgnoreCase(t.getType())) {
                totalExpense = totalExpense.add(t.getAmount());
                expenseByCategory.put(t.getCategory(), 
                    expenseByCategory.getOrDefault(t.getCategory(), BigDecimal.ZERO).add(t.getAmount()));
            }
        }

        BigDecimal netProfit = totalRevenue.subtract(totalExpense);

        Map<String, Object> report = new HashMap<>();
        report.put("totalRevenue", totalRevenue);
        report.put("totalExpense", totalExpense);
        report.put("netProfit", netProfit);
        report.put("revenueByCategory", revenueByCategory);
        report.put("expenseByCategory", expenseByCategory);
        
        return report;
    }
}
