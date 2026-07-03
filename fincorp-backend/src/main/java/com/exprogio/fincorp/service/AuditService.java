package com.exprogio.fincorp.service;

import com.exprogio.fincorp.model.AuditLog;
import com.exprogio.fincorp.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private HttpServletRequest request;

    @Transactional
    public void log(String action, String description) {
        String email = "Anonymous";
        String role = "guest";

        // 1. Coba baca dari header mock (profil pg-local / dev-local)
        String mockEmail = request.getHeader("X-User-Email");
        String mockRole = request.getHeader("X-User-Role");
        if (mockEmail != null && !mockEmail.isEmpty()) {
            email = mockEmail;
            role = (mockRole != null) ? mockRole : "staff";
        } else {
            // 2. Fallback: baca dari JWT token (profil production dengan Keycloak)
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof Jwt) {
                Jwt jwt = (Jwt) auth.getPrincipal();
                email = jwt.getClaim("preferred_username") != null
                        ? jwt.getClaim("preferred_username")
                        : jwt.getSubject();

                Map<String, Object> realmAccess = jwt.getClaim("realm_access");
                if (realmAccess != null && realmAccess.containsKey("roles")) {
                    @SuppressWarnings("unchecked")
                    List<String> roles = (List<String>) realmAccess.get("roles");
                    role = roles.stream()
                            .filter(r -> r.equals("superadmin") || r.equals("admin") || r.equals("manager") || r.equals("staff"))
                            .findFirst()
                            .orElse("guest");
                }
            } else if (auth != null) {
                // MockUserFilter mengeset authentication.getName() sebagai email
                email = auth.getName();
                role = auth.getAuthorities().stream()
                        .map(a -> a.getAuthority().replace("ROLE_", "").toLowerCase())
                        .findFirst()
                        .orElse("guest");
            }
        }

        String ipAddress = request.getRemoteAddr();
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = "127.0.0.1";
        }

        AuditLog log = AuditLog.builder()
                .userEmail(email)
                .roleName(role)
                .action(action)
                .description(description)
                .ipAddress(ipAddress)
                .build();

        auditLogRepository.save(log);
    }
}
