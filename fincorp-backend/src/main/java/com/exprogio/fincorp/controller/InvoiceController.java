package com.exprogio.fincorp.controller;

import com.exprogio.fincorp.model.Invoice;
import com.exprogio.fincorp.model.Transaction;
import com.exprogio.fincorp.repository.InvoiceRepository;
import com.exprogio.fincorp.repository.TransactionRepository;
import com.exprogio.fincorp.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/invoices")
@CrossOrigin(origins = "*") // CrossOrigin allowed for local development
public class InvoiceController {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AuditService auditService;

    @GetMapping
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Invoice> createInvoice(@RequestBody Invoice invoice, @RequestHeader(value = "X-User-Email", required = false) String emailHeader) {
        if (invoice.getInvoiceId() == null || invoice.getInvoiceId().isEmpty()) {
            invoice.setInvoiceId("INV-" + System.currentTimeMillis() % 1000000);
        }
        invoice.setBalance(invoice.getAmount());
        if (invoice.getStatus() == null) {
            invoice.setStatus("Belum Lunas");
        }
        
        Invoice saved = invoiceRepository.save(invoice);
        
        auditService.log("CREATE_INVOICE", 
                "Membuat invoice baru " + invoice.getInvoiceId() + " senilai Rp " + invoice.getAmount());
        
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/pay")
    public ResponseEntity<Invoice> payInvoice(@PathVariable String id, @RequestHeader(value = "X-User-Email", required = false) String emailHeader) {
        return invoiceRepository.findById(id).map(invoice -> {
            invoice.setBalance(BigDecimal.ZERO);
            invoice.setStatus("Lunas");
            Invoice updated = invoiceRepository.save(invoice);

            // Automatically create a corresponding revenue transaction
            Transaction tx = Transaction.builder()
                .transactionId("TX-INV-" + System.currentTimeMillis() % 100000)
                .transactionDate(LocalDate.now())
                .type("Pendapatan")
                .category("Kontrak Proyek IT")
                .amount(invoice.getAmount())
                .description("Pembayaran Invoice Pelanggan " + invoice.getInvoiceId() + " (" + invoice.getClientName() + ")")
                .creatorEmail((emailHeader != null) ? emailHeader : "admin@exprogio.com")
                .status("Lunas")
                .build();
            transactionRepository.save(tx);

            auditService.log("PAY_INVOICE", 
                    "Melunasi invoice " + id + " dan mencatat pendapatan senilai Rp " + invoice.getAmount());

            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/reminder")
    public ResponseEntity<Void> sendReminder(@PathVariable String id, @RequestHeader(value = "X-User-Email", required = false) String emailHeader) {
        auditService.log("SEND_REMINDER", 
                "Mengirimkan email penagihan piutang / pengingat pembayaran untuk invoice " + id);
        return ResponseEntity.ok().build();
    }
}
