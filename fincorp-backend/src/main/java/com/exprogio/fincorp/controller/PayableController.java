package com.exprogio.fincorp.controller;

import com.exprogio.fincorp.model.Transaction;
import com.exprogio.fincorp.model.VendorInvoice;
import com.exprogio.fincorp.repository.TransactionRepository;
import com.exprogio.fincorp.repository.VendorInvoiceRepository;
import com.exprogio.fincorp.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/payables")
public class PayableController {

    @Autowired
    private VendorInvoiceRepository vendorInvoiceRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AuditService auditService;

    @GetMapping
    public List<VendorInvoice> getAllPayables() {
        return vendorInvoiceRepository.findAll();
    }

    @PostMapping
    public VendorInvoice createPayable(@RequestBody VendorInvoice invoice) {
        return vendorInvoiceRepository.save(invoice);
    }

    /**
     * Melunasi tagihan vendor dan mencatat pengeluaran ke jurnal transaksi secara otomatis.
     */
    @PutMapping("/{id}/pay")
    public ResponseEntity<VendorInvoice> payVendorInvoice(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader) {

        return vendorInvoiceRepository.findById(id).map(payable -> {
            if ("Lunas".equals(payable.getStatus())) {
                return ResponseEntity.ok(payable);
            }

            // Update status tagihan vendor
            payable.setStatus("Lunas");
            VendorInvoice updated = vendorInvoiceRepository.save(payable);

            // Catat otomatis sebagai pengeluaran di jurnal transaksi
            Transaction tx = Transaction.builder()
                .transactionId("TX-PAY-" + System.currentTimeMillis() % 100000)
                .transactionDate(LocalDate.now())
                .type("Pengeluaran")
                .category("Pembayaran Vendor")
                .amount(payable.getAmount())
                .description("Pelunasan Tagihan Vendor " + payable.getVendorInvoiceId() + " - " + payable.getVendorName())
                .creatorEmail(emailHeader != null ? emailHeader : "admin@exprogio.com")
                .status("Lunas")
                .build();
            transactionRepository.save(tx);

            auditService.log("PAY_VENDOR",
                "Melunasi tagihan vendor " + id + " (" + payable.getVendorName() + ") senilai Rp " + payable.getAmount()
                + " dan mencatat pengeluaran ke jurnal transaksi.");

            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }
}
