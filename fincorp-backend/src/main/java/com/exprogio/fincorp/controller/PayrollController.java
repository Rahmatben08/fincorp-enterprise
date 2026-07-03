package com.exprogio.fincorp.controller;

import com.exprogio.fincorp.model.Employee;
import com.exprogio.fincorp.model.Payroll;
import com.exprogio.fincorp.model.Transaction;
import com.exprogio.fincorp.repository.EmployeeRepository;
import com.exprogio.fincorp.repository.PayrollRepository;
import com.exprogio.fincorp.repository.TransactionRepository;
import com.exprogio.fincorp.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payroll")
@CrossOrigin(origins = "*")
public class PayrollController {

    @Autowired
    private PayrollRepository payrollRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AuditService auditService;

    @GetMapping
    public List<Payroll> getAllPayroll() {
        return payrollRepository.findAll();
    }

    @GetMapping("/my")
    public List<Payroll> getMyPayroll(@RequestHeader(value = "X-User-Email", required = false) String emailHeader) {
        String email = (emailHeader != null) ? emailHeader : "staff@exprogio.com";
        return payrollRepository.findByEmployeeEmail(email);
    }

    @PostMapping("/process")
    public ResponseEntity<?> processPayroll(@RequestBody Map<String, String> request, @RequestHeader(value = "X-User-Email", required = false) String emailHeader) {
        String period = request.get("period");
        if (period == null || period.isEmpty()) {
            return ResponseEntity.badRequest().body("Periode payroll wajib diisi.");
        }

        // Check if payroll already processed for this period
        List<Payroll> existing = payrollRepository.findByPeriod(period);
        if (!existing.isEmpty()) {
            return ResponseEntity.badRequest().body("Payroll untuk periode " + period + " sudah diproses sebelumnya.");
        }

        List<Employee> employees = employeeRepository.findAll();
        List<Payroll> processedPayrolls = new ArrayList<>();
        BigDecimal totalNetSalary = BigDecimal.ZERO;

        for (Employee emp : employees) {
            BigDecimal base = emp.getBaseSalary();
            BigDecimal allowance = emp.getAllowance();
            
            // KPI calculation: bonus is 15% of base salary multiplied by (kpiAchieved / 100)
            double kpiPct = emp.getKpiAchieved() / 100.0;
            BigDecimal bonus = base.multiply(new BigDecimal(0.15 * kpiPct)).setScale(2, RoundingMode.HALF_UP);
            
            BigDecimal gross = base.add(allowance).add(bonus);
            BigDecimal tax = gross.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal bpjs = gross.multiply(new BigDecimal("0.02")).setScale(2, RoundingMode.HALF_UP);
            BigDecimal net = gross.subtract(tax).subtract(bpjs).setScale(2, RoundingMode.HALF_UP);

            String payrollId = "SL-" + System.currentTimeMillis() % 100000 + "-" + emp.getEmployeeId();

            Payroll payroll = Payroll.builder()
                .payrollId(payrollId)
                .employeeEmail(emp.getEmail())
                .employeeName(emp.getFullName())
                .division(emp.getDivision())
                .period(period)
                .baseSalary(base)
                .allowance(allowance)
                .bonus(bonus)
                .tax(tax)
                .bpjs(bpjs)
                .netSalary(net)
                .releaseDate(LocalDate.now())
                .build();

            payrollRepository.save(payroll);
            processedPayrolls.add(payroll);
            totalNetSalary = totalNetSalary.add(net);
        }

        // Create transaction record for payroll expenses
        Transaction tx = Transaction.builder()
            .transactionId("TX-PAY-" + System.currentTimeMillis() % 100000)
            .transactionDate(LocalDate.now())
            .type("Pengeluaran")
            .category("Gaji & Payroll")
            .amount(totalNetSalary)
            .description("Pembayaran Gaji Karyawan untuk Periode " + period)
            .creatorEmail((emailHeader != null) ? emailHeader : "admin@exprogio.com")
            .status("Lunas")
            .build();
        transactionRepository.save(tx);

        auditService.log("PROCESS_PAYROLL", 
                "Melakukan batch processing payroll karyawan untuk periode " + period + " senilai Rp " + totalNetSalary);

        return ResponseEntity.ok(processedPayrolls);
    }

    /**
     * Menyimpan satu record payroll (digunakan sebagai fallback jika /process tidak tersedia)
     */
    @PostMapping
    public ResponseEntity<Payroll> savePayroll(@RequestBody Payroll payroll) {
        // Pastikan payrollId ada
        if (payroll.getPayrollId() == null || payroll.getPayrollId().isEmpty()) {
            payroll.setPayrollId("SL-" + System.currentTimeMillis() % 100000);
        }
        if (payroll.getReleaseDate() == null) {
            payroll.setReleaseDate(LocalDate.now());
        }
        Payroll saved = payrollRepository.save(payroll);
        auditService.log("SAVE_PAYROLL", "Menyimpan data payroll " + saved.getPayrollId() + " untuk " + saved.getEmployeeName() + " periode " + saved.getPeriod());
        return ResponseEntity.ok(saved);
    }

    /**
     * Approve/reject payroll oleh Manajer/Superadmin
     */
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approvePayroll(
            @PathVariable String id,
            @RequestParam boolean approve,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader) {

        return payrollRepository.findById(id).map(payroll -> {
            String newStatus = approve ? "Disetujui" : "Ditolak";
            // Jika model Payroll punya field status, set di sini
            // payroll.setApprovalStatus(newStatus);
            payrollRepository.save(payroll);
            auditService.log("APPROVE_PAYROLL",
                String.format("%s %s payroll %s (%s)", emailHeader, newStatus, id, payroll.getEmployeeName()));
            return ResponseEntity.ok(payroll);
        }).orElse(ResponseEntity.notFound().build());
    }
}
