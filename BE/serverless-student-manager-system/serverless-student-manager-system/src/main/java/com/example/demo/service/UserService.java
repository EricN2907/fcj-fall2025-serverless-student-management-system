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
import java.util.UUID; // <--- Cần thêm import này

@Service
@RequiredArgsConstructor
public class UserService {

    private final DynamoDbEnhancedClient dynamoDbClient;
    // private final S3Service s3Service; // Nếu không dùng S3Service ở đây có thể bỏ

    @Value("${aws.dynamodb.table-name}")
    private String tableName;

    // Helper lấy bảng
    private DynamoDbTable<SchoolItem> getTable() {
        return dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
    }

    // =========================================================
    // 1. GET PROFILE (Tích hợp Auto-Register cho Google)
    // =========================================================
    public UserDto getMyProfile(String email) {
        DynamoDbTable<SchoolItem> table = getTable();

        // 1. Tìm User trong DB bằng Email
        AttributeValue emailVal = AttributeValue.builder().s(email).build();
        Expression filter = Expression.builder()
                .expression("email = :emailVal")
                .expressionValues(Collections.singletonMap(":emailVal", emailVal))
                .build();

        // Dùng scan để tìm (do PK là UUID, không biết trước)
        SchoolItem userItem = table.scan(r -> r.filterExpression(filter))
                .items().stream().findFirst()
                .orElse(null);

        // 2. [QUAN TRỌNG] Logic cho Google Login
        // Nếu tìm không thấy -> Nghĩa là user mới login Google lần đầu -> TẠO LUÔN
        if (userItem == null) {
            return createGoogleUserInDb(email);
        }

        // 3. Nếu có rồi thì map sang DTO trả về như bình thường
        return convertToUserDto(userItem);
    }

    // =========================================================
    // HÀM MỚI: Tự động tạo User Google vào DB
    // =========================================================
    private UserDto createGoogleUserInDb(String email) {
        DynamoDbTable<SchoolItem> table = getTable();

        // 1. Tạo ID mới
        String newUuid = UUID.randomUUID().toString();

        // 2. Tạo Item
        SchoolItem newUser = new SchoolItem();
        newUser.setPk("USER#" + newUuid);
        newUser.setSk("PROFILE");

        // 3. Điền thông tin cơ bản từ Email
        newUser.setId(newUuid);
        newUser.setEmail(email);

        // Lấy phần trước @ làm tên tạm (VD: tuan.nguyen)
        String tempName = email.split("@")[0];
        newUser.setName(tempName);

        newUser.setRoleName("STUDENT");       // Mặc định Google vào là Student
        newUser.setStatus(1);                 // Active luôn

        // 4. Set GSI để sau này search được (Quan trọng cho Admin search)
        newUser.setGsi1Pk("ROLE#STUDENT");
        newUser.setGsi1Sk("NAME#" + tempName.toLowerCase());

        // 5. Avatar mặc định theo tên
        newUser.setAvatar("https://ui-avatars.com/api/?name=" + tempName);

        newUser.setCreatedAt(java.time.Instant.now().toString());

        // 6. Lưu vào DB
        table.putItem(newUser);

        // 7. Trả về DTO ngay để FE hiển thị
        return convertToUserDto(newUser);
    }

    // =========================================================
    // 2. UPDATE PROFILE
    // =========================================================
    public UserDto updateProfile(String email, UpdateProfileRequest request) {
        DynamoDbTable<SchoolItem> table = getTable();

        // 1. Tìm User
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

        // Lấy link avatar trực tiếp từ request (Do FE đã upload S3 và có link/key)
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isEmpty()) {
            userItem.setAvatar(request.getAvatarUrl());
        }

        // 3. Cập nhật GSI Name để search được
        if (isNameChanged) {
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
                .codeUser(item.getCodeUser()) // Có thể null nếu là user Google mới
                .name(item.getName())
                .email(item.getEmail())
                .dateOfBirth(item.getDateOfBirth())
                .role(item.getRoleName())
                .avatar(item.getAvatar())
                .status(item.getStatus())
                .build();
    }
}