package com.example.demo.controller;

import com.example.demo.search.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<?> search(
            @RequestParam String type,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String filters
    ) {
        Map<String, Object> filterMap = convertJsonToMap(filters);
        return ResponseEntity.ok(searchService.executeSearch(type, keyword, filterMap));
    }

    private Map<String, Object> convertJsonToMap(String json) {
        if (json == null || json.trim().isEmpty()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            System.err.println("Error parsing filters JSON: " + e.getMessage());
            return Collections.emptyMap();
        }
    }
}