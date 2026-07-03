package com.exprogio.fincorp.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_invoices")
public class VendorInvoice {

    @Id
    @Column(name = "vendor_invoice_id", length = 50)
    private String vendorInvoiceId;

    @Column(name = "vendor_name", nullable = false, length = 150)
    private String vendorName;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false, length = 50)
    private String status; // 'Belum Dibayar', 'Lunas'

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public VendorInvoice() {}

    public VendorInvoice(String vendorInvoiceId, String vendorName, BigDecimal amount, LocalDate issueDate, LocalDate dueDate, String status) {
        this.vendorInvoiceId = vendorInvoiceId;
        this.vendorName = vendorName;
        this.amount = amount;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.status = status;
    }

    public String getVendorInvoiceId() {
        return vendorInvoiceId;
    }

    public void setVendorInvoiceId(String vendorInvoiceId) {
        this.vendorInvoiceId = vendorInvoiceId;
    }

    public String getVendorName() {
        return vendorName;
    }

    public void setVendorName(String vendorName) {
        this.vendorName = vendorName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String vendorInvoiceId;
        private String vendorName;
        private BigDecimal amount;
        private LocalDate issueDate;
        private LocalDate dueDate;
        private String status;

        public Builder vendorInvoiceId(String vendorInvoiceId) {
            this.vendorInvoiceId = vendorInvoiceId;
            return this;
        }

        public Builder vendorName(String vendorName) {
            this.vendorName = vendorName;
            return this;
        }

        public Builder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public Builder issueDate(LocalDate issueDate) {
            this.issueDate = issueDate;
            return this;
        }

        public Builder dueDate(LocalDate dueDate) {
            this.dueDate = dueDate;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public VendorInvoice build() {
            return new VendorInvoice(vendorInvoiceId, vendorName, amount, issueDate, dueDate, status);
        }
    }
}
