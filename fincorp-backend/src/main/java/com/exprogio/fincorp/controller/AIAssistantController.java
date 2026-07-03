package com.exprogio.fincorp.controller;

import com.exprogio.fincorp.model.Invoice;
import com.exprogio.fincorp.model.Transaction;
import com.exprogio.fincorp.repository.InvoiceRepository;
import com.exprogio.fincorp.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/public/ai")
@CrossOrigin(origins = "http://localhost:3000")
public class AIAssistantController {

    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private InvoiceRepository invoiceRepository;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> request) {
        String query = request.get("query");
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(Map.of("response", "Silakan ketikkan pertanyaan Anda terlebih dahulu."));
        }

        String lowerQuery = query.toLowerCase();
        String response;

        try {
            // Rule 1: Guardrail (out of domain)
            if (lowerQuery.contains("presiden") || lowerQuery.contains("cuaca") || lowerQuery.contains("politik") || lowerQuery.contains("game") || lowerQuery.contains("film")) {
                response = "Maaf, saya adalah AI Asisten Finansial internal PT Expro Gio Nusantara. Saya hanya diizinkan untuk memberikan informasi mengenai arus kas, laba rugi, tagihan, dan data internal perusahaan.";
            } 
            // Rule 2: Piutang / Invoices
            else if (lowerQuery.contains("piutang") || lowerQuery.contains("tagihan belum lunas")) {
                List<Invoice> unpaid = invoiceRepository.findAll().stream()
                        .filter(inv -> !"Lunas".equals(inv.getStatus()))
                        .collect(Collectors.toList());
                BigDecimal totalUnpaid = unpaid.stream()
                        .map(Invoice::getBalance)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                response = "Berdasarkan catatan database perusahaan, saat ini kita memiliki " + unpaid.size() + 
                           " tagihan piutang klien yang belum lunas dengan total nilai Rp " + String.format("%,.0f", totalUnpaid) + ".";
            }
            // Rule 3: Pendapatan / Uang Masuk
            else if (lowerQuery.contains("pendapatan") || lowerQuery.contains("uang masuk")) {
                List<Transaction> revenue = transactionRepository.findAll().stream()
                        .filter(tx -> "Pendapatan".equals(tx.getType()))
                        .collect(Collectors.toList());
                BigDecimal totalRev = revenue.stream()
                        .map(Transaction::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                response = "Data arus kas mencatat bahwa total akumulasi pendapatan (uang masuk) perusahaan saat ini mencapai Rp " + 
                           String.format("%,.0f", totalRev) + " dari " + revenue.size() + " transaksi.";
            }
            // Rule 4: Pengeluaran / Uang Keluar
            else if (lowerQuery.contains("pengeluaran") || lowerQuery.contains("biaya") || lowerQuery.contains("uang keluar")) {
                List<Transaction> expenses = transactionRepository.findAll().stream()
                        .filter(tx -> "Pengeluaran".equals(tx.getType()))
                        .collect(Collectors.toList());
                BigDecimal totalExp = expenses.stream()
                        .map(Transaction::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                response = "Total pengeluaran operasional perusahaan saat ini tercatat sebesar Rp " + 
                           String.format("%,.0f", totalExp) + " yang mencakup pengeluaran untuk proyek, gaji, dan inventaris.";
            }
            // Rule 5: Laba Bersih / Kas Bersih
            else if (lowerQuery.contains("laba") || lowerQuery.contains("profit") || lowerQuery.contains("total kas")) {
                BigDecimal totalRev = transactionRepository.findAll().stream()
                        .filter(tx -> "Pendapatan".equals(tx.getType()))
                        .map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalExp = transactionRepository.findAll().stream()
                        .filter(tx -> "Pengeluaran".equals(tx.getType()))
                        .map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal profit = totalRev.subtract(totalExp);
                
                String profitWord = profit.compareTo(BigDecimal.ZERO) >= 0 ? "Laba Bersih (Surplus)" : "Rugi Bersih (Defisit)";
                response = "Secara keseluruhan, Arus Kas Bersih (Selisih Pendapatan dan Pengeluaran) perusahaan saat ini menunjukkan " + profitWord + " sebesar Rp " + String.format("%,.0f", profit) + ".";
            }
            // Fallback for greetings
            else if (lowerQuery.contains("halo") || lowerQuery.contains("hai") || lowerQuery.contains("pagi") || lowerQuery.contains("siang") || lowerQuery.contains("malam")) {
                response = "Halo! Saya adalah AI Asisten Finansial PT Expro Gio Nusantara. Ada data finansial atau arus kas yang ingin Anda cek hari ini?";
            }
            // Fallback general
            else {
                response = "Menganalisis: '" + query + "'. Saat ini, saya dirancang khusus untuk merangkum data Pendapatan, Pengeluaran, Piutang Klien, dan Laba Arus Kas. Coba tanyakan sesuatu seperti: 'Berapa total piutang kita saat ini?'";
            }
        } catch (Exception e) {
            response = "Terjadi kesalahan sistem saat mencoba membaca database finansial: " + e.getMessage();
        }

        return ResponseEntity.ok(Map.of("response", response));
    }
}
