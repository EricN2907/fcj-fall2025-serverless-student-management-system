package com.example.demo.service;

import com.example.demo.dto.User.UpdateProfileRequest;
import com.example.demo.dto.User.UserDto;
import com.example.demo.entity.SchoolItem;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.Expression;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class UserService {

    private final DynamoDbEnhancedClient dynamoDbClient;
    private final S3Service s3Service;

    @Value("${aws.dynamodb.table-name}")
    private String tableName;

    // Helper lấy bảng
    private DynamoDbTable<SchoolItem> getTable() {
        return dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
    }

    // =========================================================
    // 1. GET PROFILE (Tìm theo Email)
    // =========================================================
    public UserDto getMyProfile(String email) {
        DynamoDbTable<SchoolItem> table = getTable();

        // Lưu ý: Dùng scan hơi chậm nếu dữ liệu lớn, nhưng với logic hiện tại thì OK
        AttributeValue emailVal = AttributeValue.builder().s(email).build();
        Expression filter = Expression.builder()
                .expression("email = :emailVal")
                .expressionValues(Collections.singletonMap(":emailVal", emailVal))
                .build();

        var results = table.scan(r -> r.filterExpression(filter));
        SchoolItem userItem = results.items().stream().findFirst().orElse(null);

        if (userItem == null) {
            throw new IllegalArgumentException("Không tìm thấy thông tin user với email: " + email);
        }

        return convertToUserDto(userItem);
    }

    // =========================================================
    // 2. UPDATE PROFILE
    // =========================================================
    public UserDto updateProfile(String email, UpdateProfileRequest request) {
        DynamoDbTable<SchoolItem> table = getTable();

        // 1. Tìm User (Logic scan cũ của bạn giữ nguyên - dù hơi chậm nhưng logic đúng)
        AttributeValue emailVal = AttributeValue.builder().s(email).build();
        Expression filter = Expression.builder()
                .expression("email = :emailVal")
                .expressionValues(Collections.singletonMap(":emailVal", emailVal))
                .build();

        SchoolItem userItem = table.scan(r -> r.filterExpression(filter))
                .items().stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 2. Cập nhật thông tin
        boolean isNameChanged = false;
        if (request.getName() != null && !request.getName().isEmpty()) {
            userItem.setName(request.getName());
            isNameChanged = true;
        }

        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isEmpty()) {
            userItem.setDateOfBirth(request.getDateOfBirth());
        }

        // --- LOGIC FILE MỚI ---
        // if (request.getAvatarFile() != null...) upload... <-- XÓA

        // Thay bằng: Lấy link trực tiếp từ request
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isEmpty()) {
            userItem.setAvatar(request.getAvatarUrl());
        }

        // 3. Cập nhật GSI Name để search được
        if (isNameChanged) {
            // Lưu ý: Cần toLowerCase() để search không phân biệt hoa thường chuẩn hơn
            userItem.setGsi1Sk("NAME#" + request.getName().toLowerCase());
        }

        userItem.setUpdatedAt(java.time.Instant.now().toString());

        // 4. Lưu xuống DB
        table.updateItem(userItem);

        return convertToUserDto(userItem);
    }


    private UserDto convertToUserDto(SchoolItem item) {
        return UserDto.builder()
                .id(item.getId())
                .codeUser(item.getCodeUser())
                .name(item.getName())
                .email(item.getEmail())
                .dateOfBirth(item.getDateOfBirth())
                .role(item.getRoleName())
                .codeUser(item.getCodeUser())
                .avatar(item.getAvatar())
                .build();
    }
}