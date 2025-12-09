package com.example.demo.config;

import com.example.demo.util.JwtTokenValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;

/**
 * JWT Authentication Filter
 * Intercept mọi HTTP requests, extract JWT token từ Authorization header,
 * validate token và set SecurityContext nếu hợp lệ
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenValidator jwtTokenValidator;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            // 1. Extract JWT token từ Authorization header
            String token = extractTokenFromRequest(request);

            // 2. Nếu có token và token hợp lệ
            if (token != null && jwtTokenValidator.validateToken(token)) {
                
                // 3. Extract user information từ token
                String userId = jwtTokenValidator.extractUsername(token);
                String email = jwtTokenValidator.extractEmail(token);

                // 4. Tạo Authentication object
                // Note: Có thể customize authorities dựa vào role trong token
                UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(
                        userId,  // principal (user ID)
                        null,    // credentials (không cần password vì đã verify token)
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")) // authorities
                    );

                // 5. Set thêm request details
                authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // 6. Set authentication vào SecurityContext
                // → Từ đây controller có thể lấy user info qua @AuthenticationPrincipal
                SecurityContextHolder.getContext().setAuthentication(authentication);

                System.out.println("✅ Authenticated user: " + userId + " (" + email + ")");
            }

        } catch (Exception e) {
            System.err.println("❌ Cannot set user authentication: " + e.getMessage());
            // Không throw exception, để request tiếp tục và Spring Security sẽ reject
        }

        // 7. Pass request to next filter
        filterChain.doFilter(request, response);
    }

    /**
     * Extract JWT token từ Authorization header
     * Format: "Authorization: Bearer <token>"
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        // Kiểm tra header có format đúng không
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Bỏ "Bearer " prefix
        }

        return null;
    }

    /**
     * Có thể override method này để skip filter cho một số endpoints
     * Ví dụ: public endpoints không cần authentication
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        
        // Các endpoints này không cần JWT authentication
        return path.startsWith("/swagger-ui") ||
               path.startsWith("/v3/api-docs") ||
               path.startsWith("/api-docs");
    }
}
