package com.example.demo.service;

import com.example.demo.entity.SchoolItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j // 1. Dùng Logger thay vì System.out
public class SchoolService {

    private final DynamoDbEnhancedClient enhancedClient;

    @Value("${aws.dynamodb.table-name}")
    private String tableName;

    private DynamoDbTable<SchoolItem> getTable() {
        return enhancedClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
    }

    // ========================================================================
    // 1. CÁC HÀM GHI DỮ LIỆU (WRITE)
    // ========================================================================

    /**
     * Lưu thông tin User mới
     */
    public void saveUser(SchoolItem user) {
        getTable().putItem(user);
        log.info("Đã lưu User thành công vào DynamoDB: {}", user.getPk());
    }
    public SchoolItem getUserProfile(String userId) {
        String pk = userId.startsWith("USER#") ? userId : "USER#" + userId;

        Key key = Key.builder()
                .partitionValue(pk)
                .sortValue("PROFILE")
                .build();

        return getTable().getItem(key);
    }


    public SchoolItem getClassInfo(String classId) {
        // Tương tự, xử lý prefix cho an toàn
        String pk = classId.startsWith("CLASS#") ? classId : "CLASS#" + classId;

        Key key = Key.builder()
                .partitionValue(pk)
                .sortValue("INFO")
                .build();

        return getTable().getItem(key);
    }

    public List<SchoolItem> getStudentClasses(String studentId) {
        // Xử lý prefix
        String partitionKeyVal = studentId.startsWith("USER#") ? studentId : "USER#" + studentId;
        QueryConditional queryConditional = QueryConditional.keyEqualTo(k ->
                k.partitionValue(partitionKeyVal));

        // Query và map kết quả ra List (Viết kiểu Java Stream cho gọn)
        return getTable().index("GSI1")
                .query(r -> r.queryConditional(queryConditional))
                .stream()
                .flatMap(page -> page.items().stream())
                .filter(item -> item.getGsi1Sk() != null && item.getGsi1Sk().startsWith("CLASS#"))
                .collect(Collectors.toList());
    }
    public List<SchoolItem> getNotifications(String userId) {
        DynamoDbTable<SchoolItem> table = getTable();

        // 1. LẤY THÔNG BÁO RIÊNG
        String pkUser = userId.startsWith("USER#") ? userId : "USER#" + userId;
        QueryConditional userQc = QueryConditional.sortBeginsWith(k -> k.partitionValue(pkUser).sortValue("NOTI#"));
        List<SchoolItem> userNotis = table.query(r -> r.queryConditional(userQc)).items().stream().collect(Collectors.toList());

        // 2. LẤY THÔNG BÁO HỆ THỐNG
        QueryConditional systemQc = QueryConditional.sortBeginsWith(k -> k.partitionValue("NOTI#SYSTEM").sortValue("NOTI#"));
        List<SchoolItem> systemNotis = table.query(r -> r.queryConditional(systemQc)).items().stream().collect(Collectors.toList());

        // 3. GỘP LẠI & SẮP XẾP (Đã fix lỗi Null)
        List<SchoolItem> allNotis = new ArrayList<>();
        allNotis.addAll(userNotis);
        allNotis.addAll(systemNotis);

        return allNotis.stream()
                // --- SỬA ĐOẠN NÀY ---
                // Nếu createdAt == null thì trả về "" (chuỗi rỗng), ngược lại lấy giá trị thật
                // Comparator.reverseOrder() sẽ đưa ngày mới nhất lên đầu, chuỗi rỗng xuống cuối
                .sorted(Comparator.comparing(
                        (SchoolItem item) -> item.getCreatedAt() != null ? item.getCreatedAt() : "",
                        Comparator.reverseOrder()
                ))
                .collect(Collectors.toList());
    }
}