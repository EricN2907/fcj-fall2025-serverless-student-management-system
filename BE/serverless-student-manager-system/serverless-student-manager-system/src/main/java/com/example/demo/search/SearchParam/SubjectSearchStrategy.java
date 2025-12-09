package com.example.demo.search.SearchParam;

import com.example.demo.dto.Search.SearchResultDto;
import com.example.demo.entity.SchoolItem;
import com.example.demo.search.ISearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.model.Page;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class SubjectSearchStrategy implements ISearchService {

    private final DynamoDbEnhancedClient dynamoDbClient;
    @Value("${aws.dynamodb.table-name}")
    private String tableName;
    @Override
    public boolean supports(String type) {
        return "subject".equalsIgnoreCase(type) || "subjects".equalsIgnoreCase(type);
    }
    @Override
    public List<SearchResultDto> search(String keyword, Map<String, Object> filters) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
        DynamoDbIndex<SchoolItem> index = table.index("GSI1");
        String gsi1Pk = "TYPE#SUBJECT";
        QueryConditional queryConditional;
        if (keyword != null && !keyword.isEmpty()) {
            String prefix = "NAME#" + keyword.toLowerCase();
            queryConditional = QueryConditional.sortBeginsWith(k -> k
                    .partitionValue(gsi1Pk)
                    .sortValue(prefix)
            );
        } else {
            queryConditional = QueryConditional.keyEqualTo(k -> k.partitionValue(gsi1Pk));
        }
        Map<String, AttributeValue> expressionValues = new HashMap<>();
        Map<String, String> expressionNames = new HashMap<>();
        List<String> filterExpressions = new ArrayList<>();

        // Filter: Department
        if (filters.containsKey("department")) {
            String dept = (String) filters.get("department");
            filterExpressions.add("#dept = :deptVal");
            expressionNames.put("#dept", "department");
            expressionValues.put(":deptVal", AttributeValue.builder().s(dept).build());
        }

        // Filter: Status (Xử lý ép kiểu an toàn)
        if (filters.containsKey("status")) {
            Object statusObj = filters.get("status");
            // Kiểm tra xem nó là Integer hay String để parse cho đúng
            Integer status = (statusObj instanceof Integer) ? (Integer) statusObj : Integer.parseInt(statusObj.toString());

            filterExpressions.add("#sts = :stsVal");
            expressionNames.put("#sts", "status");
            expressionValues.put(":stsVal", AttributeValue.builder().n(status.toString()).build());
        }
        Expression filterExpression = null;
        if (!filterExpressions.isEmpty()) {
            String finalExpression = String.join(" AND ", filterExpressions);
            filterExpression = Expression.builder()
                    .expression(finalExpression)
                    .expressionValues(expressionValues)
                    .expressionNames(expressionNames)
                    .build();
        }
        QueryEnhancedRequest queryRequest = QueryEnhancedRequest.builder()
                .queryConditional(queryConditional)
                .filterExpression(filterExpression)
                .build();

        List<SearchResultDto> results = new ArrayList<>();
        for (Page<SchoolItem> page : index.query(queryRequest)) {
            for (SchoolItem item : page.items()) {
                results.add(mapToDto(item));
            }
        }
        return results;
    }
    private SearchResultDto mapToDto(SchoolItem item) {
        // 1. Xử lý Subject ID (Lấy từ codeSubject hoặc cắt PK)
        // Nếu DB có cột codeSubject thì dùng, nếu không thì cắt chuỗi SUBJECT#...
        String rawSubjectId = item.getCodeSubject();
        if (rawSubjectId == null && item.getPk() != null) {
            rawSubjectId = item.getPk().replace("SUBJECT#", "");
        }

        return SearchResultDto.builder()
                .id(item.getPk())            // ID đầy đủ: SUBJECT#SWP391
                .title(item.getName())       // Tên môn: Software Project
                .subtitle(rawSubjectId)      // ID sạch: SWP391 (Dùng cái này làm subject_id)
                .type("subject")
                .createdAt(item.getCreatedAt())
                .status(item.getStatus())
                .build();
    }
}