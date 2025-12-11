package com.example.demo.service;

import com.example.demo.dto.Admin.RegisterUserDto;
import com.example.demo.dto.Class.ClassDto;
import com.example.demo.dto.Class.CreateClassRequest;
import com.example.demo.dto.Class.SendNotificationDto;
import com.example.demo.dto.Class.UpdateClassDto;
import com.example.demo.dto.Enroll.EnrollStudentDto;
import com.example.demo.dto.Enum.Role;
import com.example.demo.dto.Log.LogDto;
import com.example.demo.dto.Subjects.CreateSubjectDto;
import com.example.demo.dto.Subjects.UpdateSubjectDto;
import com.example.demo.dto.Search.SubjectDto;
import com.example.demo.dto.User.UserDto;
import com.example.demo.entity.SchoolItem;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.model.Page;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;
import org.springframework.beans.factory.annotation.Value;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.eventbridge.EventBridgeClient;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequest;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequestEntry;
import lombok.extern.slf4j.Slf4j;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j  
public class AdminService {

    private final DynamoDbEnhancedClient dynamoDbClient;
    private final CognitoIdentityProviderClient cognitoClient;
    private final ObjectMapper objectMapper;
    private final EventBridgeClient eventBridgeClient;

    @Value("${aws.cognito.user-pool-id}")
    private String userPoolId;
    @Value("${aws.dynamodb.table-name}")
    private String tableName;
    @Value("${aws.eventbridge.bus-name:default}")
    private String eventBusName;

    public String createUser(RegisterUserDto request) {

        // 1. XỬ LÝ NGÀY THÁNG (Giữ nguyên - Code này ok)
        String storageDateOfBirth = null;
        if (request.getDOB() != null && !request.getDOB().isEmpty()) {
            try {
                DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
                LocalDate date = LocalDate.parse(request.getDOB(), inputFormatter);
                storageDateOfBirth = date.toString();
            } catch (DateTimeParseException e) {
                throw new IllegalArgumentException("Ngày sinh không đúng định dạng dd-MM-yyyy");
            }
        }

        // 2. XỬ LÝ ROLE (Giữ nguyên)
        Role role = Role.fromId(request.getRole_id());

        // 3. TẠO USER TRÊN COGNITO (️ ĐOẠN QUAN TRỌNG ĐÃ SỬA)
        try {
            AdminCreateUserRequest cognitoRequest = AdminCreateUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(request.getEmail())
                    .temporaryPassword(request.getPassword())
                    .desiredDeliveryMediums(DeliveryMediumType.EMAIL)
                    .userAttributes(
                            AttributeType.builder().name("email").value(request.getEmail()).build(),
                            AttributeType.builder().name("custom:role").value(role.getCognitoRoleName()).build(),
                            AttributeType.builder().name("name").value(request.getName()).build(),
                            AttributeType.builder().name("email_verified").value("true").build()
                    )
                    .build();
            AdminAddUserToGroupRequest groupRequest = AdminAddUserToGroupRequest.builder()
                    .userPoolId(userPoolId)
                    .username(request.getEmail())
                    .groupName(role.getCognitoRoleName().toUpperCase())
                    .build();
            cognitoClient.adminCreateUser(cognitoRequest);

        } catch (CognitoIdentityProviderException e) {
            throw new RuntimeException("Lỗi Cognito: " + e.awsErrorDetails().errorMessage());
        }
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
        String finalId;
        if (request.getCodeUser() != null && !request.getCodeUser().isEmpty()) {
            finalId = request.getCodeUser().toUpperCase(); // Ví dụ: SE182088
        } else {
            finalId = UUID.randomUUID().toString(); // Fallback nếu không nhập mã
        }
        SchoolItem newItem = new SchoolItem();
        newItem.setPk("USER#" + finalId); // PK: USER#SE182088
        newItem.setSk("PROFILE");
        newItem.setGsi1Pk(role.getSearchKey());
        newItem.setGsi1Sk("NAME#" + request.getName().toLowerCase());
        newItem.setId(finalId);
        newItem.setName(request.getName());
        newItem.setEmail(request.getEmail());
        newItem.setRoleName(role.getCognitoRoleName());
        newItem.setCodeUser(request.getCodeUser());

        // Avatar tạo tự động theo tên
        newItem.setAvatar("https://ui-avatars.com/api/?name=" + request.getName().replace(" ", "+"));

        newItem.setStatus(1);
        newItem.setDateOfBirth(storageDateOfBirth);

        table.putItem(newItem);

        return finalId;
    }

    public SubjectDto updateSubject(String codeSubject, UpdateSubjectDto request) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
        String pk = "SUBJECT#" + codeSubject;
        Key key = Key.builder().partitionValue(pk).sortValue("INFO").build();
        SchoolItem item = table.getItem(key);
        if (item == null) {
            throw new IllegalArgumentException("Không tìm thấy môn học có mã: " + codeSubject);
        }
        boolean isNameChanged = false;
        if (request.getName() != null && !request.getName().isEmpty()) {
            item.setName(request.getName());
            isNameChanged = true;
        }
        if (request.getCredits() != null) item.setCredits(request.getCredits());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getDepartment() != null) item.setDepartment(request.getDepartment());
        if (request.getStatus() != null) item.setStatus(request.getStatus());
        if (isNameChanged) {
            item.setGsi1Sk("NAME#" + request.getName().toLowerCase());
        }
        item.setUpdatedAt(java.time.Instant.now().toString());
        table.updateItem(item);
        return convertToSubjectDto(item);
    }
    public SubjectDto getSubjectByCode(String codeSubject) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
        Key key = Key.builder()
                .partitionValue("SUBJECT#" + codeSubject)
                .sortValue("INFO")
                .build();
        SchoolItem item = table.getItem(key);
        if (item == null) {
            throw new IllegalArgumentException("Không tìm thấy môn học với mã: " + codeSubject);
        }
        return convertToSubjectDto(item);
    }
    public SubjectDto createSubject(CreateSubjectDto request) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
        if (request.getCodeSubject() == null || request.getCodeSubject().trim().isEmpty()) {
            throw new IllegalArgumentException("Mã môn học (codeSubject) không được để trống.");
        }
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên môn học (name) không được để trống.");
        }
        if (request.getCredits() == null || request.getCredits() <= 0) {
            throw new IllegalArgumentException("Số tín chỉ (credits) phải lớn hơn 0.");
        }
        String cleanCode = request.getCodeSubject().toUpperCase().trim();
        String pk = "SUBJECT#" + cleanCode;
        Key key = Key.builder().partitionValue(pk).sortValue("INFO").build();
        if (table.getItem(key) != null) {
            throw new IllegalArgumentException("Môn học với mã " + cleanCode + " đã tồn tại trong hệ thống.");
        }
        SchoolItem item = new SchoolItem();
        item.setPk(pk);
        item.setSk("INFO");

        item.setGsi1Pk("TYPE#SUBJECT");
        item.setGsi1Sk("NAME#" + request.getName().toLowerCase()); // Để search theo tên (lowercase)
        item.setId(pk); // Lưu lại ID đầy đủ
        item.setCodeSubject(cleanCode);
        item.setName(request.getName());
        item.setCredits(request.getCredits());
        item.setDescription(request.getDescription());
        item.setDepartment(request.getDepartment());
        item.setStatus(request.getStatus() != null ? request.getStatus() : 1);
        String now = Instant.now().toString();
        item.setCreatedAt(now);
        item.setUpdatedAt(now);
        table.putItem(item);
        logActivity("ADMIN", "CREATE_SUBJECT", "Tạo môn học mới: " + cleanCode + " - " + request.getName(), null);
        return convertToSubjectDto(item);
    }

    public void softDeleteSubject(String codeSubject) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
        Key key = Key.builder()
                .partitionValue("SUBJECT#" + codeSubject)
                .sortValue("INFO")
                .build();
        SchoolItem item = table.getItem(key);

        if (item == null) {
            throw new IllegalArgumentException("Không tìm thấy môn học: " + codeSubject);
        }
        item.setStatus(0);
        item.setUpdatedAt(java.time.Instant.now().toString());
        table.updateItem(item);
        System.out.println("LOG: Admin đã xóa mềm môn học " + codeSubject);
    }

    public List<UserDto> searchUsers(Integer roleId, String keyword) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
        DynamoDbIndex<SchoolItem> index = table.index("GSI1");
        Expression filterExpression = null;
        if (keyword != null && !keyword.isEmpty()) {
            String kw = keyword.toLowerCase(); // Chuyển về chữ thường để tìm tương đối
            String exp = "contains(GSI1SK, :kw) OR contains(email, :kw) OR contains(codeUser, :kw)";

            filterExpression = Expression.builder()
                    .expression(exp)
                    .putExpressionValue(":kw", AttributeValue.builder().s(kw).build())
                    .build();
        }
        List<SchoolItem> items = new ArrayList<>();
        if (roleId != null) {
            String roleKey = Role.fromId(roleId).getSearchKey();
            QueryConditional queryConditional = QueryConditional.keyEqualTo(k -> k.partitionValue(roleKey));
            var queryRequest = software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest.builder()
                    .queryConditional(queryConditional)
                    .filterExpression(filterExpression) // Gắn bộ lọc keyword
                    .build();
            for (Page<SchoolItem> page : index.query(queryRequest)) {
                items.addAll(page.items());
            }

        } else {
            var scanBuilder = software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest.builder();

            if (filterExpression != null) {
                scanBuilder.filterExpression(filterExpression);
            }
            for (Page<SchoolItem> page : table.scan(scanBuilder.build())) {
                for (SchoolItem item : page.items()) {
                    if (item.getPk() != null && item.getPk().startsWith("USER#")) {
                        items.add(item);
                    }
                }
            }
        }
        return items.stream()
                .map(this::convertToUserDto) // Hàm helper ở cuối file AdminService
                .collect(Collectors.toList());
    }

    public List<ClassDto> searchClasses(String subjectId, String teacherId, String keyword, Integer status) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
        DynamoDbIndex<SchoolItem> index = table.index("GSI1");
        QueryConditional queryConditional = QueryConditional.keyEqualTo(k -> k.partitionValue("TYPE#CLASS"));
        List<String> expressions = new ArrayList<>();
        Map<String, AttributeValue> values = new HashMap<>();
        Map<String, String> names = new HashMap<>();
        if (subjectId != null && !subjectId.isEmpty()) {
            String subKey = subjectId.startsWith("SUBJECT#") ? subjectId : "SUBJECT#" + subjectId;
            expressions.add("subject_id = :subId");
            values.put(":subId", AttributeValue.builder().s(subKey).build());
        }
        if (teacherId != null && !teacherId.isEmpty()) {
            String teachKey = teacherId.startsWith("USER#") ? teacherId : "USER#" + teacherId;
            expressions.add("teacher_id = :teachId");
            values.put(":teachId", AttributeValue.builder().s(teachKey).build());
        }
        if (status != null) {
            expressions.add("#st = :status");
            values.put(":status", AttributeValue.builder().n(String.valueOf(status)).build());
            names.put("#st", "status");
        }
        if (keyword != null && !keyword.isEmpty()) {
            expressions.add("contains(#n, :kw)");
            values.put(":kw", AttributeValue.builder().s(keyword).build());
            names.put("#n", "name");
        }
        Expression.Builder expressionBuilder = Expression.builder();
        if (!expressions.isEmpty()) {
            String finalExp = String.join(" AND ", expressions);
            expressionBuilder.expression(finalExp);
            expressionBuilder.expressionValues(values);
            if (!names.isEmpty()) {
                expressionBuilder.expressionNames(names);
            }
        }

        var queryRequestBuilder = software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest.builder()
                .queryConditional(queryConditional)
                .limit(1000);
        if (!expressions.isEmpty()) {
            queryRequestBuilder.filterExpression(expressionBuilder.build());
        }

        List<SchoolItem> items = new ArrayList<>();

        for (Page<SchoolItem> page : index.query(queryRequestBuilder.build())) {
            items.addAll(page.items());
        }

        return items.stream()
                .map(this::convertToClassDto)
                .collect(Collectors.toList());
    }

    public ClassDto updateClass(String classId, UpdateClassDto request) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));

        String pk = classId.startsWith("CLASS#") ? classId : "CLASS#" + classId;
        Key key = Key.builder().partitionValue(pk).sortValue("INFO").build();

        SchoolItem classItem = table.getItem(key);
        if (classItem == null) {
            throw new IllegalArgumentException("Không tìm thấy lớp học có ID: " + classId);
        }
        if (request.getTeacherId() != null && !request.getTeacherId().isEmpty()) {

            String newTeacherPk = request.getTeacherId().startsWith("USER#")
                    ? request.getTeacherId()
                    : "USER#" + request.getTeacherId();

            String oldTeacherPk = classItem.getTeacherId();
            if (!newTeacherPk.equals(oldTeacherPk)) {
                createNotification(
                        table,
                        newTeacherPk,
                        "Phân công giảng dạy mới",
                        "Bạn vừa được phân công dạy lớp: " + classItem.getName(),
                        "CLASS_ASSIGNMENT"
                );
                if (oldTeacherPk != null && !oldTeacherPk.isEmpty()) {
                    createNotification(
                            table,
                            oldTeacherPk,
                            "Thay đổi phân công giảng dạy",
                            "Bạn đã bị hủy phân công khỏi lớp: " + classItem.getName(),
                            "CLASS_ASSIGNMENT"
                    );
                }
                classItem.setTeacherId(newTeacherPk);

            }
        }
        boolean isNameChanged = false;
        if (request.getName() != null && !request.getName().isEmpty()) {
            classItem.setName(request.getName());
            isNameChanged = true;
        }
        if (request.getPassword() != null) classItem.setPassword(request.getPassword());
        if (request.getSemester() != null) classItem.setSemester(request.getSemester());
        if (request.getAcademicYear() != null) classItem.setAcademicYear(request.getAcademicYear());
        if (request.getDescription() != null) classItem.setDescription(request.getDescription());
        if (request.getStatus() != null) classItem.setStatus(request.getStatus());
        if (isNameChanged) {
            classItem.setGsi1Sk("NAME#" + request.getName().toLowerCase());
        }
        classItem.setUpdatedAt(Instant.now().toString());
        table.updateItem(classItem);
        String detail = "Cập nhật lớp " + classItem.getName();
        if (request.getTeacherId() != null) detail += ". GV mới: " + request.getTeacherId();
        logActivity("ADMIN", "UPDATE_CLASS", detail, classId);
        return convertToClassDto(classItem);
    }

    public void deactivateClass(String classId) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
        String pk = classId.startsWith("CLASS#") ? classId : "CLASS#" + classId;
        Key key = Key.builder().partitionValue(pk).sortValue("INFO").build();

        SchoolItem classItem = table.getItem(key);
        if (classItem == null) {
            throw new IllegalArgumentException("Không tìm thấy lớp học có ID: " + classId);
        }

        classItem.setStatus(0);
        classItem.setUpdatedAt(Instant.now().toString());
        logActivity("ADMIN", "DEACTIVATE_CLASS", "Đã hủy hoạt động lớp: " + classItem.getName(), classId);
        table.updateItem(classItem);
    }

    public void deactivateUser(String userId) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
        String pk = userId.startsWith("USER#") ? userId : "USER#" + userId;
        Key key = Key.builder().partitionValue(pk).sortValue("PROFILE").build();

        SchoolItem userItem = table.getItem(key);
        if (userItem == null) {
            throw new IllegalArgumentException("Không tìm thấy user với ID: " + userId);
        }
        userItem.setStatus(0);
        userItem.setUpdatedAt(Instant.now().toString());
        table.updateItem(userItem);
        logActivity("ADMIN", "DEACTIVATE_USER", "Đã khóa tài khoản: " + userItem.getEmail(), null);
    }
    //

    public void updateStatusId(String userId, int status) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
        String cleanId = userId.replace("USER#", "").trim();
        String pk = "USER#" + cleanId;
        Key key = Key.builder().partitionValue(pk).sortValue("PROFILE").build();
        SchoolItem userItem = table.getItem(key);
        if (userItem == null) {
            throw new IllegalArgumentException("Không tìm thấy user với ID: " + cleanId);
        }
        userItem.setStatus(status);
        userItem.setUpdatedAt(Instant.now().toString());
        table.updateItem(userItem);
        String actionType = (status == 1) ? "ACTIVATE_USER" : "DEACTIVATE_USER";
        String actionDesc = (status == 1)
                ? "Đã mở khóa tài khoản: " + userItem.getEmail()
                : "Đã khóa tài khoản: " + userItem.getEmail();

        logActivity("ADMIN", actionType, actionDesc, null);
    }
    // ========================================================================
    // 4. API GỬI THÔNG BÁO THỦ CÔNG (MANUAL)
    // ========================================================================
    public void sendManualNotification(String senderName, SendNotificationDto request) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));

        String now = Instant.now().toString();
        SchoolItem notification = new SchoolItem();

        // --- LOGIC GỬI TOÀN HỆ THỐNG ---
        // Nếu userId bị null, rỗng hoặc là "ALL" -> Lưu vào Hộp thư chung
        if (request.getUserId() == null || request.getUserId().trim().isEmpty() || "ALL".equalsIgnoreCase(request.getUserId())) {
            notification.setPk("NOTI#SYSTEM"); // <--- Key chung cho cả làng
        } else {
            // Gửi riêng cho 1 người
            String userIdRaw = request.getUserId();
            String targetPk = userIdRaw.startsWith("USER#") ? userIdRaw : "USER#" + userIdRaw;
            notification.setPk(targetPk);
        }
        // -------------------------------

        notification.setSk("NOTI#" + System.currentTimeMillis());
        notification.setTitle(request.getTitle());
        notification.setContent(request.getContent());

        // Mặc định type là SYSTEM_ALERT nếu gửi chung
        notification.setType((request.getType() != null) ? request.getType() : "SYSTEM_ALERT");

        notification.setIsRead(false); // Với thông báo chung, field này mang tính tượng trưng
        notification.setCreatedAt(now);
        notification.setSentBy(senderName);
        notification.setSentAt(now);

        if (request.getClassId() != null) notification.setClassId(request.getClassId());

        table.putItem(notification);
    }

    public List<LogDto> getAuditLogs(String userId, String classId, String date) {
        // 1. Tự khai báo biến table (Theo cách bạn muốn)
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
        DynamoDbIndex<SchoolItem> index = table.index("GSI1");
        QueryConditional queryConditional = QueryConditional.keyEqualTo(k -> k.partitionValue("TYPE#LOG"));

        List<String> expressions = new ArrayList<>();
        Map<String, AttributeValue> values = new HashMap<>();

        if (userId != null && !userId.isEmpty()) {
            String actorKey = userId.startsWith("USER#") ? userId : "USER#" + userId;
            expressions.add("actor_id = :uid");
            values.put(":uid", AttributeValue.builder().s(actorKey).build());
        }
        if (classId != null && !classId.isEmpty()) {
            String classKey = classId.startsWith("CLASS#") ? classId : "CLASS#" + classId;
            expressions.add("target_class_id = :cid");
            values.put(":cid", AttributeValue.builder().s(classKey).build());
        }
        if (date != null && !date.isEmpty()) {
            expressions.add("contains(GSI1SK, :dt)");
            values.put(":dt", AttributeValue.builder().s(date).build());
        }

        Expression.Builder builder = Expression.builder();
        if (!expressions.isEmpty()) {
            builder.expression(String.join(" AND ", expressions));
            builder.expressionValues(values);
        }

        QueryEnhancedRequest.Builder req = QueryEnhancedRequest.builder()
                .queryConditional(queryConditional).scanIndexForward(false).limit(1000);
        if (!expressions.isEmpty()) req.filterExpression(builder.build());

        List<SchoolItem> items = new ArrayList<>();
        for (Page<SchoolItem> page : index.query(req.build())) {
            items.addAll(page.items());
        }

        return items.stream().map(item -> LogDto.builder()
                .id(item.getId())
                .userId(item.getActorId() != null ? item.getActorId().replace("USER#", "") : null)
                .classId(item.getTargetClassId() != null ? item.getTargetClassId().replace("CLASS#", "") : null)
                .actionType(item.getActionType())
                .details(item.getLogDetails())
                .timestamp(item.getCreatedAt())
                .build()
        ).collect(Collectors.toList());
    }

    public void enrollStudent(EnrollStudentDto request) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
        // 1. Chuẩn hóa ID (Thêm/Bỏ prefix để khớp với DB)
        String classPk = request.getClassId().startsWith("CLASS#") ? request.getClassId() : "CLASS#" + request.getClassId();
        String studentIdRaw = request.getStudentId().startsWith("USER#") ? request.getStudentId().replace("USER#", "") : request.getStudentId();
        String studentPk = "USER#" + studentIdRaw;

        // 2. Kiểm tra Lớp học (Tồn tại & Status & Sĩ số)
        Key classKey = Key.builder().partitionValue(classPk).sortValue("INFO").build();
        SchoolItem classItem = table.getItem(classKey);

        if (classItem == null) {
            throw new IllegalArgumentException("Lớp học không tồn tại: " + request.getClassId());
        }

        // Check Status lớp (Nếu lớp đã bị hủy/inactive thì không cho vào)
        if (classItem.getStatus() != null && classItem.getStatus() == 0) {
            throw new IllegalArgumentException("Lớp học này đã bị hủy hoặc ngừng hoạt động.");
        }

        // Check Sĩ số <= 40
        int currentCount = classItem.getStudentCount() != null ? classItem.getStudentCount() : 0;
        if (currentCount >= 40) {
            throw new IllegalArgumentException("Lớp học đã đầy (Tối đa 40 sinh viên).");
        }

        // 3. Kiểm tra Sinh viên (Tồn tại trong hệ thống không?)
        Key studentKey = Key.builder().partitionValue(studentPk).sortValue("PROFILE").build();
        SchoolItem studentItem = table.getItem(studentKey);

        if (studentItem == null) {
            throw new IllegalArgumentException("Sinh viên không tồn tại: " + request.getStudentId());
        }

        // 4. Kiểm tra đã Enroll chưa (Tránh trùng lặp)
        // PK=CLASS#... SK=STUDENT#...
        Key enrollmentKey = Key.builder().partitionValue(classPk).sortValue("STUDENT#" + studentIdRaw).build();
        if (table.getItem(enrollmentKey) != null) {
            throw new IllegalArgumentException("Sinh viên này đã có trong lớp rồi.");
        }

        // 5. THỰC HIỆN ENROLL (Ghi Enrollment Record)
        SchoolItem enrollment = new SchoolItem();
        enrollment.setPk(classPk);                  // PK = CLASS#SE1701
        enrollment.setSk("STUDENT#" + studentIdRaw);// SK = STUDENT#SE182088

        // GSI1 để tìm "Sinh viên này học những lớp nào"
        enrollment.setGsi1Pk(studentPk);            // GSI1PK = USER#SE182088
        enrollment.setGsi1Sk(classPk);              // GSI1SK = CLASS#SE1701

        enrollment.setJoinedAt(Instant.now().toString());
        enrollment.setStatus(1); // 1 = Enrolled (Active)

        table.putItem(enrollment);

        // 6. CẬP NHẬT SĨ SỐ LỚP (+1)
        classItem.setStudentCount(currentCount + 1);
        classItem.setUpdatedAt(Instant.now().toString());
        table.updateItem(classItem);

        // 7. GỬI THÔNG BÁO CHO SINH VIÊN (Dùng hàm helper có sẵn)
        createNotification(
                table,
                studentPk,
                "Đăng ký lớp thành công",
                "Bạn đã được thêm vào lớp " + classItem.getName() + ". Hãy kiểm tra lịch học nhé!",
                "CLASS_ENROLLMENT"
        );

        // 8. Ghi Log Admin (Dùng hàm helper có sẵn)
        logActivity("ADMIN", "ENROLL_STUDENT", "Thêm SV " + studentIdRaw + " vào lớp " + classItem.getName(), request.getClassId());
    }

    public void createClass(CreateClassRequest request) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));

        // --- SỬA Ở ĐÂY ---
        // 1. Chỉ lấy mã Random, KHÔNG thêm chữ "CLASS_" vào biến này
        String uniqueCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 2. Nếu bạn muốn ID hiển thị với user có format "CLASS_XXXX" thì nối ở đây (Optional)
        // Nhưng recommend là để ID trần (uniqueCode) cho dễ xử lý
        String classId = uniqueCode;

        String now = Instant.now().toString();
        SchoolItem item = new SchoolItem();

        // --- SỬA KEYS ---
        // PK sẽ là: CLASS#A1B2C3D4 (Chuẩn, đẹp)
        item.setPk("CLASS#" + classId);
        item.setSk("INFO");

        item.setGsi1Pk("TYPE#CLASS");
        item.setGsi1Sk("NAME#" + request.getName().toLowerCase());

        item.setId(classId);            // Lưu ID là: A1B2C3D4
        // item.setId("CLASS_" + classId); // Hoặc nếu bạn BẮT BUỘC muốn ID phải có chữ CLASS_ thì mở dòng này

        item.setClassId(classId);
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setPassword(request.getPassword());

        // --- LƯU Ý QUAN TRỌNG VỀ SUBJECT ID ---
        // Nếu request.getSubjectId() là số (Int), nhưng DB Subject ID là "SWP391" (String)
        // Thì chỗ này coi chừng bị lỗi logic data. Bạn nên check lại kiểu dữ liệu.
        // Nếu subjectId bên kia là String thì:
        if (request.getSubjectId() != null) {
            // Đảm bảo lưu đúng format SUBJECT#CODE để sau này query
            // Ví dụ: item.setSubjectId("SUBJECT#" + request.getSubjectId());
            item.setSubjectId(String.valueOf(request.getSubjectId()));
        }

        item.setSemester(request.getSemester());
        item.setAcademicYear(request.getAcademicYear());
        item.setTeacherId(request.getTeacherId());
        item.setStatus(request.getStatus() != null ? request.getStatus() : 1);
        item.setCreatedAt(now);
        item.setUpdatedAt(now);

        try {
            table.putItem(item);
            log.info("Successfully created class: {}", classId);
        } catch (Exception e) {
            log.error("Error creating class", e);
            throw new RuntimeException("Failed to create class in database");
        }

        triggerNotifyLecturer(item);
    }

    // --- HELPER CHUNG: createNotification (Đã tổng quát hóa) ---
    private void createNotification(DynamoDbTable<SchoolItem> table, String userId, String title, String content, String type) {
        SchoolItem noti = new SchoolItem();
        noti.setPk(userId);
        noti.setSk("NOTI#" + Instant.now().toString());

        noti.setTitle(title);
        noti.setContent(content);

        noti.setType(type); // CLASS_ASSIGNMENT hoặc SYSTEM_ALERT
        noti.setIsRead(false);
        noti.setCreatedAt(Instant.now().toString());

        table.putItem(noti);
    }

    private void createAssignmentNotification(DynamoDbTable<SchoolItem> table, String teacherPk, String title, String content) {
        SchoolItem noti = new SchoolItem();
        noti.setPk(teacherPk);
        noti.setSk("NOTI#" + Instant.now().toString());

        noti.setTitle(title);      // Tiêu đề động
        noti.setContent(content);  // Nội dung động

        noti.setType("CLASS_ASSIGNMENT");
        noti.setIsRead(false);
        noti.setCreatedAt(Instant.now().toString());

        table.putItem(noti);
    }

    // Hàm phụ trợ Convert (Helper)
    private ClassDto convertToClassDto(SchoolItem item) {
        // Cắt bỏ prefix SUBJECT# và USER# để trả về ID sạch cho FE
        String cleanSubjectId = item.getSubjectId() != null ? item.getSubjectId().replace("SUBJECT#", "") : null;
        String cleanTeacherId = item.getTeacherId() != null ? item.getTeacherId().replace("USER#", "") : null;

        return ClassDto.builder()
                .id(item.getId()) // ID lớp: SE1701
                .name(item.getName())
                .subjectId(cleanSubjectId)
                .teacherId(cleanTeacherId)
                .room(item.getRoom())
                .semester(item.getSemester())
                .academicYear(item.getAcademicYear())
                // Nếu null thì trả về 0
                .studentCount(item.getStudentCount() != null ? item.getStudentCount() : 0)
                .status(item.getStatus())
                .description(item.getDescription())
                .build();
    }
    // Hàm phụ trợ (nếu chưa có thì thêm vào cuối file AdminService)
    private UserDto convertToUserDto(SchoolItem item) {

        return UserDto.builder()
                .id(item.getId())
                .name(item.getName())
                .email(item.getEmail())
                .role(item.getRoleName())
                .codeUser(item.getCodeUser())
                .dateOfBirth(item.getDateOfBirth())
                .avatar(item.getAvatar())
                .status(item.getStatus())
                .build();
    }


    private void triggerNotifyLecturer(SchoolItem item) {
        // Chỉ gửi thông báo nếu lớp có gán giảng viên (teacherId)
        if (item.getTeacherId() == null || item.getTeacherId().isEmpty()) {
            return;
        }

        try {
            // Tạo Payload JSON event
            String eventDetail = objectMapper.writeValueAsString(item);

            PutEventsRequestEntry entry = PutEventsRequestEntry.builder()
                    .source("com.fpt.education.lms")   // Nguồn phát event (Do bạn tự đặt)
                    .detailType("ClassCreated")        // Tên loại event để Rule bắt
                    .detail(eventDetail)               // Nội dung data
                    .eventBusName(eventBusName)
                    .build();

            PutEventsRequest eventsRequest = PutEventsRequest.builder()
                    .entries(entry)
                    .build();

            eventBridgeClient.putEvents(eventsRequest);
            log.info("Triggered EventBridge 'ClassCreated' for teacher: {}", item.getTeacherId());

        } catch (Exception e) {
            // Log lỗi nhưng KHÔNG throw exception để tránh rollback transaction tạo lớp
            log.warn("Failed to trigger EventBridge notification: {}", e.getMessage());
        }
    }

    // ==========================================
    // HÀM PHỤ TRỢ: Chuyển đổi từ Entity sang DTO
    // ==========================================
    private SubjectDto convertToSubjectDto(SchoolItem item) {
        return SubjectDto.builder()
                .id(item.getPk())
                .codeSubject(item.getCodeSubject())
                .name(item.getName())
                .credits(item.getCredits())
                .department(item.getDepartment())
                .status(item.getStatus())
                .description(item.getDescription())
                .build();
    }

    // ========================================================================
    // HELPER: GHI LOG HOẠT ĐỘNG (Dùng để gọi trong các hàm Update/Delete)
    // ========================================================================
    public void logActivity(String actorId, String actionType, String details, String targetClassId) {
        System.out.println("--- START LOGGING ---");
        System.out.println("Table Name: " + tableName); // 1. Kiểm tra xem tên bảng có null không?

        try {
            SchoolItem logItem = new SchoolItem();
            String logId = UUID.randomUUID().toString();
            String timestamp = Instant.now().toString();

            // Mapping Keys
            logItem.setPk("LOG#" + logId);
            logItem.setSk("INFO");

            // Mapping GSI (Quan trọng để tìm kiếm sau này)
            logItem.setGsi1Pk("TYPE#LOG");
            logItem.setGsi1Sk("TIMESTAMP#" + timestamp);

            logItem.setId(logId);

            // Xử lý logic Actor (Người thực hiện)
            String finalActorId = (actorId == null) ? "UNKNOWN" :
                    (actorId.startsWith("USER#") || actorId.equals("ADMIN") ? actorId : "USER#" + actorId);
            logItem.setActorId(finalActorId);

            logItem.setActionType(actionType);
            logItem.setLogDetails(details);

            // Xử lý Target Class
            if (targetClassId != null) {
                String finalClassId = targetClassId.startsWith("CLASS#") ? targetClassId : "CLASS#" + targetClassId;
                logItem.setTargetClassId(finalClassId);
            }

            logItem.setCreatedAt(timestamp);

            System.out.println("Item to save: " + logItem.toString()); // 2. Kiểm tra dữ liệu trước khi lưu

            // Lưu vào DB
            DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
            table.putItem(logItem);

            System.out.println("LOG SUCCESS: Đã ghi log " + actionType);

        } catch (Exception e) {
            System.err.println("!!! LOG ERROR !!!");
            e.printStackTrace(); // 3. In toàn bộ Stack Trace để thấy rõ lỗi gì
        }
    }
}