package com.exprogio.fincorp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.*;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Profile;

@Configuration
@EnableWebSecurity
@Profile("!dev-local & !pg-local")
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoint
                .requestMatchers("/public/**").permitAll()
                
                // 1. Dashboard Module
                .requestMatchers(HttpMethod.GET, "/dashboard/**").hasAnyRole("superadmin", "admin", "manager", "staff")
                
                // 2. Pendapatan & Pengeluaran Module (Transactions)
                .requestMatchers(HttpMethod.GET, "/transactions/**").hasAnyRole("superadmin", "admin", "manager", "staff")
                .requestMatchers(HttpMethod.POST, "/transactions").hasAnyRole("superadmin", "admin", "staff")
                
                // 3. Approvals Module
                .requestMatchers(HttpMethod.POST, "/transactions/*/approve").hasAnyRole("superadmin", "manager")
                
                // 4. Invoicing Module
                .requestMatchers(HttpMethod.GET, "/invoices/**").hasAnyRole("superadmin", "admin", "manager", "staff")
                .requestMatchers(HttpMethod.POST, "/invoices").hasAnyRole("superadmin", "admin", "staff")
                .requestMatchers(HttpMethod.PUT, "/invoices/*/pay").hasAnyRole("superadmin", "admin", "manager")
                .requestMatchers(HttpMethod.POST, "/invoices/*/reminder").hasAnyRole("superadmin", "admin", "staff")
                
                // 5. Payroll Module
                .requestMatchers(HttpMethod.GET, "/payroll/my").hasRole("staff") // own slip
                .requestMatchers(HttpMethod.GET, "/payroll/**").hasAnyRole("superadmin", "admin", "manager")
                .requestMatchers(HttpMethod.POST, "/payroll/process").hasAnyRole("superadmin", "admin")
                .requestMatchers(HttpMethod.PUT, "/payroll/*/approve").hasAnyRole("superadmin", "manager")
                
                // 6. Laporan Keuangan Module
                .requestMatchers(HttpMethod.GET, "/reports/**").hasAnyRole("superadmin", "admin", "manager")
                
                // 7. Manajemen User & Role
                .requestMatchers("/user-approvals/**").hasAnyRole("superadmin", "admin")
                
                // 8. Audit Log Module
                .requestMatchers(HttpMethod.GET, "/audit-logs/**").hasAnyRole("superadmin", "admin", "manager")
                .requestMatchers(HttpMethod.DELETE, "/audit-logs").hasRole("superadmin")
                
                // Catch-all
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            );
            
        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter());
        return converter;
    }

    public Converter<Jwt, Collection<GrantedAuthority>> jwtGrantedAuthoritiesConverter() {
        return jwt -> {
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess == null || !realmAccess.containsKey("roles")) {
                return Collections.emptyList();
            }
            
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) realmAccess.get("roles");
            
            return roles.stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .collect(Collectors.toList());
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
