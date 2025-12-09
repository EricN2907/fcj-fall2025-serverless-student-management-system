package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Áp dụng cho tất cả API
                        .allowedOrigins("*") // Cho phép mọi domain (Frontend) truy cập
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                        // QUAN TRỌNG: Phải khai báo user-idToken ở đây
                        .allowedHeaders("Authorization", "Content-Type", "user-idToken", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token")
                        .exposedHeaders("Authorization", "user-idToken");
            }
        };
    }
}