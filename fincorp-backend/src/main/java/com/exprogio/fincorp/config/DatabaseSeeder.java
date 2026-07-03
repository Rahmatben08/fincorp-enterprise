package com.exprogio.fincorp.config;

import com.exprogio.fincorp.model.Employee;
import com.exprogio.fincorp.model.Invoice;
import com.exprogio.fincorp.model.Transaction;
import com.exprogio.fincorp.repository.EmployeeRepository;
import com.exprogio.fincorp.repository.InvoiceRepository;
import com.exprogio.fincorp.repository.TransactionRepository;
import com.exprogio.fincorp.repository.UserRepository;
import com.exprogio.fincorp.model.InvestorDocument;
import com.exprogio.fincorp.model.ESGMetric;
import com.exprogio.fincorp.repository.InvestorDocumentRepository;
import com.exprogio.fincorp.repository.ESGMetricRepository;
import com.exprogio.fincorp.model.DivisionBudget;
import com.exprogio.fincorp.repository.DivisionBudgetRepository;
import com.exprogio.fincorp.model.VendorInvoice;
import com.exprogio.fincorp.repository.VendorInvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.context.annotation.Profile;

@Component
@Profile({"dev-local", "pg-local"})
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private VendorInvoiceRepository vendorInvoiceRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InvestorDocumentRepository investorDocumentRepository;

    @Autowired
    private ESGMetricRepository esgMetricRepository;

    @Autowired
    private DivisionBudgetRepository divisionBudgetRepository;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Employees if empty
        if (employeeRepository.count() == 0) {
            List<Employee> initialEmployees = List.of(
                Employee.builder()
                    .email("staff@exprogio.com")
                    .fullName("Agus Pratama")
                    .division("IT (Teknologi Informasi)")
                    .baseSalary(new BigDecimal("8500000.00"))
                    .allowance(new BigDecimal("1500000.00"))
                    .kpiTarget(100)
                    .kpiAchieved(95)
                    .build(),
                Employee.builder()
                    .email("dewi@exprogio.com")
                    .fullName("Dewi Lestari")
                    .division("Layanan Elektrikal (MEP)")
                    .baseSalary(new BigDecimal("7800000.00"))
                    .allowance(new BigDecimal("1200000.00"))
                    .kpiTarget(100)
                    .kpiAchieved(88)
                    .build(),
                Employee.builder()
                    .email("budi@exprogio.com")
                    .fullName("Budi Santoso")
                    .division("Pembangunan / Sipil")
                    .baseSalary(new BigDecimal("6500000.00"))
                    .allowance(new BigDecimal("1000000.00"))
                    .kpiTarget(100)
                    .kpiAchieved(75)
                    .build()
            );
            employeeRepository.saveAll(initialEmployees);
            System.out.println("🌱 DatabaseSeeder: Seed data karyawan sukses.");
        }

        // 2. Seed Invoices if empty
        if (invoiceRepository.count() == 0) {
            List<Invoice> initialInvoices = List.of(
                Invoice.builder()
                    .invoiceId("INV-001")
                    .clientName("PT Telkom Indonesia")
                    .amount(new BigDecimal("120000000.00"))
                    .balance(BigDecimal.ZERO)
                    .issueDate(LocalDate.now().minusDays(15))
                    .dueDate(LocalDate.now().plusDays(15))
                    .status("Lunas")
                    .build(),
                Invoice.builder()
                    .invoiceId("INV-002")
                    .clientName("PT PLN (Persero)")
                    .amount(new BigDecimal("85000000.00"))
                    .balance(new BigDecimal("85000000.00"))
                    .issueDate(LocalDate.now().minusDays(10))
                    .dueDate(LocalDate.now().plusDays(20))
                    .status("Belum Lunas")
                    .build(),
                Invoice.builder()
                    .invoiceId("INV-003")
                    .clientName("Kementerian PUPR")
                    .amount(new BigDecimal("350000000.00"))
                    .balance(new BigDecimal("350000000.00"))
                    .issueDate(LocalDate.now().minusDays(45))
                    .dueDate(LocalDate.now().minusDays(15))
                    .status("Jatuh Tempo")
                    .build(),
                Invoice.builder()
                    .invoiceId("INV-004")
                    .clientName("PT Adhi Karya")
                    .amount(new BigDecimal("95000000.00"))
                    .balance(new BigDecimal("95000000.00"))
                    .issueDate(LocalDate.now().minusDays(90))
                    .dueDate(LocalDate.now().minusDays(60))
                    .status("Jatuh Tempo")
                    .build()
            );
            invoiceRepository.saveAll(initialInvoices);
            System.out.println("🌱 DatabaseSeeder: Seed data invoice sukses.");
        }

        // 3. Seed Transactions if empty
        if (transactionRepository.count() == 0) {
            List<Transaction> initialTransactions = List.of(
                Transaction.builder()
                    .transactionId("TX-001")
                    .transactionDate(LocalDate.of(2026, 6, 10))
                    .type("Pendapatan")
                    .category("Kontrak Proyek IT")
                    .amount(new BigDecimal("250000000.00"))
                    .description("DP Proyek Pembuatan Aplikasi ERP PT Semen Nusantara")
                    .creatorEmail("admin@exprogio.com")
                    .status("Lunas")
                    .build(),
                Transaction.builder()
                    .transactionId("TX-002")
                    .transactionDate(LocalDate.of(2026, 6, 15))
                    .type("Pendapatan")
                    .category("Instalasi Elektrikal")
                    .amount(new BigDecimal("180000000.00"))
                    .description("Termin 1 Pemasangan Gardu Listrik Pabrik Logam Tangerang")
                    .creatorEmail("admin@exprogio.com")
                    .status("Lunas")
                    .build(),
                Transaction.builder()
                    .transactionId("TX-003")
                    .transactionDate(LocalDate.of(2026, 6, 25))
                    .type("Pengeluaran")
                    .category("Instalasi Elektrikal")
                    .amount(new BigDecimal("60000000.00"))
                    .description("Pembelian Kabel Tembaga NYY 4x95mm Supreme")
                    .creatorEmail("staff@exprogio.com")
                    .status("Lunas")
                    .build(),
                Transaction.builder()
                    .transactionId("TX-004")
                    .transactionDate(LocalDate.of(2026, 6, 28))
                    .type("Pengeluaran")
                    .category("Gaji & Payroll")
                    .amount(new BigDecimal("45000000.00"))
                    .description("Alokasi Penggajian Karyawan & Staff Periode Juni 2026")
                    .creatorEmail("admin@exprogio.com")
                    .status("Lunas")
                    .build(),
                Transaction.builder()
                    .transactionId("TX-005")
                    .transactionDate(LocalDate.of(2026, 7, 1))
                    .type("Pendapatan")
                    .category("Kontrak Proyek IT")
                    .amount(new BigDecimal("120000000.00"))
                    .description("Pelunasan Invoice Proyek Cloud Infrastructure PT Telkom")
                    .creatorEmail("admin@exprogio.com")
                    .status("Lunas")
                    .build(),
                Transaction.builder()
                    .transactionId("TX-006")
                    .transactionDate(LocalDate.of(2026, 7, 2))
                    .type("Pengeluaran")
                    .category("Operasional Kantor")
                    .amount(new BigDecimal("8500000.00"))
                    .description("Sewa Cloud Server AWS Production & Domain Perusahaan")
                    .creatorEmail("staff@exprogio.com")
                    .status("Lunas")
                    .build(),
                Transaction.builder()
                    .transactionId("TX-007")
                    .transactionDate(LocalDate.of(2026, 7, 2))
                    .type("Pengeluaran")
                    .category("Operasional Kantor")
                    .amount(new BigDecimal("2400000.00"))
                    .description("Klaim Reimbursement Transport Pengawasan Sipil Cikarang")
                    .creatorEmail("staff@exprogio.com")
                    .status("Lunas")
                    .build(),
                Transaction.builder()
                    .transactionId("TX-008")
                    .transactionDate(LocalDate.of(2026, 7, 2))
                    .type("Pengeluaran")
                    .category("Instalasi Elektrikal")
                    .amount(new BigDecimal("75000000.00"))
                    .description("Pengadaan Sub-Panel Listrik Proyek Gedung Sudirman Kav 24")
                    .creatorEmail("staff@exprogio.com")
                    .status("Menunggu Approval")
                    .build()
            );
            transactionRepository.saveAll(initialTransactions);
            System.out.println("🌱 DatabaseSeeder: Seed data transaksi sukses.");
        }

        // 4. Seed Users if empty
        if (userRepository.count() == 0) {
            List<com.exprogio.fincorp.model.User> initialUsers = List.of(
                com.exprogio.fincorp.model.User.builder()
                    .email("rudi@exprogio.com")
                    .fullName("Rudi Hermawan")
                    .division("Pembangunan / Sipil")
                    .status("Pending")
                    .build(),
                com.exprogio.fincorp.model.User.builder()
                    .email("santi@exprogio.com")
                    .fullName("Santi Rahayu")
                    .division("Layanan Elektrikal (MEP)")
                    .status("Pending")
                    .build()
            );
            userRepository.saveAll(initialUsers);
            System.out.println("🌱 DatabaseSeeder: Seed data registrasi user sukses.");
        }

        // 5. Seed Investor Documents if empty
        if (investorDocumentRepository.count() == 0) {
            List<InvestorDocument> initialDocs = List.of(
                InvestorDocument.builder().documentId("DOC-2025-AR").title("Annual Report 2025").type("Laporan Tahunan").year("2025").publishDate("15 Mar 2026").url("/docs/ar-2025.pdf").build(),
                InvestorDocument.builder().documentId("DOC-2026-Q1").title("Q1 Financial Statement 2026").type("Laporan Kuartalan").year("2026").publishDate("20 Apr 2026").url("/docs/q1-2026.pdf").build()
            );
            investorDocumentRepository.saveAll(initialDocs);
            System.out.println("🌱 DatabaseSeeder: Seed data dokumen investor sukses.");
        }

        // 6. Seed ESG Metrics if empty
        if (esgMetricRepository.count() == 0) {
            List<ESGMetric> initialEsg = List.of(
                ESGMetric.builder().metricId("ESG-01").category("Lingkungan").name("Reduksi Emisi Karbon").value("14,500").unit("Ton CO2").trend("down").build(),
                ESGMetric.builder().metricId("ESG-02").category("Sosial").name("Rasio Karyawan Perempuan").value("35").unit("%").trend("up").build(),
                ESGMetric.builder().metricId("ESG-03").category("Tata Kelola").name("Skor GCG (Good Corporate Governance)").value("92.5").unit("Poin").trend("stable").build()
            );
            esgMetricRepository.saveAll(initialEsg);
            System.out.println("🌱 DatabaseSeeder: Seed data metrik ESG sukses.");
        }

        // 7. Seed Division Budgets if empty
        if (divisionBudgetRepository.count() == 0) {
            List<DivisionBudget> initialBudgets = List.of(
                DivisionBudget.builder().budgetId("BDG-IT-2026").divisionName("IT (Teknologi Informasi)").allocatedBudget(new BigDecimal("1500000000.00")).usedBudget(new BigDecimal("850000000.00")).period("Tahun 2026").build(),
                DivisionBudget.builder().budgetId("BDG-MEP-2026").divisionName("Layanan Elektrikal (MEP)").allocatedBudget(new BigDecimal("3500000000.00")).usedBudget(new BigDecimal("1200000000.00")).period("Tahun 2026").build(),
                DivisionBudget.builder().budgetId("BDG-SIPIL-2026").divisionName("Pembangunan / Sipil").allocatedBudget(new BigDecimal("5000000000.00")).usedBudget(new BigDecimal("3800000000.00")).period("Tahun 2026").build(),
                DivisionBudget.builder().budgetId("BDG-HR-2026").divisionName("HR & Operasional").allocatedBudget(new BigDecimal("800000000.00")).usedBudget(new BigDecimal("450000000.00")).period("Tahun 2026").build()
            );
            divisionBudgetRepository.saveAll(initialBudgets);
            System.out.println("🌱 DatabaseSeeder: Seed data anggaran divisi sukses.");
        }

        // 8. Seed Vendor Invoices if empty
        if (vendorInvoiceRepository.count() == 0) {
            List<VendorInvoice> initialVendors = List.of(
                VendorInvoice.builder().vendorInvoiceId("V-INV-001").vendorName("PT Holcim Indonesia").amount(new BigDecimal("150000000.00")).issueDate(LocalDate.now().minusDays(20)).dueDate(LocalDate.now().plusDays(10)).status("Belum Dibayar").build(),
                VendorInvoice.builder().vendorInvoiceId("V-INV-002").vendorName("PT Supreme Cable").amount(new BigDecimal("85000000.00")).issueDate(LocalDate.now().minusDays(35)).dueDate(LocalDate.now().minusDays(5)).status("Belum Dibayar").build(),
                VendorInvoice.builder().vendorInvoiceId("V-INV-003").vendorName("CV Trakindo Utama").amount(new BigDecimal("42000000.00")).issueDate(LocalDate.now().minusDays(50)).dueDate(LocalDate.now().minusDays(20)).status("Belum Dibayar").build()
            );
            vendorInvoiceRepository.saveAll(initialVendors);
            System.out.println("🌱 DatabaseSeeder: Seed data tagihan vendor sukses.");
        }
    }
}
