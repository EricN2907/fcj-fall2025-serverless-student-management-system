package com.example.demo.search;

import com.example.demo.dto.Search.SearchResultDto;

import java.util.List;
import java.util.Map;

public interface ISearchService {
    // Kiểm tra xem Strategy này hỗ trợ loại tìm kiếm nào (student, class...)
    boolean supports(String type);

    // Thực thi tìm kiếm
    List<SearchResultDto> search(String keyword, Map<String, Object> filters);
}