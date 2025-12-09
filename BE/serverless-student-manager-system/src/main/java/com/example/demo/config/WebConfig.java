package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.core.convert.converter.Converter;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new Converter<String, MultipartFile>() {
            @Override
            public MultipartFile convert(String source) {
                // Convert empty string to null for MultipartFile fields
                if (source == null || source.trim().isEmpty()) {
                    return null;
                }
                throw new IllegalArgumentException("Cannot convert non-empty string to MultipartFile");
            }
        });
    }
}
