package com.hearth.config;

import com.hearth.security.JwtAuthenticationFilter;
import com.hearth.security.RestAuthHandlers;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthHandlers restAuthHandlers;
    private final List<String> corsOrigins;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RestAuthHandlers restAuthHandlers,
            @Value("${hearth.cors-origins}") String corsOrigins
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.restAuthHandlers = restAuthHandlers;
        this.corsOrigins = Arrays.stream(corsOrigins.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint(restAuthHandlers)
                        .accessDeniedHandler(restAuthHandlers))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()
                        .requestMatchers("/api/auth/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/menu/**").permitAll()
                        .requestMatchers("/api/menu/**").hasAuthority("MENU_MANAGE")
                        .requestMatchers(HttpMethod.POST, "/api/orders").hasAuthority("ORDER_CREATE")
                        .requestMatchers(HttpMethod.POST, "/api/orders/*/cancel").hasAuthority("ORDER_CANCEL")
                        .requestMatchers(HttpMethod.PATCH, "/api/orders/*/status").hasAuthority("ORDER_UPDATE")
                        .requestMatchers(HttpMethod.PUT, "/api/orders/*").hasAuthority("ORDER_UPDATE")
                        .requestMatchers(HttpMethod.GET, "/api/orders", "/api/orders/*").hasAuthority("ORDER_VIEW")
                        .requestMatchers(HttpMethod.POST, "/api/seat-requests").permitAll()
                        .requestMatchers("/api/seat-requests", "/api/seat-requests/**").hasAuthority("TABLE_VIEW")
                        .requestMatchers(HttpMethod.GET, "/api/tables").hasAnyAuthority("TABLE_VIEW", "ORDER_CREATE")
                        .requestMatchers(HttpMethod.PATCH, "/api/tables/*/status").hasAuthority("TABLE_VIEW")
                        .requestMatchers("/api/tables", "/api/tables/**").hasAuthority("TABLE_MANAGE")
                        .requestMatchers("/api/reports", "/api/reports/**").hasAuthority("REPORT_VIEW")
                        .requestMatchers("/api/roles", "/api/roles/**").hasAuthority("ROLE_MANAGE")
                        .requestMatchers(HttpMethod.GET, "/api/permissions").hasAuthority("ROLE_MANAGE")
                        .requestMatchers("/api/users", "/api/users/**").hasAnyAuthority("USER_MANAGE", "STAFF_MANAGE")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(corsOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterRegistration(JwtAuthenticationFilter filter) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }
}
