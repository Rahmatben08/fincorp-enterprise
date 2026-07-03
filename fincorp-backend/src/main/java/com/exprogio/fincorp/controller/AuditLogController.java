package com.exprogio.fincorp.controller;

import com.exprogio.fincorp.model.AuditLog;
import com.exprogio.fincorp.repository.AuditLogRepository;
import com.exprogio.fincorp.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/audit-logs")
@CrossOrigin(origins = "*")
public class AuditLogController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private AuditService auditService;

    @GetMapping
    public List<AuditLog> getAllLogs() {
        // Return sorted by logId descending (newest first)
        return auditLogRepository.findAll().stream()
            .sorted((a, b) -> b.getLogId().compareTo(a.getLogId()))
            .toList();
    }

    /**
     * Endpoint umum untuk mencatat aksi manual dari frontend (misalnya: request ACC, approve ACC).
     */
    @PostMapping("/action")
    public ResponseEntity<Void> recordAction(
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader) {

        String action = body.getOrDefault("action", "MANUAL_ACTION");
        String description = body.getOrDefault("description", "Aksi manual dicatat dari frontend.");
        auditService.log(action, description);
        return ResponseEntity.ok().build();
    }
}
