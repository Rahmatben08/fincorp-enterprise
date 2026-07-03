package com.exprogio.fincorp.controller;

import com.exprogio.fincorp.model.Transaction;
import com.exprogio.fincorp.repository.TransactionRepository;
import com.exprogio.fincorp.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/transactions")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AuditService auditService;

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category) {
        
        List<Transaction> list = transactionRepository.filterTransactions(type, status, category);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<Transaction> createTransaction(
            @RequestBody Transaction transaction,
            Authentication authentication) {
        
        String creatorEmail = "anonymous@exprogio.com";
        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            creatorEmail = jwt.getClaim("preferred_username") != null ? jwt.getClaim("preferred_username") : jwt.getSubject();
        } else if (authentication != null) {
            creatorEmail = authentication.getName();
        }
        
        transaction.setCreatorEmail(creatorEmail);
        transaction.setTransactionDate(LocalDate.now());
        
        // Rules validation: Pengeluaran > Rp 50jt requires manager approval
        if ("Pengeluaran".equals(transaction.getType()) && 
            transaction.getAmount().compareTo(new BigDecimal("50000000")) > 0) {
            transaction.setStatus("Menunggu Approval");
        } else {
            transaction.setStatus("Lunas");
        }
        
        Transaction saved = transactionRepository.save(transaction);
        
        auditService.log("Catat Transaksi", 
            String.format("Mencatat transaksi baru %s (%s - %s) senilai Rp %,.2f - Status: %s", 
                saved.getTransactionId(), saved.getType(), saved.getCategory(), saved.getAmount(), saved.getStatus()));
                
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveTransaction(
            @PathVariable String id,
            @RequestParam boolean approve,
            @RequestParam(required = false) String notes,
            Authentication authentication) {
        
        Optional<Transaction> opt = transactionRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Transaction tx = opt.get();
        if (!"Menunggu Approval".equals(tx.getStatus())) {
            return ResponseEntity.badRequest().body("Transaksi tidak sedang menunggu approval.");
        }
        
        String newStatus = approve ? "Lunas" : "Ditolak";
        tx.setStatus(newStatus);
        transactionRepository.save(tx);
        
        String managerEmail = "manager@exprogio.com";
        if (authentication != null && authentication.getPrincipal() instanceof Jwt) {
            Jwt jwt = (Jwt) authentication.getPrincipal();
            managerEmail = jwt.getClaim("preferred_username") != null ? jwt.getClaim("preferred_username") : jwt.getSubject();
        } else if (authentication != null) {
            managerEmail = authentication.getName();
        }
        
        auditService.log("Approval Transaksi", 
            String.format("Manajer %s menyetujui transaksi %s senilai Rp %,.2f. Keputusan: %s. Catatan: %s", 
                managerEmail, id, tx.getAmount(), newStatus, notes != null ? notes : "-"));
                
        return ResponseEntity.ok(tx);
    }
}
