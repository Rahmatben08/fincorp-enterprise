package com.exprogio.fincorp.repository;

import com.exprogio.fincorp.model.VendorInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorInvoiceRepository extends JpaRepository<VendorInvoice, String> {
    List<VendorInvoice> findByStatus(String status);
}
