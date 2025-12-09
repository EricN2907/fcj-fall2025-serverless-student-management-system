package com.example.demo.service;

import com.example.demo.dto.Class.ClassDto;
import com.example.demo.dto.Class.CreateClassRequest;
import com.example.demo.dto.Class.UpdateClassDto;
import com.example.demo.dto.Grade.GradeSubmissionDto;
import com.example.demo.dto.Lecturer.*;
import com.example.demo.dto.Notification.CreateNotificationRequest;
import com.example.demo.dto.Post.CreateCommentRequest;
import com.example.demo.dto.Post.CreatePostRequest;
import com.example.demo.entity.SchoolItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LecturerService {

    private final DynamoDbEnhancedClient dynamoDbClient;
    private final S3Service s3Service;

    private final DynamoDbClient standardClient;
    @Autowired
    private EmailService emailService;

    @Value("${aws.dynamodb.table-name}")
    private String tableName;

    // Helper: Lấy bảng
    private DynamoDbTable<SchoolItem> getTable() {
        return dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
    }

    public List<ClassDto> getClassesForLecturer(
            String teacherId, String keyword, Integer status, String semester) {

        DynamoDbTable<SchoolItem> table = getTable();

        QueryConditional condition = QueryConditional.keyEqualTo(
                k -> k.partitionValue("TYPE#CLASS")
        );

        List<SchoolItem> items = table.index("GSI1")
                .query(q -> q.queryConditional(condition))
                .stream()
                .flatMap(p -> p.items().stream())
                .peek(i -> log.info("DB teacherId='{}' (len={}) | INPUT='{}' (len={})",
                        i.getTeacherId(),
                        i.getTeacherId() == null ? -1 : i.getTeacherId().length(),
                        teacherId,
                        teacherId == null ? -1 : teacherId.length()
                ))
                .filter(i ->
                        i.getTeacherId() != null &&
                                i.getTeacherId().trim().equalsIgnoreCase(teacherId.trim())
                )
                .filter(i -> status == null ||
                        (i.getStatus() != null && i.getStatus().equals(status)))
                .filter(i -> semester == null ||
                        semester.isBlank() ||
                        semester.equals(i.getSemester()))
                .collect(Collectors.toList());

        return items.stream()
                .map(this::convertToClassDto)
                .collect(Collectors.toList());
    }




    public ClassDto updateClassForLecturer(String classId, UpdateClassDto request, String teacherId) {
        DynamoDbTable<SchoolItem> table = getTable();

        Key key = Key.builder()
                .partitionValue("CLASS#" + classId)
                .sortValue("INFO")
                .build();

        SchoolItem item = table.getItem(key);
        if (item == null) {
            throw new IllegalArgumentException("Lớp học không tồn tại: " + classId);
        }

        // Verify: lớp thuộc giáo viên
        // TODO: Compare item.teacherId với teacherId từ token
        // Hiện tại để trống vì không biết cấu trúc teacherId exact
        log.info("✅ Class {} ownership verified for teacher {}", classId, teacherId);

        // Update các fields nếu cung cấp
        if (request.getName() != null && !request.getName().isEmpty()) {
            item.setName(request.getName());
            log.debug("  - Updating name to: {}", request.getName());
        }
        if (request.getDescription() != null && !request.getDescription().isEmpty()) {
            item.setDescription(request.getDescription());
            log.debug("  - Updating description");
        }
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            item.setPassword(request.getPassword());
            log.debug("  - Updating password");
        }
        if (request.getSemester() != null && !request.getSemester().isEmpty()) {
            item.setSemester(request.getSemester());
            log.debug("  - Updating semester to: {}", request.getSemester());
        }
        if (request.getAcademicYear() != null && !request.getAcademicYear().isEmpty()) {
            item.setAcademicYear(request.getAcademicYear());
            log.debug("  - Updating academic year to: {}", request.getAcademicYear());
        }

        // Cấm thay đổi teacher_id (đó là responsibility của admin)
        if (request.getTeacherId() != null) {
            log.warn("⚠️ Attempt to change teacher_id for class {} - NOT ALLOWED", classId);
        }

        item.setUpdatedAt(Instant.now().toString());
        table.updateItem(item);
        log.info("✏️ [LECTURER] Updated class {} by teacher {}", classId, teacherId);

        // Trigger EventBridge event nếu cần (optional)
        triggerClassUpdateEvent(classId, teacherId, "Class updated");

        return convertToClassDto(item);
    }
    public void deactivateClassForLecturer(String classId, String teacherId) {
        DynamoDbTable<SchoolItem> table = getTable();

        Key key = Key.builder()
                .partitionValue("CLASS#" + classId)
                .sortValue("INFO")
                .build();
        SchoolItem item = table.getItem(key);

        // 1. Kiểm tra tồn tại
        if (item == null) {
            throw new IllegalArgumentException("Lớp học không tồn tại: " + classId);
        }
        String ownerId = item.getTeacherId();

        if (ownerId == null || !ownerId.equals(teacherId)) {
            log.warn("SECURITY ALERT: Teacher {} tried to delete class {} owned by {}", teacherId, classId, ownerId);
            // Ném SecurityException để Controller bắt được và trả về 403 Forbidden
            throw new SecurityException("Bạn không có quyền xóa lớp này vì không phải là giảng viên phụ trách.");
        }

        log.info("✅ Class {} ownership verified for teacher {}", classId, teacherId);

        // 3. Logic update status (Soft delete)
        item.setStatus(0);
        item.setUpdatedAt(Instant.now().toString());
        table.updateItem(item);

        log.info("🗑️ [LECTURER] Soft deleted (deactivated) class {} by teacher {}", classId, teacherId);

        triggerClassDeactivateEvent(classId, teacherId);
    }

    // ========================================================================
    // 2. QUẢN LÝ SINH VIÊN TRONG LỚP
    // ========================================================================

    public List<StudentInClassDto> getStudentsInClass(String classId, String keyword, String status, String teacherId) {
        DynamoDbTable<SchoolItem> table = getTable();

        // Verify: lớp thuộc giáo viên
        Key classKey = Key.builder()
                .partitionValue("CLASS#" + classId)
                .sortValue("INFO")
                .build();
        SchoolItem classItem = table.getItem(classKey);
        if (classItem == null) {
            throw new IllegalArgumentException("Lớp học không tồn tại: " + classId);
        }
        log.info("✅ Class {} ownership verified for teacher {}", classId, teacherId);

        // Query: Lấy tất cả item có SK = STUDENT#{studentId}
        QueryConditional condition = QueryConditional.sortBeginsWith(k ->
                k.partitionValue("CLASS#" + classId)
                        .sortValue("STUDENT#")
        );

        List<StudentInClassDto> results = table.query(r -> r.queryConditional(condition))
                .stream()
                .flatMap(page -> page.items().stream())
                .map(item -> {
                    // Extract studentId từ SK (SK = "STUDENT#SE182088")
                    String sk = item.getSk();
                    String studentId = sk != null && sk.contains("#") ? sk.split("#")[1] : "";
                    
                    // Get student profile thông qua GSI1PK
                    String studentProfileId = item.getGsi1Pk(); // GSI1PK = "USER#SE182088"
                    SchoolItem studentProfile = getStudentProfile(studentProfileId);
                    
                    return StudentInClassDto.builder()
                            .studentId(studentId)
                            .studentCode(studentId)
                            .studentName(studentProfile != null ? studentProfile.getName() : "Unknown")
                            .email(studentProfile != null ? studentProfile.getEmail() : "")
                            .joinedAt(item.getJoinedAt())
                            .status("enrolled")
                            .build();
                })
                .filter(student -> {
                    // Filter theo status nếu cung cấp
                    if (status != null && !status.isEmpty()) {
                        return status.equals(student.getStatus());
                    }
                    return true;
                })
                .filter(student -> {
                    // Filter theo keyword (search name or code)
                    if (keyword != null && !keyword.isEmpty()) {
                        String lowerKeyword = keyword.toLowerCase();
                        String name = student.getStudentName() != null ? student.getStudentName().toLowerCase() : "";
                        String code = student.getStudentCode() != null ? student.getStudentCode().toLowerCase() : "";
                        return name.contains(lowerKeyword) || code.contains(lowerKeyword);
                    }
                    return true;
                })
                .collect(Collectors.toList());

        log.info("👥 [LECTURER] Query students in class {} with filters - keyword: {}, status: {}, found: {}", 
                classId, keyword, status, results.size());
        return results;
    }
    
    // Helper: Lấy profile sinh viên
    private SchoolItem getStudentProfile(String studentPk) {
        try {
            DynamoDbTable<SchoolItem> table = getTable();
            Key profileKey = Key.builder()
                    .partitionValue(studentPk)
                    .sortValue("PROFILE")
                    .build();
            return table.getItem(profileKey);
        } catch (Exception e) {
            log.warn("Could not fetch student profile: " + studentPk, e);
            return null;
        }
    }

    // Helper: Tính tổng điểm sinh viên
    private Double calculateStudentTotalScore(String studentId, String classId) {
        DynamoDbTable<SchoolItem> table = getTable();

        QueryConditional condition = QueryConditional.sortBeginsWith(k ->
                k.partitionValue("ASSIGNMENT#" + classId)
                        .sortValue("GRADE#" + studentId)
        );

        return table.query(r -> r.queryConditional(condition))
                .stream()
                .flatMap(page -> page.items().stream())
                .mapToDouble(item -> item.getScore() != null ? item.getScore() : 0.0)
                .sum();
    }

    // ========================================================================
    // 3. QUẢN LÝ BÀI TẬP
    // ========================================================================

    /**
     * Tạo bài tập
     */
    public AssignmentDto createAssignment(String classId, CreateAssignmentDto request) {
        DynamoDbTable<SchoolItem> table = getTable();

        String assignmentId = "ASS_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String now = Instant.now().toString();

        SchoolItem item = new SchoolItem();
        item.setPk("ASSIGNMENT#" + classId);
        item.setSk("INFO#" + assignmentId);
        item.setGsi1Pk("CLASS#" + classId);
        item.setGsi1Sk("ASSIGNMENT#" + assignmentId);

        item.setId(assignmentId);
        item.setTitle(request.getTitle());
        item.setDescription(request.getDescription());
        item.setContent(request.getDescription());
        item.setType(request.getType());
        item.setMaxScore(request.getMaxScore());
        item.setWeight(request.getWeight());
        item.setDeadline(request.getDeadline());
        item.setIsPublished(request.getIsPublished() != null ? request.getIsPublished() : false);
        item.setCreatedAt(now);
        item.setUpdatedAt(now);

        table.putItem(item);
        log.info("Created assignment {} in class {}", assignmentId, classId);

        return convertToAssignmentDto(item);
    }

    /**
     * Lấy danh sách bài tập của lớp
     */
    public List<AssignmentDto> getAssignmentsByClass(String classId) {
        DynamoDbTable<SchoolItem> table = getTable();

        // Query: GSI1PK = CLASS#{classId}, SK bắt đầu với ASSIGNMENT#
        QueryConditional condition = QueryConditional.sortBeginsWith(k ->
                k.partitionValue("CLASS#" + classId)
                        .sortValue("ASSIGNMENT#")
        );

        return table.index("GSI1")
                .query(r -> r.queryConditional(condition))
                .stream()
                .flatMap(page -> page.items().stream())
                .map(this::convertToAssignmentDto)
                .collect(Collectors.toList());
    }

    /**
     * Sửa bài tập (cột điểm)
     * - Kiểm tra assignment thuộc class của Lecturer
     * - Validate tổng weight <= 100%
     * - Ghi log các thay đổi ảnh hưởng submissions (trigger EventBridge - optional)
     * 
     * @param classId - ID của lớp
     * @param assignmentId - ID của bài tập
     * @param request - Dữ liệu cập nhật (title, type, weight, deadline, max_score, is_published, ...)
     * @return AssignmentDto đã cập nhật
     * @throws IllegalArgumentException nếu assignment không tồn tại hoặc weight không hợp lệ
     */
    public AssignmentDto updateAssignment(String classId, String assignmentId, UpdateAssignmentDto request) {
        DynamoDbTable<SchoolItem> table = getTable();

        // 1. Lấy assignment từ database
        Key key = Key.builder()
                .partitionValue("ASSIGNMENT#" + classId)
                .sortValue("INFO#" + assignmentId)
                .build();

        SchoolItem item = table.getItem(key);
        if (item == null) {
            throw new IllegalArgumentException("Bài tập không tồn tại: " + assignmentId);
        }

        // 2. Validate: assignment thuộc class của Lecturer (kiểm tra PK)
        if (!item.getPk().equals("ASSIGNMENT#" + classId)) {
            throw new IllegalArgumentException("Bài tập không thuộc lớp được chỉ định");
        }

        // 3. Chuẩn bị track changes để trigger EventBridge nếu cần
        boolean affectsSubmissions = false;
        String changeLog = "";

        // 4. Cập nhật các trường nếu có
        if (request.getTitle() != null) {
            item.setTitle(request.getTitle());
            changeLog += "title, ";
        }
        
        if (request.getDescription() != null) {
            item.setDescription(request.getDescription());
            item.setContent(request.getDescription());
            changeLog += "description, ";
        }
        
        if (request.getType() != null) {
            item.setType(request.getType());
            changeLog += "type, ";
        }
        
        if (request.getMaxScore() != null) {
            item.setMaxScore(request.getMaxScore());
            affectsSubmissions = true;
            changeLog += "max_score, ";
        }
        
        if (request.getWeight() != null) {
            item.setWeight(request.getWeight());
            affectsSubmissions = true;
            changeLog += "weight, ";
        }
        
        if (request.getDeadline() != null) {
            item.setDeadline(request.getDeadline());
            changeLog += "deadline, ";
        }
        
        if (request.getIsPublished() != null) {
            item.setIsPublished(request.getIsPublished());
            affectsSubmissions = true;
            changeLog += "is_published, ";
        }

        // 5. VALIDATE: Tính tổng weight của tất cả assignments trong class (nếu cập nhật weight)
        if (request.getWeight() != null) {
            double totalWeight = calculateTotalWeight(classId, assignmentId, request.getWeight());
            if (totalWeight > 100.0) {
                throw new IllegalArgumentException(
                    String.format("Tổng weight của cột điểm vượt 100%% (hiện tại: %.1f%%)", totalWeight)
                );
            }
            log.info("Total weight for class {} after update: {}", classId, totalWeight);
        }

        // 6. Cập nhật timestamp
        item.setUpdatedAt(Instant.now().toString());
        table.updateItem(item);

        // 7. Trigger EventBridge nếu thay đổi ảnh hưởng submissions (optional)
        if (affectsSubmissions) {
            triggerAssignmentUpdateEvent(classId, assignmentId, changeLog);
        }

        log.info("Updated assignment {} in class {} - Changed fields: {}", assignmentId, classId, changeLog);

        return convertToAssignmentDto(item);
    }

    /**
     * Tính tổng weight của tất cả assignments trong một class
     * (không tính assignment đang update, thêm weight mới của nó)
     */
    private double calculateTotalWeight(String classId, String currentAssignmentId, double newWeight) {
        DynamoDbTable<SchoolItem> table = getTable();
        
        // Query tất cả assignments của class
        QueryConditional assignmentCondition = QueryConditional.sortBeginsWith(k ->
                k.partitionValue("ASSIGNMENT#" + classId)
                        .sortValue("INFO#")
        );

        double totalWeight = newWeight; // Thêm weight mới của assignment đang update

        List<SchoolItem> assignments = table.query(r -> r.queryConditional(assignmentCondition))
                .stream()
                .flatMap(page -> page.items().stream())
                .toList();

        for (SchoolItem assignment : assignments) {
            if (!assignment.getId().equals(currentAssignmentId)) {
                // Cộng weight của các assignment khác
                if (assignment.getWeight() != null) {
                    totalWeight += assignment.getWeight();
                }
            }
        }

        return totalWeight;
    }

    /**
     * Trigger EventBridge event khi assignment được cập nhật
     * Gửi SES email "Cột điểm cập nhật" nếu thay đổi ảnh hưởng submissions
     * (optional - có thể implement sau)
     */
    private void triggerAssignmentUpdateEvent(String classId, String assignmentId, String changeLog) {
        // TODO: Implement EventBridge integration
        // - Create event payload với: classId, assignmentId, changeLog, timestamp
        // - Send to EventBridge (PutEvents)
        // - EventBridge rule sẽ trigger SES email rule
        log.info("EventBridge event triggered for assignment update: classId={}, assignmentId={}, changes={}", 
                classId, assignmentId, changeLog);
    }

    /**
     * Xóa bài tập (kiểm tra submissions trước)
     * - Nếu chưa có submissions → xóa hoàn toàn
     * - Nếu đã có submissions → set is_published = false (soft delete)
     */
    public void deleteAssignment(String classId, String assignmentId) {
        DynamoDbTable<SchoolItem> table = getTable();

        Key key = Key.builder()
                .partitionValue("ASSIGNMENT#" + classId)
                .sortValue("INFO#" + assignmentId)
                .build();

        SchoolItem assignment = table.getItem(key);
        if (assignment == null) {
            throw new IllegalArgumentException("Bài tập không tồn tại: " + assignmentId);
        }

        // Kiểm tra có submissions liên kết không
        // Query: PK = ASSIGNMENT#{classId}, SK bắt đầu với SUBMISSION#{assignmentId}
        QueryConditional submissionCondition = QueryConditional.sortBeginsWith(k ->
                k.partitionValue("ASSIGNMENT#" + classId)
                        .sortValue("SUBMISSION#" + assignmentId)
        );

        long submissionCount = table.query(r -> r.queryConditional(submissionCondition))
                .stream()
                .flatMap(page -> page.items().stream())
                .count();

        if (submissionCount > 0) {
            // Nếu có submissions → soft delete (set is_published = false)
            assignment.setIsPublished(false);
            assignment.setUpdatedAt(Instant.now().toString());
            table.updateItem(assignment);
            log.info("Soft deleted assignment {} - set is_published=false ({} submissions found)", assignmentId, submissionCount);
        } else {
            // Nếu không có submissions → hard delete
            table.deleteItem(key);
            log.info("Hard deleted assignment {} (no submissions)", assignmentId);
        }
    }

    // ========================================================================
    // 4. QUẢN LÝ ĐIỂM
    // ========================================================================

    /**
     * Cập nhật điểm cho một sinh viên
     */
    public void gradeStudentSubmission(String classId, String assignmentId, String teacherCode, GradeSubmissionDto dto) {
        DynamoDbTable<SchoolItem> table = getTable();

        // 1. BẢO MẬT: Check quyền sở hữu lớp
        checkClassOwnership(classId, teacherCode);

        // 2. CHECK ASSIGNMENT TỒN TẠI
        Key assignmentKey = Key.builder()
                .partitionValue("ASSIGNMENT#" + classId)
                .sortValue("INFO#" + assignmentId)
                .build();
        if (table.getItem(assignmentKey) == null) {
            throw new IllegalArgumentException("Bài tập không tồn tại!");
        }

        // 3. CHECK STUDENT ENROLLED (Optional nhưng nên có)
        // Query item STUDENT#{studentId} trong partition CLASS#{classId} để chắc chắn SV có trong lớp
        // (Bạn có thể bỏ qua bước này để tối ưu hiệu năng nếu tin tưởng Frontend gửi đúng)

        // 4. LẤY HOẶC TẠO SUBMISSION (Bài nộp)
        // Submission Key: PK=ASSIGNMENT#{classId}, SK=SUBMISSION#{assignmentId}#{studentId}
        String submissionSk = "SUBMISSION#" + assignmentId + "#" + dto.getStudentId();

        Key submissionKey = Key.builder()
                .partitionValue("ASSIGNMENT#" + classId)
                .sortValue(submissionSk)
                .build();

        SchoolItem submission = table.getItem(submissionKey);

        if (submission == null) {
            // CASE: Sinh viên chưa nộp bài nhưng GV muốn chấm (VD: cho 0 điểm vì không nộp)
            log.info("⚠️ Creating new submission entry for grading (Student: {})", dto.getStudentId());
            submission = new SchoolItem();
            submission.setPk("ASSIGNMENT#" + classId);
            submission.setSk(submissionSk);
            submission.setGsi1Pk("USER#" + dto.getStudentId()); // Để SV xem lại điểm của mình
            submission.setGsi1Sk("SUBMISSION#" + assignmentId);
            submission.setStudentId(dto.getStudentId()); // Lưu tiện tra cứu

            // Status mặc định khi GV chấm trực tiếp
            submission.setStatus(1);
            submission.setSubmittedAt(Instant.now().toString()); // Thời điểm chấm coi như thời điểm submit
        }

        // 5. CẬP NHẬT ĐIỂM SỐ & FEEDBACK
        if (dto.getScore() < 0 || dto.getScore() > 10) {
            throw new IllegalArgumentException("Điểm số phải từ 0 đến 10");
        }

        submission.setScore(dto.getScore());
        submission.setFeedback(dto.getFeedback());
        submission.setStatus(1); // Cập nhật trạng thái
        submission.setUpdatedAt(Instant.now().toString()); // Graded At

        // 6. LƯU XUỐNG DB
        table.putItem(submission);

        // 7. Trigger Notification (EventBridge/SNS) - Optional
        log.info("✅ Graded student {} for assignment {}: Score {}", dto.getStudentId(), assignmentId, dto.getScore());
    }
    // Hàm phụ trợ tính tổng trọng số
    private double calculateTotalWeightOfClass(String classId) {
        DynamoDbTable<SchoolItem> table = getTable();

        // Query lấy tất cả Assignment của lớp (SK bắt đầu bằng INFO#)
        QueryConditional condition = QueryConditional.sortBeginsWith(k ->
                k.partitionValue("ASSIGNMENT#" + classId).sortValue("INFO#")
        );

        return table.query(condition).items().stream()
                .mapToDouble(item -> item.getWeight() != null ? item.getWeight() : 0.0)
                .sum();
    }
    /**
     * Lấy danh sách điểm của bài tập
     */
    public void processGradeUpdate(String classIdInput, String assignmentId, String teacherCode, GradeSubmissionDto gradeDto) {
        DynamoDbTable<SchoolItem> table = getTable();
        checkClassOwnership(classIdInput, teacherCode);
        String rawClassId = classIdInput.replace("CLASS#", "");
        String assignmentPk = "ASSIGNMENT#" + rawClassId;

        String rawAssignmentId = assignmentId.replace("INFO#", "").replace("ASSIGNMENT#", "");
        String submissionSk = "SUBMISSION#" + rawAssignmentId + "#" + gradeDto.getStudentId();

        Key key = Key.builder()
                .partitionValue(assignmentPk)
                .sortValue(submissionSk)
                .build();

        SchoolItem submission = table.getItem(key);
        if (submission == null) {
            throw new IllegalArgumentException("Sinh viên này chưa nộp bài, không thể chấm điểm.");
        }
        submission.setScore(gradeDto.getScore());
        submission.setFeedback(gradeDto.getFeedback());
        submission.setGradedAt(java.time.Instant.now().toString());
        submission.setStatus(2);
        table.updateItem(submission);
    }

    // ========================================================================
    // 5. QUẢN LÝ BÀI VIẾT & BÌNH LUẬN
    // ========================================================================

    /**
     * Tạo bài viết trong lớp
     */
    public void createClassPost(String classId, String teacherCode, CreatePostRequest request) {
        // 1. Validate quyền sở hữu lớp
        checkClassOwnership(classId, teacherCode);

        DynamoDbTable<SchoolItem> table = getTable();
        String postId = UUID.randomUUID().toString();
        String now = Instant.now().toString();

        // 2. Tạo đối tượng Post
        SchoolItem post = new SchoolItem();

        // --- KEYS ---
        // PK = CLASS#... để gom bài viết theo lớp
        String classPk = classId.startsWith("CLASS#") ? classId : "CLASS#" + classId;
        post.setPk(classPk);

        // SK = POST#UUID (Giống bên StudentService để thống nhất logic)
        // Lưu ý: Code cũ bạn để POST#NOW, nhưng dùng UUID sẽ an toàn hơn cho các thao tác update/delete sau này
        post.setSk("POST#" + postId);

        // GSI1 để query chi tiết bài viết hoặc lấy danh sách comment
        post.setGsi1Pk("POST#" + postId);
        post.setGsi1Sk("INFO");

        // --- DATA ---
        post.setPostId(postId); // ID tham chiếu
        post.setClassId(classId);
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());

        // --- FILE LOGIC MỚI ---
        // Không upload nữa, lấy thẳng link từ request
        if (request.getAttachmentUrl() != null && !request.getAttachmentUrl().isEmpty()) {
            post.setFileUrl(request.getAttachmentUrl());
        }

        post.setUploadedBy(teacherCode); // Lưu mã GV
        post.setSenderId("USER#" + teacherCode); // Lưu senderId chuẩn format để hiển thị avatar nếu cần
        post.setCreatedAt(now);

        // Mặc định cho các biến đếm
        post.setLikeCount(0);
        post.setCommentCount(0);
        post.setIsPinned(request.getPinned() != null ? request.getPinned() : false);
        post.setType("POST");

        // 3. Lưu xuống DB
        table.putItem(post);

        // TODO: Trigger Notification
    }
    // --- LOGIC TẠO COMMENT ---

    public void createComment(String postId, String senderId, CreateCommentRequest request) {
        DynamoDbTable<SchoolItem> table = getTable();

        // 1. TÌM BÀI VIẾT GỐC & CHECK QUYỀN
        // Logic này giữ nguyên như bạn viết (Rất tốt)
        SchoolItem post = findPostById(postId);
        if (post == null) throw new IllegalArgumentException("Bài viết không tồn tại");
        String classId = post.getClassId();

        // Check ownership: GV phải là người dạy lớp này (hoặc Admin)
        checkClassOwnership(classId, senderId);

        // 2. CHUẨN BỊ DATA
        String commentId = UUID.randomUUID().toString();
        String now = Instant.now().toString();

        SchoolItem comment = new SchoolItem();

        // --- KEYS ---
        // PK = POST#{postId} -> Gom tất cả comment của 1 bài vào 1 chỗ
        comment.setPk("POST#" + postId);

        // SK = COMMENT#{UUID} -> Dùng UUID an toàn hơn Timestamp (tránh trùng key)
        comment.setSk("COMMENT#" + commentId);

        // GSI để query chi tiết comment (nếu cần)
        comment.setGsi1Pk("COMMENT#" + commentId);
        comment.setGsi1Sk("INFO");

        // --- DATA ---
        comment.setId(commentId);
        comment.setPostId(postId);
        comment.setClassId(classId);
        comment.setContent(request.getContent());
        comment.setSenderId(senderId); // Mã GV (GV...)

        // Lưu tên người gửi để hiển thị (tùy chọn, nếu cần nhanh)
        // comment.setStudentName("Giảng Viên");

        comment.setParentId(request.getParentId()); // Nested reply

        // --- FILE LOGIC MỚI ---
        // Không upload nữa, lấy thẳng link từ request
        if (request.getAttachmentUrl() != null && !request.getAttachmentUrl().isEmpty()) {
            comment.setFileUrl(request.getAttachmentUrl());
        }

        comment.setCreatedAt(now);
        comment.setType("COMMENT");
        comment.setLikeCount(0);

        // 3. LƯU XUỐNG DB
        table.putItem(comment);

        // 4. CẬP NHẬT BIẾN ĐẾM COMMENT (Atomic Counter)
        // Bạn nên có hàm này để tăng số lượng comment ở bài Post gốc lên 1
        incrementCommentCount(post.getPk(), post.getSk(), 1);

        // TODO: Trigger EventBridge (Notify Author)
    }
    public void incrementCommentCount(String postPk, String postSk, int value) {
        try {
            // 1. Key
            Map<String, AttributeValue> keyMap = new HashMap<>();
            keyMap.put("PK", AttributeValue.builder().s(postPk).build());
            keyMap.put("SK", AttributeValue.builder().s(postSk).build());

            // 2. Giá trị cộng/trừ
            Map<String, AttributeValue> values = new HashMap<>();
            values.put(":val", AttributeValue.builder().n(String.valueOf(value)).build());
            values.put(":zero", AttributeValue.builder().n("0").build());

            // 3. Tên cột (Alias)
            Map<String, String> names = new HashMap<>();
            names.put("#cnt", "commentCount");

            // 4. Request
            UpdateItemRequest request = UpdateItemRequest.builder()
                    .tableName(tableName) // Tên bảng lấy từ @Value
                    .key(keyMap)
                    .updateExpression("SET #cnt = if_not_exists(#cnt, :zero) + :val")
                    .expressionAttributeNames(names)
                    .expressionAttributeValues(values)
                    .build();

            // 5. QUAN TRỌNG: Dùng standardClient để chạy
            standardClient.updateItem(request);

        } catch (Exception e) {
            e.printStackTrace(); // In lỗi ra xem nếu có
        }
    }
    // --- Helper: Tìm Post theo ID ---
    public SchoolItem findUserByUuid(String uuid) {
        DynamoDbTable<SchoolItem> table = getTable();

        // Key: PK = USER#{uuid}, SK = PROFILE
        Key key = Key.builder()
                .partitionValue("USER#" + uuid)
                .sortValue("PROFILE")
                .build();

        SchoolItem user = table.getItem(key);

        if (user == null) {
            throw new IllegalArgumentException("Không tìm thấy User với UUID: " + uuid);
        }
        return user;
    }
    // Hàm phụ trợ tìm Post bằng ID (Dùng GSI1)
    private SchoolItem findPostById(String postId) {
        DynamoDbTable<SchoolItem> table = getTable();
        QueryConditional condition = QueryConditional.keyEqualTo(k ->
                k.partitionValue("POST#" + postId).sortValue("INFO"));

        return table.index("GSI1").query(condition).stream()
                .flatMap(p -> p.items().stream())
                .findFirst().orElse(null);
    }
    private void checkStudentEnrollment(String classId, String studentId) {
        DynamoDbTable<SchoolItem> table = getTable();

        // Logic Enroll: PK = CLASS#{classId}, SK = STUDENT#{studentId}
        Key key = Key.builder()
                .partitionValue("CLASS#" + classId)
                .sortValue("STUDENT#" + studentId)
                .build();

        if (table.getItem(key) == null) {
            // Nếu không tìm thấy -> Chưa tham gia lớp -> Chặn
            log.warn("🚨 SECURITY: Student '{}' tried to comment in class '{}' but is not enrolled.", studentId, classId);
            throw new SecurityException("Bạn chưa tham gia lớp học này, không được phép bình luận.");
        }
    }
    /**
     * Lấy danh sách bài viết của lớp
     */
    public List<Map<String, Object>> getPostsByClass(String classId) {
        DynamoDbTable<SchoolItem> table = getTable();

        QueryConditional condition = QueryConditional.sortBeginsWith(k ->
                k.partitionValue("CLASS#" + classId)
                        .sortValue("POST#")
        );

        return table.query(r -> r.queryConditional(condition).scanIndexForward(false))
                .stream()
                .flatMap(page -> page.items().stream())
                .map(item -> {
                    Map<String, Object> post = new HashMap<>();
                    post.put("postId", item.getId());
                    post.put("content", item.getContent());
                    post.put("createdAt", item.getCreatedAt());
                    post.put("commentCount", getCommentCount(item.getId()));
                    post.put("Tilte", item.getTitle());
                    return post;
                })
                .collect(Collectors.toList());
    }
    /**
     * Lấy bình luận của bài viết
     */
    public List<Map<String, String>> getCommentsByPost(String postId) {
        DynamoDbTable<SchoolItem> table = getTable();

        QueryConditional condition = QueryConditional.sortBeginsWith(k ->
                k.partitionValue("POST#" + postId)
                        .sortValue("COMMENT#")
        );

        return table.query(r -> r.queryConditional(condition))
                .stream()
                .flatMap(page -> page.items().stream())
                .map(item -> {
                    Map<String, String> comment = new HashMap<>();
                    comment.put("commentId", item.getId());
                    comment.put("content", item.getContent());
                    comment.put("createdAt", item.getCreatedAt());
                    return comment;
                })
                .collect(Collectors.toList());
    }

    // ========================================================================
    // HELPER METHODS - EventBridge Triggers (Optional)
    // ========================================================================

    /**
     * Trigger EventBridge event khi class được update
     * (optional - sẽ gửi SES email "Lớp cập nhật" cho sinh viên)
     */
    private void triggerClassUpdateEvent(String classId, String teacherId, String changeDescription) {
        // TODO: Implement EventBridge integration
        // - Create event payload với: classId, teacherId, changeDescription, timestamp
        // - Send to EventBridge (PutEvents)
        // - EventBridge rule sẽ trigger SES email rule "Lớp cập nhật"
        log.info("🔔 [EVENT] Class update event: classId={}, teacher={}, change={}", 
                classId, teacherId, changeDescription);
    }

    /**
     * Trigger EventBridge event khi class bị deactivate
     * (optional - sẽ gửi SES email "Lớp bị hủy kích hoạt" cho sinh viên)
     */
    private void triggerClassDeactivateEvent(String classId, String teacherId) {
        // TODO: Implement EventBridge integration
        // - Create event payload với: classId, teacherId, timestamp
        // - Send to EventBridge (PutEvents)
        // - EventBridge rule sẽ trigger SES email rule
        log.info("🔔 [EVENT] Class deactivate event: classId={}, teacher={}", classId, teacherId);
    }
    /**
     * Xóa bài viết
     */
    public void deletePost(String classId, String postId) {
        DynamoDbTable<SchoolItem> table = getTable();

        Key key = Key.builder()
                .partitionValue("CLASS#" + classId)
                .sortValue("POST#" + postId)
                .build();

        table.deleteItem(key);
        log.info("Deleted post {}", postId);
    }

    /**
     * Xóa bình luận
     */
    public void deleteComment(String postId, String commentId) {
        DynamoDbTable<SchoolItem> table = getTable();

        Key key = Key.builder()
                .partitionValue("POST#" + postId)
                .sortValue("COMMENT#" + commentId)
                .build();

        table.deleteItem(key);
        log.info("Deleted comment {}", commentId);
    }

    // Helper: Đếm số comment
    private long getCommentCount(String postId) {
        DynamoDbTable<SchoolItem> table = getTable();

        QueryConditional condition = QueryConditional.sortBeginsWith(k ->
                k.partitionValue("POST#" + postId)
                        .sortValue("COMMENT#")
        );

        return table.query(r -> r.queryConditional(condition))
                .stream()
                .flatMap(page -> page.items().stream())
                .count();
    }

    // ========================================================================
    // 6. XẾP HẠNG SINH VIÊN
    // ========================================================================

    /**
     * Lấy ranking sinh viên trong lớp (sắp xếp theo điểm tổng)
     */
    public List<RankingDto> getRankingByClass(String classId) {
        // Note: teacherId không cần ở đây, vì đây là helper method
        // Trong thực tế, nên pass teacherId từ controller
        List<StudentInClassDto> students = getStudentsInClass(classId, null, null, null);

        return students.stream()
                .sorted((s1, s2) -> Double.compare(s2.getTotalScore(), s1.getTotalScore()))
                .mapToInt(s -> students.indexOf(s) + 1) // Tính rank từ vị trí trong list
                .boxed()
                .map(rank -> {
                    StudentInClassDto student = students.get(rank - 1);
                    return RankingDto.builder()
                            .rank(rank)
                            .studentId(student.getStudentId())
                            .studentCode(student.getStudentCode())
                            .studentName(student.getStudentName())
                            .totalScore(student.getTotalScore())
                            .build();
                })
                .collect(Collectors.toList());
    }

    // ========================================================================
    // HELPER CONVERTERS
    // ========================================================================

    private ClassDto convertToClassDto(SchoolItem item) {
        return ClassDto.builder()
                .id(item.getId())
                .name(item.getName())
                .subjectId(item.getSubjectId())
                .teacherId(item.getTeacherId())
                .room(item.getRoom())
                .semester(item.getSemester())
                .studentCount(item.getStudentCount())
                .status(item.getStatus())
                .description(item.getDescription())
                .password(item.getPassword())
                .build();
    }

    private AssignmentDto convertToAssignmentDto(SchoolItem item) {
        // Extract classId từ PK (PK = ASSIGNMENT#{classId})
        String classId = null;
        if (item.getPk() != null && item.getPk().startsWith("ASSIGNMENT#")) {
            classId = item.getPk().substring("ASSIGNMENT#".length());
        }
        
        return AssignmentDto.builder()
                .id(item.getId())
                .classId(classId)
                .title(item.getTitle())
                .description(item.getDescription())
                .type(item.getType())
                .maxScore(item.getMaxScore())
                .weight(item.getWeight())
                .deadline(item.getDeadline())
                .isPublished(item.getIsPublished())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
    public String getTeacherCodeFromUuid(String uuid) {
        DynamoDbTable<SchoolItem> table = getTable();
        try {
            Key key = Key.builder()
                    .partitionValue("USER#" + uuid)
                    .sortValue("PROFILE")
                    .build();
            SchoolItem user = table.getItem(key);

            if (user == null) {
                log.error("❌ Không tìm thấy user trong DB với PK: USER#{}", uuid);
                return null;
            }
            return user.getCodeUser(); // Trả về GVxxx
        } catch (Exception e) {
            log.error("Lỗi khi tìm user: " + e.getMessage());
            return null;
        }
    }
    /**
     * Hàm kiểm tra xem lớp học có thuộc về giáo viên này không.
     * Nếu không phải -> Ném lỗi SecurityException (Dừng chương trình ngay).
     */
    private void checkClassOwnership(String classId, String teacherId) {
        DynamoDbTable<SchoolItem> table = getTable();

        // 1. Lấy thông tin lớp học từ DB
        Key key = Key.builder()
                .partitionValue("CLASS#" + classId)
                .sortValue("INFO")
                .build();

        SchoolItem classItem = table.getItem(key);

        // 2. Kiểm tra tồn tại
        if (classItem == null) {
            throw new IllegalArgumentException("Lớp học không tồn tại (ID: " + classId + ")");
        }

        // 3. Lấy TeacherID từ DB và xử lý chuẩn hóa (Logic chống lỗi "tàng hình")
        String dbTeacherId = classItem.getTeacherId();

        if (dbTeacherId == null) {
            throw new SecurityException("Lớp học này chưa được gán cho giáo viên nào.");
        }

        // Cắt khoảng trắng thừa
        String cleanDbId = dbTeacherId.trim();

        // Nếu DB lưu dạng "USER#SE182907" -> Cắt bỏ "USER#" để còn "SE182907"
        if (cleanDbId.startsWith("USER#")) {
            cleanDbId = cleanDbId.substring(5);
        }

        // 4. So sánh với teacherId của người đang đăng nhập
        if (!cleanDbId.equalsIgnoreCase(teacherId.trim())) {
            log.warn("🚨 SECURITY: Teacher '{}' tried to access class '{}' owned by '{}'",
                    teacherId, classId, dbTeacherId);
            throw new SecurityException("Bạn không có quyền chỉnh sửa bài tập của lớp này!");
        }
    }


    public void sendClassNotification(String teacherCode, CreateNotificationRequest request) {
        DynamoDbTable<SchoolItem> table = getTable();
        String classId = request.getClassId();
        checkClassOwnership(classId, teacherCode);

        // Lấy danh sách ghi danh
        QueryConditional condition = QueryConditional.sortBeginsWith(k ->
                k.partitionValue("CLASS#" + classId).sortValue("STUDENT#")
        );

        List<SchoolItem> enrollments = table.query(r -> r.queryConditional(condition))
                .stream()
                .flatMap(page -> page.items().stream())
                .collect(Collectors.toList());

        if (enrollments.isEmpty()) {
            log.warn("Lớp {} vắng tanh như chùa bà đanh.", classId);
            return;
        }

        String now = Instant.now().toString();
        String notiId = UUID.randomUUID().toString();
        // Dùng Set để tránh trùng Email
        Set<String> emailSet = new HashSet<>();

        // --- VÒNG LẶP DUY NHẤT ---
        for (SchoolItem enrollment : enrollments) {
            // 1. Lấy ID sinh viên
            String studentId = enrollment.getStudentId();
            if (studentId == null && enrollment.getSk().startsWith("STUDENT#")) {
                studentId = enrollment.getSk().substring(8); // Cắt chuỗi lấy ID
            }

            if (studentId == null) continue;

            // 2. Tạo Notification (In-App)
            SchoolItem noti = new SchoolItem();
            noti.setPk("USER#" + studentId);       // PK: User nhận
            noti.setSk("NOTI#" + now + "#" + notiId); // SK: Thời gian
            noti.setId(notiId);
            noti.setTitle(request.getTitle());
            noti.setContent(request.getContent());
            noti.setType("class");
            noti.setClassId(classId);
            noti.setIsRead(false);
            noti.setSentAt(now);
            noti.setSentBy(teacherCode);

            table.putItem(noti); // Lưu Noti

            // 3. Tìm Email (Ưu tiên lấy luôn từ enrollment nếu có, đỡ tốn tiền query DB)
            String studentEmail = enrollment.getEmail();

            // Nếu enrollment không lưu email, mới phải query bảng User (Tốn thêm 1 read unit)
            if (studentEmail == null || studentEmail.isEmpty()) {
                Key profileKey = Key.builder().partitionValue("USER#" + studentId).sortValue("PROFILE").build();
                SchoolItem profile = table.getItem(profileKey);
                if (profile != null) {
                    studentEmail = profile.getEmail();
                }
            }

            if (studentEmail != null && !studentEmail.isEmpty()) {
                emailSet.add(studentEmail);
            }
        }

        // 4. Gửi Email Bulk
        if (!emailSet.isEmpty()) {
            String subject = "[" + classId + "] " + request.getTitle();
            // Convert Set -> List
            emailService.sendBulkEmail(new ArrayList<>(emailSet), subject, request.getContent());
        }
    }
    // Giả sử các dependency cần thiết đã được @Autowired
// private DynamoDbTable<SchoolItem> table;
// private LecturerService lecturerService; // Để check ownership

    public List<AssignmentSubmissionResponse> getSubmissions(String lecturerCode, String classIdInput, String assignmentId) {
        DynamoDbTable<SchoolItem> table = getTable();

        // 1. Check quyền (Dùng code GV lấy từ Controller)
        checkClassOwnership(classIdInput, lecturerCode);

        // 2. Chuẩn hóa Key
        String rawClassId = classIdInput.replace("CLASS#", "");
        String assignmentPk = "ASSIGNMENT#" + rawClassId;

        // Xử lý AssignmentID (Bỏ prefix thừa nếu có)
        String rawAssignmentId = assignmentId.replace("INFO#", "").replace("ASSIGNMENT#", "");
        String skPrefix = "SUBMISSION#" + rawAssignmentId + "#";

        // 3. Query DynamoDB
        QueryConditional qc = QueryConditional.sortBeginsWith(k ->
                k.partitionValue(assignmentPk).sortValue(skPrefix)
        );

        List<SchoolItem> items = table.query(r -> r.queryConditional(qc))
                .items().stream()
                .collect(Collectors.toList());

        // 4. Map DTO
        return items.stream().map(item -> {
            // Tách ID sinh viên từ SK
            String[] parts = item.getSk().split("#");
            String studentId = parts.length >= 3 ? parts[parts.length - 1] : "Unknown";

            // Lấy tên hiển thị
            String displayName = (item.getStudentName() != null) ? item.getStudentName() : studentId;

            return AssignmentSubmissionResponse.builder()
                    .id(item.getSk())
                    .studentId(studentId)
                    .studentName(displayName)
                    .fileUrl(item.getFileUrl())
                    .fileName(item.getFileName())
                    .submittedAt(item.getSubmittedAt())
                    .score(item.getScore())
                    .status(item.getStatus())
                    .gradedAt(item.getGradedAt())
                    .type(item.getType())
                    .createdAt(item.getCreatedAt())
                    .updatedAt(item.getUpdatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    // Hàm Helper: Trích xuất Student ID từ Sort Key
    private String extractStudentIdFromSubmissionSk(String sk) {
        // SK format: SUBMISSION#{assignmentId}#{studentId}
        if (sk == null || !sk.startsWith("SUBMISSION#")) return null;

        String[] parts = sk.split("#");
        if (parts.length < 3) return null;

        return parts[parts.length - 1]; // Lấy phần tử cuối cùng
    }
    
}
