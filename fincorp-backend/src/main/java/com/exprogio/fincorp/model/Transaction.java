package com.exprogio.fincorp.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @Column(name = "transaction_id", length = 50)
    private String transactionId;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(nullable = false, length = 20)
    private String type; // 'Pendapatan', 'Pengeluaran'

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "creator_email", nullable = false, length = 150)
    private String creatorEmail;

    @Column(nullable = false, length = 50)
    private String status; // 'Lunas', 'Menunggu Approval', 'Ditolak'

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Transaction() {}

    public Transaction(String transactionId, LocalDate transactionDate, String type, String category, BigDecimal amount, String description, String creatorEmail, String status) {
        this.transactionId = transactionId;
        this.transactionDate = transactionDate;
        this.type = type;
        this.category = category;
        this.amount = amount;
        this.description = description;
        this.creatorEmail = creatorEmail;
        this.status = status;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDate transactionDate) {
        this.transactionDate = transactionDate;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCreatorEmail() {
        return creatorEmail;
    }

    public void setCreatorEmail(String creatorEmail) {
        this.creatorEmail = creatorEmail;
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
        private String transactionId;
        private LocalDate transactionDate;
        private String type;
        private String category;
        private BigDecimal amount;
        private String description;
        private String creatorEmail;
        private String status;

        public Builder transactionId(String transactionId) {
            this.transactionId = transactionId;
            return this;
        }

        public Builder transactionDate(LocalDate transactionDate) {
            this.transactionDate = transactionDate;
            return this;
        }

        public Builder type(String type) {
            this.type = type;
            return this;
        }

        public Builder category(String category) {
            this.category = category;
            return this;
        }

        public Builder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder creatorEmail(String creatorEmail) {
            this.creatorEmail = creatorEmail;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Transaction build() {
            return new Transaction(transactionId, transactionDate, type, category, amount, description, creatorEmail, status);
        }
    }
}
