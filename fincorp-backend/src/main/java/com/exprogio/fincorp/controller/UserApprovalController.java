package com.exprogio.fincorp.controller;

import com.exprogio.fincorp.model.Employee;
import com.exprogio.fincorp.model.User;
import com.exprogio.fincorp.repository.EmployeeRepository;
import com.exprogio.fincorp.repository.UserRepository;
import com.exprogio.fincorp.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/user-approvals")
@CrossOrigin(origins = "*")
public class UserApprovalController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AuditService auditService;

    @GetMapping
    public List<User> getPendingUsers() {
        return userRepository.findByStatus("Pending");
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        if (user.getEmail() == null || user.getEmail().isEmpty()) {
            return ResponseEntity.badRequest().body("Email wajib diisi.");
        }
        if (userRepository.existsById(user.getEmail())) {
            return ResponseEntity.badRequest().body("Email sudah terdaftar.");
        }
        
        user.setStatus("Pending");
        User saved = userRepository.save(user);
        
        auditService.log("REGISTER_STAFF", 
                "Pendaftaran staf baru diajukan: " + user.getFullName() + " (" + user.getEmail() + ")");
        
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{email}/approve")
    public ResponseEntity<?> approveUser(@PathVariable String email, @RequestParam boolean approve, @RequestHeader(value = "X-User-Email", required = false) String emailHeader) {
        return userRepository.findById(email).map(user -> {
            String actor = (emailHeader != null) ? emailHeader : "admin@exprogio.com";
            
            if (approve) {
                user.setStatus("Active");
                userRepository.save(user);

                // Add to Employee Directory if not present
                if (employeeRepository.findByEmail(email).isEmpty()) {
                    Employee newEmp = Employee.builder()
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .division(user.getDivision())
                        .baseSalary(new BigDecimal("5000000.00")) // default salary
                        .allowance(new BigDecimal("500000.00"))
                        .kpiTarget(100)
                        .kpiAchieved(0)
                        .build();
                    employeeRepository.save(newEmp);
                }
                
                auditService.log("APPROVE_USER", 
                        "Menyetujui pendaftaran staf baru: " + user.getFullName() + " (" + email + ")");
            } else {
                userRepository.delete(user);
                auditService.log("REJECT_USER", 
                        "Menolak pendaftaran staf baru: " + user.getFullName() + " (" + email + ")");
            }
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
