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
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ClassSearchStrategy implements ISearchService {

    private final DynamoDbEnhancedClient dynamoDbClient;

    @Override
    public boolean supports(String type) {
        return "classes".equalsIgnoreCase(type);
    }

    @Value("${aws.dynamodb.table-name}")
    private String tableName;

    @Override
    public List<SearchResultDto> search(String keyword, Map<String, Object> filters) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
        DynamoDbIndex<SchoolItem> index = table.index("GSI1");


        String prefix = "NAME#" + (keyword != null ? keyword : "");

        QueryConditional queryConditional = QueryConditional.sortBeginsWith(k -> k
                .partitionValue("TYPE#CLASS")  // GSI1PK
                .sortValue(prefix)             // GSI1SK (Chỉ truyền chuỗi "NAME#...", ko dùng lambda)
        );
        Expression filterExpression = null;
        if (filters != null && filters.containsKey("semester")) {
            String sem = (String) filters.get("semester");
            // Cú pháp: attribute_name = :value
            filterExpression = Expression.builder()
                    .expression("#sem = :sem")
                    .putExpressionName("#sem", "semester")
                    .putExpressionValue(":sem", AttributeValue.builder().s(sem).build())
                    .build();
        }

        // 3. Query
        List<SearchResultDto> results = new ArrayList<>();

        var queryRequest = software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest.builder()
                .queryConditional(queryConditional)
                .filterExpression(filterExpression) // Add filter nếu có
                .build();

        for (Page<SchoolItem> page : index.query(queryRequest)) {
            for (SchoolItem item : page.items()) {
                results.add(mapToDto(item));
            }
        }
        return results;
    }

    private SearchResultDto mapToDto(SchoolItem item) {
        return SearchResultDto.builder()
                .id(item.getPk()) // CLASS#id
                .title(item.getName())
                .subtitle(item.getCodeSubject())
                .type("class")
                .extraInfo(item.getSemester() + " - Room: " + item.getRoom())
                .build();
    }
}
