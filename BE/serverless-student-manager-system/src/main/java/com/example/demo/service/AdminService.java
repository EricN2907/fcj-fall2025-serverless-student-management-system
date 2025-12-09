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

        Role role = Role.fromId(request.getRole_id());

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
            cognitoClient.adminCreateUser(cognitoRequest);

        } catch (CognitoIdentityProviderException e) {
            throw new RuntimeException("Lỗi Cognito: " + e.awsErrorDetails().errorMessage());
        }

        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));

        String finalId;
        if (request.getCodeUser() != null && !request.getCodeUser().isEmpty()) {
            finalId = request.getCodeUser().toUpperCase();
        } else {
            finalId = UUID.randomUUID().toString();
        }

        SchoolItem newItem = new SchoolItem();

        newItem.setPk("USER#" + finalId);
        newItem.setSk("PROFILE");
        newItem.setGsi1Pk(role.getSearchKey());
        newItem.setGsi1Sk("NAME#" + request.getName().toLowerCase());

        newItem.setId(finalId);
        newItem.setName(request.getName());
        newItem.setEmail(request.getEmail());
        newItem.setRoleName(role.getCognitoRoleName());
        newItem.setCodeUser(request.getCodeUser());

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
        item.setGsi1Sk("NAME#" + request.getName().toLowerCase());
        item.setId(pk);
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
    }

    public List<UserDto> searchUsers(Integer roleId, String keyword) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
        DynamoDbIndex<SchoolItem> index = table.index("GSI1");
        Expression filterExpression = null;
        if (keyword != null && !keyword.isEmpty()) {
            String kw = keyword.toLowerCase();
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
                    .filterExpression(filterExpression)
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
                .map(this::convertToUserDto)
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

    public void sendManualNotification(String adminId, SendNotificationDto request) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));

        String userIdRaw = request.getUserId();
        String targetPk = userIdRaw.startsWith("USER#") ? userIdRaw : "USER#" + userIdRaw;

        SchoolItem notification = new SchoolItem();

        notification.setPk(targetPk);
        notification.setSk("NOTI#" + System.currentTimeMillis());

        notification.setTitle(request.getTitle());
        notification.setContent(request.getContent());

        String notiType = (request.getType() != null && !request.getType().isEmpty())
                ? request.getType()
                : "SYSTEM_ALERT";
        notification.setType(notiType);

        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now().toString());

        notification.setSentBy(adminId);
        notification.setSentAt(LocalDateTime.now().toString());

        if (request.getClassId() != null && !request.getClassId().isEmpty()) {
            notification.setClassId(request.getClassId());
        } else {
            notification.setClassId(null);
        }

        table.putItem(notification);
    }

    public List<LogDto> getAuditLogs(String userId, String classId, String date) {
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
        String classPk = request.getClassId().startsWith("CLASS#") ? request.getClassId() : "CLASS#" + request.getClassId();
        String studentIdRaw = request.getStudentId().startsWith("USER#") ? request.getStudentId().replace("USER#", "") : request.getStudentId();
        String studentPk = "USER#" + studentIdRaw;

        Key classKey = Key.builder().partitionValue(classPk).sortValue("INFO").build();
        SchoolItem classItem = table.getItem(classKey);

        if (classItem == null) {
            throw new IllegalArgumentException("Lớp học không tồn tại: " + request.getClassId());
        }

        if (classItem.getStatus() != null && classItem.getStatus() == 0) {
            throw new IllegalArgumentException("Lớp học này đã bị hủy hoặc ngừng hoạt động.");
        }

        int currentCount = classItem.getStudentCount() != null ? classItem.getStudentCount() : 0;
        if (currentCount >= 40) {
            throw new IllegalArgumentException("Lớp học đã đầy (Tối đa 40 sinh viên).");
        }

        Key studentKey = Key.builder().partitionValue(studentPk).sortValue("PROFILE").build();
        SchoolItem studentItem = table.getItem(studentKey);

        if (studentItem == null) {
            throw new IllegalArgumentException("Sinh viên không tồn tại: " + request.getStudentId());
        }

        Key enrollmentKey = Key.builder().partitionValue(classPk).sortValue("STUDENT#" + studentIdRaw).build();
        if (table.getItem(enrollmentKey) != null) {
            throw new IllegalArgumentException("Sinh viên này đã có trong lớp rồi.");
        }

        SchoolItem enrollment = new SchoolItem();
        enrollment.setPk(classPk);
        enrollment.setSk("STUDENT#" + studentIdRaw);

        enrollment.setGsi1Pk(studentPk);
        enrollment.setGsi1Sk(classPk);

        enrollment.setJoinedAt(Instant.now().toString());
        enrollment.setStatus(1);

        table.putItem(enrollment);

        classItem.setStudentCount(currentCount + 1);
        classItem.setUpdatedAt(Instant.now().toString());
        table.updateItem(classItem);

        createNotification(
                table,
                studentPk,
                "Đăng ký lớp thành công",
                "Bạn đã được thêm vào lớp " + classItem.getName() + ". Hãy kiểm tra lịch học nhé!",
                "CLASS_ENROLLMENT"
        );

        logActivity("ADMIN", "ENROLL_STUDENT", "Thêm SV " + studentIdRaw + " vào lớp " + classItem.getName(), request.getClassId());
    }

    public void createClass(CreateClassRequest request) {
        DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));

        String uniqueCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        String classId = uniqueCode;

        String now = Instant.now().toString();
        SchoolItem item = new SchoolItem();

        item.setPk("CLASS#" + classId);
        item.setSk("INFO");

        item.setGsi1Pk("TYPE#CLASS");
        item.setGsi1Sk("NAME#" + request.getName().toLowerCase());

        item.setId(classId);

        item.setClassId(classId);
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setPassword(request.getPassword());

        if (request.getSubjectId() != null) {
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

    private void createNotification(DynamoDbTable<SchoolItem> table, String userId, String title, String content, String type) {
        SchoolItem noti = new SchoolItem();
        noti.setPk(userId);
        noti.setSk("NOTI#" + Instant.now().toString());

        noti.setTitle(title);
        noti.setContent(content);

        noti.setType(type);
        noti.setIsRead(false);
        noti.setCreatedAt(Instant.now().toString());

        table.putItem(noti);
    }

    private void createAssignmentNotification(DynamoDbTable<SchoolItem> table, String teacherPk, String title, String content) {
        SchoolItem noti = new SchoolItem();
        noti.setPk(teacherPk);
        noti.setSk("NOTI#" + Instant.now().toString());

        noti.setTitle(title);
        noti.setContent(content);

        noti.setType("CLASS_ASSIGNMENT");
        noti.setIsRead(false);
        noti.setCreatedAt(Instant.now().toString());

        table.putItem(noti);
    }

    private ClassDto convertToClassDto(SchoolItem item) {
        String cleanSubjectId = item.getSubjectId() != null ? item.getSubjectId().replace("SUBJECT#", "") : null;
        String cleanTeacherId = item.getTeacherId() != null ? item.getTeacherId().replace("USER#", "") : null;

        return ClassDto.builder()
                .id(item.getId())
                .name(item.getName())
                .subjectId(cleanSubjectId)
                .teacherId(cleanTeacherId)
                .room(item.getRoom())
                .semester(item.getSemester())
                .academicYear(item.getAcademicYear())
                .studentCount(item.getStudentCount() != null ? item.getStudentCount() : 0)
                .status(item.getStatus())
                .description(item.getDescription())
                .build();
    }

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
        if (item.getTeacherId() == null || item.getTeacherId().isEmpty()) {
            return;
        }

        try {
            String eventDetail = objectMapper.writeValueAsString(item);

            PutEventsRequestEntry entry = PutEventsRequestEntry.builder()
                    .source("com.fpt.education.lms")
                    .detailType("ClassCreated")
                    .detail(eventDetail)
                    .eventBusName(eventBusName)
                    .build();

            PutEventsRequest eventsRequest = PutEventsRequest.builder()
                    .entries(entry)
                    .build();

            eventBridgeClient.putEvents(eventsRequest);
            log.info("Triggered EventBridge 'ClassCreated' for teacher: {}", item.getTeacherId());

        } catch (Exception e) {
            log.warn("Failed to trigger EventBridge notification: {}", e.getMessage());
        }
    }

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

    public void logActivity(String actorId, String actionType, String details, String targetClassId) {
        System.out.println("--- START LOGGING ---");
        System.out.println("Table Name: " + tableName);

        try {
            SchoolItem logItem = new SchoolItem();
            String logId = UUID.randomUUID().toString();
            String timestamp = Instant.now().toString();

            logItem.setPk("LOG#" + logId);
            logItem.setSk("INFO");

            logItem.setGsi1Pk("TYPE#LOG");
            logItem.setGsi1Sk("TIMESTAMP#" + timestamp);

            logItem.setId(logId);

            String finalActorId = (actorId == null) ? "UNKNOWN" :
                    (actorId.startsWith("USER#") || actorId.equals("ADMIN") ? actorId : "USER#" + actorId);
            logItem.setActorId(finalActorId);

            logItem.setActionType(actionType);
            logItem.setLogDetails(details);

            if (targetClassId != null) {
                String finalClassId = targetClassId.startsWith("CLASS#") ? targetClassId : "CLASS#" + targetClassId;
                logItem.setTargetClassId(finalClassId);
            }

            logItem.setCreatedAt(timestamp);

            System.out.println("Item to save: " + logItem.toString());

            DynamoDbTable<SchoolItem> table = dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
            table.putItem(logItem);

            System.out.println("LOG SUCCESS: Đã ghi log " + actionType);

        } catch (Exception e) {
            System.err.println("!!! LOG ERROR !!!");
            e.printStackTrace();
        }
    }
}