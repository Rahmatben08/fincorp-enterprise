package com.exprogio.fincorp.controller;

import com.exprogio.fincorp.model.ESGMetric;
import com.exprogio.fincorp.model.InvestorDocument;
import com.exprogio.fincorp.repository.ESGMetricRepository;
import com.exprogio.fincorp.repository.InvestorDocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/investor")
@CrossOrigin(origins = "*")
public class InvestorController {

    @Autowired
    private InvestorDocumentRepository documentRepository;

    @Autowired
    private ESGMetricRepository esgMetricRepository;

    @GetMapping("/documents")
    public List<InvestorDocument> getAllDocuments() {
        return documentRepository.findAll();
    }

    @GetMapping("/esg-metrics")
    public List<ESGMetric> getAllESGMetrics() {
        return esgMetricRepository.findAll();
    }
}
