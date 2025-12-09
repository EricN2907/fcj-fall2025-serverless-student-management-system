package com.example.demo.search;

import com.example.demo.dto.Search.SearchResultDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SearchService {

    // Spring tự động inject tất cả các class implements SearchStrategy (UserSearchStrategy, ClassSearchStrategy...) vào list này
    private final List<ISearchService> searchStrategies;

    /**
     * Hàm main xử lý search
     * @param type: students, classes, subjects...
     * @param keyword: từ khóa
     * @param filters: các bộ lọc phụ
     */
    public List<SearchResultDto> executeSearch(String type, String keyword, Map<String, Object> filters) {

        // 1. Tìm Strategy phù hợp
        ISearchService strategy = searchStrategies.stream()
                .filter(s -> s.supports(type))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Search type '" + type + "' is not supported yet."));

        // 2. Thực thi và trả về kết quả
        return strategy.search(keyword, filters);
    }
}