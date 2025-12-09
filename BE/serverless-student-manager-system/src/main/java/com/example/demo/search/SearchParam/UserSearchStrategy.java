package com.example.demo.search.SearchParam;

import com.example.demo.dto.Search.SearchResultDto;
import com.example.demo.entity.SchoolItem;
import com.example.demo.search.ISearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbIndex;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.Page;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class UserSearchStrategy implements ISearchService {

    private final DynamoDbEnhancedClient dynamoDbClient;

    @Value("${aws.dynamodb.table-name}")
    private String tableName;

    @Override
    public boolean supports(String type) {
        if (type == null) return false;
        String t = type.toLowerCase();
        return t.equals("student") || t.equals("students") ||
                t.equals("lecturer") || t.equals("lecturers");
    }

    @Override
    public List<SearchResultDto> search(String keyword, Map<String, Object> filters) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
        DynamoDbIndex<SchoolItem> index = table.index("GSI1");

        // FIX LOGIC: Xác định Role dựa vào filter được truyền từ Controller
        // Controller cần đảm bảo truyền type hoặc role vào trong map filters khi gọi searchService
        String roleType = "STUDENT"; // Default
        if (filters != null && filters.containsKey("role")) {
            roleType = filters.get("role").toString().toUpperCase();
        } else if (filters != null && filters.containsKey("type")) {
            // Fallback: Nếu controller đẩy type gốc vào filters
            String t = filters.get("type").toString().toUpperCase();
            if (t.contains("LECTURER")) roleType = "LECTURER";
        }

        // GSI1PK: ROLE#STUDENT hoặc ROLE#LECTURER
        String gsi1PkValue = "ROLE#" + roleType;

        String normalizedKeyword = (keyword != null) ? keyword.toLowerCase() : "";
        String prefixInfo = "NAME#" + normalizedKeyword;

        QueryConditional queryConditional = QueryConditional.sortBeginsWith(k -> k
                .partitionValue(gsi1PkValue)
                .sortValue(prefixInfo)
        );

        List<SearchResultDto> results = new ArrayList<>();

        // Sử dụng try-catch để tránh lỗi nếu index không tồn tại hoặc lỗi mạng
        try {
            for (Page<SchoolItem> page : index.query(queryConditional)) {
                for (SchoolItem item : page.items()) {
                    results.add(mapToDto(item));
                }
            }
        } catch (Exception e) {
            // Log lỗi nếu cần
            e.printStackTrace();
        }

        return results;
    }

    private SearchResultDto mapToDto(SchoolItem item) {
        return SearchResultDto.builder()
                .id(item.getPk())
                .title(item.getName())
                .subtitle(item.getEmail())
                .avatar(item.getAvatar())
                .type(item.getRoleName())
                .extraInfo(item.getCodeUser())
                .build();
    }
}