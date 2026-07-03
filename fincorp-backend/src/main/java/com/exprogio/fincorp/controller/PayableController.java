package com.exprogio.fincorp.controller;

import com.exprogio.fincorp.model.VendorInvoice;
import com.exprogio.fincorp.repository.VendorInvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payables")
@CrossOrigin(origins = "http://localhost:5173")
public class PayableController {

    @Autowired
    private VendorInvoiceRepository vendorInvoiceRepository;

    @GetMapping
    public List<VendorInvoice> getAllPayables() {
        return vendorInvoiceRepository.findAll();
    }

    @PostMapping
    public VendorInvoice createPayable(@RequestBody VendorInvoice invoice) {
        return vendorInvoiceRepository.save(invoice);
    }
}
