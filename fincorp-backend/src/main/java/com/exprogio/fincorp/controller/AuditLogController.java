package com.exprogio.fincorp.controller;

import com.exprogio.fincorp.model.AuditLog;
import com.exprogio.fincorp.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/audit-logs")
@CrossOrigin(origins = "*")
public class AuditLogController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @GetMapping
    public List<AuditLog> getAllLogs() {
        // Return sorted by logId descending (newest first)
        return auditLogRepository.findAll().stream()
            .sorted((a, b) -> b.getLogId().compareTo(a.getLogId()))
            .toList();
    }
}
