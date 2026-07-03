package com.exprogio.fincorp.repository;

import com.exprogio.fincorp.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {
    
    List<List<Object>> findByCreatorEmail(String email);
    
    List<Transaction> findByStatus(String status);
    
    @Query("SELECT t FROM Transaction t WHERE (:type IS NULL OR t.type = :type) AND (:status IS NULL OR t.status = :status) AND (:category IS NULL OR t.category = :category)")
    List<Transaction> filterTransactions(
        @Param("type") String type, 
        @Param("status") String status, 
        @Param("category") String category
    );
}
