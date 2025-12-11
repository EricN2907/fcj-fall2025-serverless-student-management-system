package com.example.demo.service;

import com.example.demo.dto.Class.ClassDto;
import com.example.demo.dto.Class.NotificationDto;
import com.example.demo.dto.Post.CommentDto;
import com.example.demo.dto.Post.CreateCommentRequest;
import com.example.demo.dto.Post.CreatePostRequest;
import com.example.demo.dto.Post.PostDto;
import com.example.demo.dto.Post.ReactionRequest;
import com.example.demo.dto.Search.SearchResultDto;
import com.example.demo.dto.Student.*;
import com.example.demo.entity.SchoolItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.enhanced.dynamodb.*;
import software.amazon.awssdk.enhanced.dynamodb.model.Page;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentService {

    private final DynamoDbEnhancedClient dynamoDbClient;
    private final AdminService adminService;
    private final S3Service s3Service;

    @Value("${aws.dynamodb.table-name}")
    private String tableName;

    private DynamoDbTable<SchoolItem> table() {
        return dynamoDbClient.table(tableName, TableSchema.fromBean(SchoolItem.class));
    }

    private DynamoDbIndex<SchoolItem> gsi1() {
        return table().index("GSI1");
    }

    // ========================= CLASSES & ENROLLMENT =========================
    public List<ClassDto> getEnrolledClasses(String studentId, String classFilter) {
        String gsiPk = studentId.startsWith("USER#") ? studentId : "USER#" + studentId;
        QueryConditional qc = QueryConditional.keyEqualTo(k -> k.partitionValue(gsiPk));

        List<SchoolItem> enrollmentItems = gsi1().query(r -> r.queryConditional(qc))
                .stream()
                .flatMap(page -> page.items().stream())
                .filter(item -> item.getGsi1Sk() != null && item.getGsi1Sk().startsWith("CLASS#"))
                .collect(Collectors.toList());

        if (classFilter != null && !classFilter.isEmpty()) {
            String target = classFilter.startsWith("CLASS#") ? classFilter : "CLASS#" + classFilter;
            enrollmentItems = enrollmentItems.stream()
                    .filter(i -> target.equals(i.getGsi1Sk()))
                    .collect(Collectors.toList());
        }

        return enrollmentItems.stream()
                .map(enroll -> fetchClassDto(enroll.getGsi1Sk()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public void handleEnrollAction(String studentId, EnrollRequest request) {
        if (request.getAction() == null) throw new IllegalArgumentException("Action is required");
        String action = request.getAction().toLowerCase();
        if (!action.equals("enroll") && !action.equals("unenroll")) {
            throw new IllegalArgumentException("Action không hợp lệ");
        }

        String classPk = request.getClassId().startsWith("CLASS#") ? request.getClassId() : "CLASS#" + request.getClassId();
        String studentPk = studentId.startsWith("USER#") ? studentId : "USER#" + studentId;
        String studentRaw = studentPk.replace("USER#", "");

        // 1. Lấy thông tin lớp
        Key classKey = Key.builder().partitionValue(classPk).sortValue("INFO").build();
        SchoolItem classItem = table().getItem(classKey);
        if (classItem == null) throw new IllegalArgumentException("Lớp học không tồn tại");

        // 2. Check Active
        boolean isClassActive = true;
        Object statusObj = classItem.getStatus();
        if (statusObj != null) {
            String s = String.valueOf(statusObj).toLowerCase();
            isClassActive = !(s.equals("0") || s.equals("inactive") || s.equals("cancelled") || s.equals("huy"));
        }
        if ("enroll".equals(action) && !isClassActive) {
            throw new IllegalArgumentException("Lớp học không ở trạng thái mở");
        }

        Key enrollKey = Key.builder().partitionValue(classPk).sortValue("STUDENT#" + studentRaw).build();
        SchoolItem existing = table().getItem(enrollKey);

        // --- ENROLL ---
        if ("enroll".equals(action)) {
            if (existing != null) throw new IllegalArgumentException("Bạn đã tham gia lớp này rồi");

            // Check Password
            String dbPass = classItem.getPassword();
            if (dbPass != null && !dbPass.isEmpty()) {
                if (request.getPassword() == null || !request.getPassword().equals(dbPass)) {
                    throw new IllegalArgumentException("Mật khẩu lớp học không đúng");
                }
            }

            // Check Prerequisites
            if (classItem.getSubjectId() != null) {
                SchoolItem subject = table().getItem(Key.builder().partitionValue(classItem.getSubjectId()).sortValue("INFO").build());
                if (subject != null && subject.getPrerequisites() != null && !subject.getPrerequisites().isEmpty()) {
                    List<String> prerequisites = Arrays.asList(subject.getPrerequisites().split(","));
                    List<SchoolItem> completedSubjects = gsi1().query(r -> r.queryConditional(QueryConditional.keyEqualTo(k -> k.partitionValue(studentPk))))
                            .stream()
                            .flatMap(page -> page.items().stream())
                            .filter(item -> item.getSk().startsWith("SUBJECT#") && Integer.valueOf(1).equals(item.getStatus()))
                            .collect(Collectors.toList());

                    Set<String> completedIds = completedSubjects.stream().map(SchoolItem::getSubjectId).collect(Collectors.toSet());

                    for (String pre : prerequisites) {
                        String preCheck = pre.trim().startsWith("SUBJECT#") ? pre.trim() : "SUBJECT#" + pre.trim();
                        if (!completedIds.contains(preCheck)) {
                            throw new IllegalArgumentException("Chưa hoàn thành môn tiên quyết: " + pre);
                        }
                    }
                }
            }

            incrementStudentCount(classItem, true);

            SchoolItem enrollment = new SchoolItem();
            enrollment.setPk(classPk);
            enrollment.setSk("STUDENT#" + studentRaw);
            enrollment.setGsi1Pk(studentPk);
            enrollment.setGsi1Sk(classPk);
            enrollment.setJoinedAt(Instant.now().toString());
            enrollment.setStatus(1);
            table().putItem(enrollment);

            // --- UNENROLL ---
        } else {
            if (existing == null) throw new IllegalArgumentException("Bạn chưa tham gia lớp này");
            incrementStudentCount(classItem, false);
            table().deleteItem(enrollKey);
        }
    }

    private void incrementStudentCount(SchoolItem classItem, boolean increase) {
        int current = classItem.getStudentCount() != null ? classItem.getStudentCount() : 0;
        if (increase && current >= 40) {
            throw new IllegalArgumentException("Lớp học đã đầy (tối đa 40 sinh viên)");
        }
        int newCount = (!increase) ? ((current > 0) ? current - 1 : 0) : current + 1;
        classItem.setStudentCount(newCount);
        classItem.setUpdatedAt(Instant.now().toString());

        Map<String, AttributeValue> values = new HashMap<>();
        Map<String, String> names = new HashMap<>();
        names.put("#cnt", "studentCount");

        String condition;
        if (increase) {
            values.put(":max", AttributeValue.builder().n("40").build());
            condition = "(attribute_not_exists(#cnt) OR #cnt < :max)";
        } else {
            condition = null;
        }

        try {
            if (condition != null) {
                Expression conditionExp = Expression.builder()
                        .expression(condition)
                        .expressionValues(values)
                        .expressionNames(names)
                        .build();
                table().updateItem(r -> r.item(classItem).conditionExpression(conditionExp));
            } else {
                table().updateItem(classItem);
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Không thể cập nhật sĩ số lớp (Có thể lớp đã đầy hoặc dữ liệu thay đổi).");
        }
    }

    // ========================= ASSIGNMENTS =========================
    public void submitAssignment(String studentId, SubmitAssignmentRequest request) {
        DynamoDbTable<SchoolItem> table = table();
        String classId = request.getClass_id();
        String assignmentId = request.getAssignmentId();

        // 1. Kiểm tra Assignment tồn tại
        String assignmentPk = "ASSIGNMENT#" + classId;
        String assignmentSk = "INFO#" + assignmentId;
        Key assignmentKey = Key.builder().partitionValue(assignmentPk).sortValue(assignmentSk).build();
        SchoolItem assignment = table.getItem(assignmentKey);

        if (assignment == null) throw new IllegalArgumentException("Assignment không tồn tại");

        // 2. Kiểm tra Enrollment
        ensureEnrolled(classId, studentId);

        // 3. Validate input (Bây giờ chỉ check string, không check file binary nữa)
        if (request.getFileUrl() == null || request.getFileUrl().isEmpty()) {
            throw new IllegalArgumentException("Chưa tìm thấy file nộp bài (fileUrl missing)");
        }

        // --- CẮT BỎ ĐOẠN UPLOAD S3 CŨ ---
        // String fileUrl = s3Service.uploadFileWithPrefix(file, "assignments"); <-- XÓA DÒNG NÀY

        // Thay bằng lấy trực tiếp từ Request
        String fileUrl = request.getFileUrl();
        String fileName = request.getFileName() != null ? request.getFileName() : "unknown_file";

        // 4. Logic tính trễ hạn (Giữ nguyên)
        String now = Instant.now().toString();
        boolean isLate = isLateSubmission(assignment.getDeadline(), now);

        // 5. Tạo Submission Item
        String submissionSk = "SUBMISSION#" + assignmentId + "#" + studentId;

        SchoolItem submission = new SchoolItem();
        submission.setPk(assignmentPk);
        submission.setSk(submissionSk);

        // GSI cho Student xem lịch sử nộp bài
        submission.setGsi1Pk("USER#" + studentId);
        submission.setGsi1Sk("SUBMISSION#" + assignmentId);

        submission.setStudentId(studentId);

        // Lưu thông tin file
        submission.setFileUrl(fileUrl);   // Lưu key S3
        submission.setFileName(fileName); // Lưu tên gốc

        submission.setContent(request.getContent());
        submission.setSubmittedAt(now);
        submission.setType(isLate ? "late" : "on_time");
        submission.setStatus(1); // Thường nộp xong status là 1 (Active/Submitted)
        submission.setCreatedAt(now);

        // 6. Lưu xuống DB
        table.putItem(submission);

        log.info("Student {} submitted assignment {}. File: {}", studentId, assignmentId, fileName);
    }

    public StudentSubmissionResponse getPersonalSubmission(String studentId, String assignmentId) {
        DynamoDbTable<SchoolItem> table = table();
        String gsiPk = "USER#" + studentId;
        String gsiSk = "SUBMISSION#" + assignmentId;

        log.info("🔍 Querying Submission: PK=[{}] | SK=[{}]", gsiPk, gsiSk);
        QueryConditional queryConditional = QueryConditional.keyEqualTo(k -> k.partitionValue(gsiPk).sortValue(gsiSk));

        SchoolItem submissionItem = table.index("GSI1").query(queryConditional)
                .stream()
                .flatMap(page -> page.items().stream())
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài nộp cho Assignment ID: " + assignmentId));

        return StudentSubmissionResponse.builder()
                .id(submissionItem.getSk())
                .fileUrl(submissionItem.getFileUrl())
                .fileName(submissionItem.getFileName())
                .submittedAt(submissionItem.getSubmittedAt())
                .score(submissionItem.getScore())
                .feedback(submissionItem.getFeedback())
                .status(submissionItem.getStatus())
                .gradedAt(submissionItem.getGradedAt())
                .createdAt(submissionItem.getCreatedAt())
                .updatedAt(submissionItem.getUpdatedAt())
                .build();
    }

    public void updateSubmission(String studentId, SubmitAssignmentRequest request) {
        DynamoDbTable<SchoolItem> table = table();
        String classId = request.getClass_id();
        String assignmentId = request.getAssignmentId();

        // 1. Kiểm tra Assignment tồn tại
        Key assKey = Key.builder().partitionValue("ASSIGNMENT#" + classId).sortValue("INFO#" + assignmentId).build();
        SchoolItem assignment = table.getItem(assKey);
        if (assignment == null) throw new IllegalArgumentException("Bài tập không tồn tại");

        // 2. Kiểm tra Enrollment (Fix lỗi prefix nếu cần)
        String classPk = classId.startsWith("CLASS#") ? classId : "CLASS#" + classId;
        ensureEnrolled(classPk, studentId);

        // 3. Lấy bài nộp cũ (Old Submission)
        String submissionSk = "SUBMISSION#" + assignmentId + "#" + studentId;
        Key subKey = Key.builder().partitionValue("ASSIGNMENT#" + classId).sortValue(submissionSk).build();
        SchoolItem oldSubmission = table.getItem(subKey);

        if (oldSubmission == null) {
            throw new IllegalArgumentException("Chưa có bài nộp nào để cập nhật. Hãy dùng API nộp mới.");
        }

        // 4. Xử lý File Logic (Quan trọng)
        String finalFileUrl;
        String finalFileName;

        // Nếu request có gửi file mới -> Dùng file mới
        if (request.getFileUrl() != null && !request.getFileUrl().isEmpty()) {
            finalFileUrl = request.getFileUrl();
            finalFileName = (request.getFileName() != null) ? request.getFileName() : "updated_file";
        }
        // Nếu không gửi file mới -> Giữ lại file cũ
        else {
            finalFileUrl = oldSubmission.getFileUrl();
            finalFileName = oldSubmission.getFileName();
        }

        // Double check: Không được phép null cả 2 (tránh trường hợp xóa file)
        if (finalFileUrl == null) {
            throw new IllegalArgumentException("File nộp bài là bắt buộc");
        }

        // 5. Tính toán thời gian
        String now = Instant.now().toString();
        boolean isLate = isLateSubmission(assignment.getDeadline(), now);

        // 6. Tạo Submission Mới (Ghi đè)
        SchoolItem submission = new SchoolItem();
        submission.setPk("ASSIGNMENT#" + classId);
        submission.setSk(submissionSk);
        submission.setGsi1Pk("USER#" + studentId);
        submission.setGsi1Sk("SUBMISSION#" + assignmentId);
        submission.setStudentId(studentId);

        // Giữ lại tên sinh viên từ bản cũ (đỡ phải query User lại)
        submission.setStudentName(oldSubmission.getStudentName());

        // Cập nhật thông tin file & nội dung
        submission.setFileUrl(finalFileUrl);
        submission.setFileName(finalFileName);
        submission.setContent(request.getContent()); // Update nội dung mô tả

        // Update timestamp
        submission.setSubmittedAt(now); // Cập nhật lại thời gian nộp
        submission.setUpdatedAt(now);

        // Quan trọng: Reset điểm số vì nộp lại là phải chấm lại
        submission.setScore(null);
        submission.setFeedback(null);
        submission.setGradedAt(null);

        submission.setType(isLate ? "late" : "on_time");
        submission.setStatus(1); // Active

        table.putItem(submission);
        log.info("Student {} updated submission for {}. New File: {}", studentId, assignmentId, finalFileName);
    }

    public List<StudentAssignmentResponse> getStudentAssignments(String studentId, String classIdInput) {
        DynamoDbTable<SchoolItem> table = table();
        String classPk = classIdInput.startsWith("CLASS#") ? classIdInput : "CLASS#" + classIdInput;
        ensureEnrolled(classPk, studentId);

        String assignmentPk = classPk.replace("CLASS#", "ASSIGNMENT#");
        QueryConditional queryConditional = QueryConditional.sortBeginsWith(k -> k.partitionValue(assignmentPk).sortValue("INFO#"));

        List<SchoolItem> items = table.query(r -> r.queryConditional(queryConditional))
                .items().stream()
                .filter(item -> Boolean.TRUE.equals(item.getIsPublished()))
                .collect(Collectors.toList());

        return items.stream().map(item -> {
            String fileType = "unknown";
            if (item.getFileName() != null && item.getFileName().contains(".")) {
                fileType = item.getFileName().substring(item.getFileName().lastIndexOf(".") + 1);
            }
            return StudentAssignmentResponse.builder()
                    .id(item.getId())
                    .title(item.getTitle())
                    .description(item.getDescription())
                    .type(item.getType())
                    .weight(item.getWeight())
                    .deadline(item.getDeadline())
                    .maxScore(item.getMaxScore() != null ? item.getMaxScore() : 10.0)
                    .isPublished(item.getIsPublished())
                    .createdAt(item.getCreatedAt())
                    .updatedAt(item.getUpdatedAt())
                    .fileUrl(item.getFileUrl())
                    .fileName(item.getFileName())
                    .fileType(fileType)
                    .uploadedBy(item.getUploadedBy())
                    .uploadedAt(item.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    // ========================= NOTIFICATIONS & SEARCH =========================
    public List<NotificationDto> getNotifications(String userId, String type, String classId) {
        String pk = userId.startsWith("USER#") ? userId : "USER#" + userId;
        QueryConditional qc = QueryConditional.keyEqualTo(k -> k.partitionValue(pk));
        List<SchoolItem> items = table().query(r -> r.queryConditional(qc).scanIndexForward(false))
                .items().stream()
                .filter(i -> i.getSk() != null && i.getSk().startsWith("NOTI#"))
                .collect(Collectors.toList());

        return items.stream()
                .filter(i -> type == null || type.isEmpty() || type.equalsIgnoreCase(i.getType()))
                .filter(i -> classId == null || classId.isEmpty() || classId.equalsIgnoreCase(i.getClassId()))
                .map(i -> NotificationDto.builder()
                        .id(i.getSk())
                        .title(i.getTitle())
                        .content(i.getContent())
                        .type(i.getType())
                        .isRead(i.getIsRead())
                        .createdAt(i.getCreatedAt())
                        .classId(i.getClassId())
                        .sentBy(i.getSentBy())
                        .sentAt(i.getSentAt())
                        .build())
                .collect(Collectors.toList());
    }

    public List<SearchResultDto> searchForStudent(String type, String keyword, Map<String, Object> filters) {
        if ("classes".equalsIgnoreCase(type)) {
            List<ClassDto> classes = adminService.searchClasses(
                    (String) filters.getOrDefault("subject_id", null),
                    (String) filters.getOrDefault("teacher_id", null),
                    keyword, 1);
            return classes.stream()
                    .filter(c -> c.getStudentCount() == null || c.getStudentCount() < 40)
                    .map(c -> SearchResultDto.builder()
                            .id(c.getId())
                            .title(c.getName())
                            .subtitle(c.getSubjectId())
                            .type("class")
                            .extraInfo(c.getSemester())
                            .status(c.getStatus())
                            .build())
                    .collect(Collectors.toList());
        }
        if ("teachers".equalsIgnoreCase(type)) {
            return adminService.searchUsers(2, keyword).stream()
                    .map(u -> SearchResultDto.builder()
                            .id(u.getId())
                            .title(u.getName())
                            .subtitle(u.getEmail())
                            .type("teacher")
                            .avatar(u.getAvatar())
                            .extraInfo(u.getCodeUser())
                            .status(u.getStatus())
                            .build())
                    .collect(Collectors.toList());
        }
        return Collections.emptyList();
    }

    public RankingDto getRanking(String classId, String studentId) {
        String classPk = classId.startsWith("CLASS#") ? classId : "CLASS#" + classId;
        ensureEnrolled(classPk, studentId);

        QueryConditional qc = QueryConditional.keyEqualTo(k -> k.partitionValue(classPk));
        Map<String, Double> scoreMap = new HashMap<>();

        for (Page<SchoolItem> page : table().query(qc)) {
            for (SchoolItem item : page.items()) {
                if (item.getSk() != null && item.getSk().contains("SUBMISSION#")) {
                    String[] parts = item.getSk().split("SUBMISSION#");
                    if (parts.length == 2) {
                        String sid = parts[1];
                        double sc = item.getScore() != null ? item.getScore() : 0.0;
                        scoreMap.merge(sid, sc, Double::sum);
                    }
                }
            }
        }

        List<Map.Entry<String, Double>> sorted = scoreMap.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .collect(Collectors.toList());

        int rank = 0;
        double myScore = scoreMap.getOrDefault(studentId, 0.0);
        for (int i = 0; i < sorted.size(); i++) {
            if (sorted.get(i).getKey().equals(studentId)) {
                rank = i + 1;
                break;
            }
        }
        if (rank == 0 && !sorted.isEmpty()) {
            rank = sorted.size();
        }

        return RankingDto.builder().studentId(studentId).rank(rank).score(myScore).recommendations("").build();
    }

    // ========================= POSTS & COMMENTS =========================
    public PostDto createPost(String userId, String role, CreatePostRequest request) {
        // 1. Xử lý Class ID (Thêm prefix nếu thiếu)
        String classPk = request.getClassId().startsWith("CLASS#") ? request.getClassId() : "CLASS#" + request.getClassId();

        // 2. Validate Lớp học tồn tại
        SchoolItem classItem = table().getItem(Key.builder().partitionValue(classPk).sortValue("INFO").build());
        if (classItem == null) throw new IllegalArgumentException("Class not found");

        // 3. Logic kiểm tra quyền đăng bài (Giữ nguyên logic cũ của bạn)
        String teacherId = classItem.getTeacherId() != null ? classItem.getTeacherId().replace("USER#", "") : null;
        String userIdNormalized = userId != null && userId.startsWith("USER#") ? userId.replace("USER#", "") : userId;

        if (!"LECTURER".equalsIgnoreCase(role) && (teacherId != null && !teacherId.equals(userIdNormalized))) {
            // Nếu không phải GV chủ nhiệm thì phải là sinh viên trong lớp
            ensureEnrolled(classPk, userId);
        }

        // 4. Tạo Post ID
        String postId = UUID.randomUUID().toString();
        String now = Instant.now().toString();

        // 5. Map dữ liệu sang Entity SchoolItem
        SchoolItem post = new SchoolItem();
        post.setPk(classPk);
        post.setSk("POST#" + postId);

        // GSI để query chi tiết bài viết
        post.setGsi1Pk("POST#" + postId);
        post.setGsi1Sk("INFO");

        post.setPostId(postId);
        post.setSenderId(userId);
        post.setClassId(request.getClassId());
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setIsPinned(request.getPinned() != null ? request.getPinned() : Boolean.FALSE);

        // Khởi tạo các biến đếm
        post.setLikeCount(0);
        post.setCommentCount(0);
        post.setCreatedAt(now);

        // --- CẮT BỎ ĐOẠN UPLOAD S3 CŨ ---
        // if (request.getAttachment() != null ...) { post.setFileUrl(s3Service.upload...) } <-- XÓA

        // --- THAY BẰNG LOGIC MỚI ---
        // Lưu trực tiếp đường dẫn file từ Request (nếu có)
        if (request.getAttachmentUrl() != null && !request.getAttachmentUrl().isEmpty()) {
            post.setFileUrl(request.getAttachmentUrl());
        }

        // 6. Lưu xuống DB
        table().putItem(post);

        return mapToPostDto(post);
    }

    public CommentDto createComment(String userId, CreateCommentRequest request) {
        // 1. Kiểm tra bài viết tồn tại
        SchoolItem post = fetchPostById(request.getPostId());
        if (post == null) throw new IllegalArgumentException("Post không tồn tại");

        // 2. Kiểm tra quyền (phải là thành viên lớp hoặc giáo viên)
        ensureEnrolledOrTeacher(post.getPk(), userId);

        // 3. Tạo Comment ID
        String commentId = UUID.randomUUID().toString();
        String now = Instant.now().toString();

        SchoolItem comment = new SchoolItem();
        // PK là POST#ID để gom tất cả comment của 1 post vào chung Partition
        comment.setPk("POST#" + request.getPostId());
        comment.setSk("COMMENT#" + commentId);

        // GSI để query chi tiết 1 comment (nếu cần)
        comment.setGsi1Pk("COMMENT#" + commentId);
        comment.setGsi1Sk("INFO");

        comment.setPostId(request.getPostId());
        comment.setParentId(request.getParentId()); // Null nếu là comment cấp 1
        comment.setSenderId(userId);
        comment.setClassId(post.getClassId());
        comment.setContent(request.getContent());
        comment.setCreatedAt(now);
        comment.setLikeCount(0);

        // --- CẮT BỎ ĐOẠN UPLOAD S3 CŨ ---
        // if (request.getAttachment() != null...) upload... <-- XÓA

        // --- THAY BẰNG LOGIC MỚI ---
        // Lưu link ảnh/file nếu Frontend có gửi lên
        if (request.getAttachmentUrl() != null && !request.getAttachmentUrl().isEmpty()) {
            comment.setFileUrl(request.getAttachmentUrl());
        }

        // 4. Lưu Comment xuống DB
        table().putItem(comment);

        // 5. Tăng biến đếm Comment cho bài Post (Atomic Counter)
        incrementCommentCount(post.getPk(), post.getSk(), 1);

        return mapToCommentDto(comment);
    }

    public List<PostDto> listPosts(String classId) {
        String classPk = classId.startsWith("CLASS#") ? classId : "CLASS#" + classId;
        QueryConditional qc = QueryConditional.keyEqualTo(k -> k.partitionValue(classPk));
        return table().query(r -> r.queryConditional(qc).scanIndexForward(false))
                .items().stream()
                .filter(i -> i.getSk() != null && i.getSk().startsWith("POST#"))
                .map(this::mapToPostDto)
                .collect(Collectors.toList());
    }

    public List<CommentDto> listComments(String postId) {
        QueryConditional qc = QueryConditional.keyEqualTo(k -> k.partitionValue("POST#" + postId));
        return table().query(qc).items().stream()
                .filter(i -> i.getSk() != null && i.getSk().startsWith("COMMENT#"))
                .sorted(Comparator.comparing(SchoolItem::getCreatedAt, Comparator.nullsLast(String::compareTo)).reversed())
                .map(this::mapToCommentDto)
                .collect(Collectors.toList());
    }

    public void deletePost(String userId, String role, String postId) {
        SchoolItem post = fetchPostById(postId);
        if (post == null) throw new IllegalArgumentException("Post không tồn tại");
        boolean isOwner = post.getSenderId() != null && post.getSenderId().equals(userId);
        if (!"LECTURER".equalsIgnoreCase(role) && !isOwner) {
            throw new IllegalArgumentException("Không có quyền xóa bài viết này");
        }
        table().deleteItem(Key.builder().partitionValue(post.getPk()).sortValue(post.getSk()).build());

        QueryConditional qc = QueryConditional.keyEqualTo(k -> k.partitionValue("POST#" + postId));
        for (Page<SchoolItem> page : table().query(qc)) {
            for (SchoolItem item : page.items()) {
                table().deleteItem(item);
            }
        }
    }

    public void deleteComment(String userId, String role, String commentId) {
        SchoolItem comment = fetchCommentById(commentId);
        if (comment == null) throw new IllegalArgumentException("Comment không tồn tại");
        boolean isOwner = comment.getSenderId() != null && comment.getSenderId().equals(userId);
        if (!isOwner && !"LECTURER".equalsIgnoreCase(role)) {
            throw new IllegalArgumentException("Không có quyền xóa comment này");
        }
        table().deleteItem(comment);
        if (comment.getPostId() != null) {
            SchoolItem post = fetchPostById(comment.getPostId());
            if (post != null) incrementCommentCount(post.getPk(), post.getSk(), -1);
        }
    }

    public int updateReaction(String userId, ReactionRequest request) {
        SchoolItem entity = fetchEntityById(request.getEntityId(), request.getEntityType());
        if (entity == null) throw new IllegalArgumentException("Entity không tồn tại");
        String pk = "REACTION#" + request.getEntityId();
        String sk = userId.startsWith("USER#") ? userId : "USER#" + userId;
        Key reactionKey = Key.builder().partitionValue(pk).sortValue(sk).build();

        if ("add".equalsIgnoreCase(request.getAction())) {
            SchoolItem reaction = new SchoolItem();
            reaction.setPk(pk);
            reaction.setSk(sk);
            reaction.setCreatedAt(Instant.now().toString());
            table().putItem(reaction);
            adjustLikeCount(entity, 1);
        } else if ("remove".equalsIgnoreCase(request.getAction())) {
            table().deleteItem(reactionKey);
            adjustLikeCount(entity, -1);
        } else {
            throw new IllegalArgumentException("Action không hợp lệ");
        }
        return entity.getLikeCount() != null ? entity.getLikeCount() : 0;
    }

    public List<CommentDto> getCommentsByPost(String postId) {
        DynamoDbTable<SchoolItem> table = table();

        // Query: PK = POST#<id>, SK bắt đầu bằng COMMENT#
        QueryConditional condition = QueryConditional.sortBeginsWith(k ->
                k.partitionValue("POST#" + postId)
                        .sortValue("COMMENT#")
        );

        return table.query(r -> r.queryConditional(condition))
                .items().stream()
                .map(this::mapToCommentDto) // <--- Gọi hàm map chuẩn ở trên
                .sorted(Comparator.comparing(CommentDto::getCreatedAt)) // Sắp xếp cũ -> mới
                .collect(Collectors.toList());
    }
    // ========================= PRIVATE HELPERS =========================
// Bạn copy hàm này để xuống dưới cùng file Service
    private CommentDto mapToCommentDto(SchoolItem item) {
        // 1. Xử lý ID
        String realId = item.getId();
        if (realId == null && item.getSk().startsWith("COMMENT#")) {
            realId = item.getSk().replace("COMMENT#", "");
        }

        // 2. Xử lý Sender ID (Bỏ prefix USER#)
        String cleanSenderId = item.getSenderId();
        if (cleanSenderId != null) {
            cleanSenderId = cleanSenderId.replace("USER#", "");
        }

        // 3. Build DTO
        return CommentDto.builder()
                .id(realId)
                .postId(item.getPostId())
                .classId(item.getClassId())
                .parentId(item.getParentId()) // ID của comment cha (nếu có)

                .content(item.getContent())
                .attachmentUrl(item.getFileUrl()) // DB lưu là fileUrl, DTO là attachmentUrl

                .senderId(cleanSenderId)
                .studentName(item.getStudentName()) // Tên người bình luận
                .avatar(item.getAvatar())           // Avatar người bình luận

                .likeCount(item.getLikeCount() != null ? item.getLikeCount() : 0)
                .createdAt(item.getCreatedAt())
                .build();
    }

    private ClassDto fetchClassDto(String classPk) {
        if (classPk == null) return null;
        Key key = Key.builder().partitionValue(classPk).sortValue("INFO").build();
        SchoolItem item = table().getItem(key);
        if (item == null) return null;

        String subjectName = null;
        if (item.getSubjectId() != null) {
            SchoolItem subject = table().getItem(Key.builder().partitionValue(item.getSubjectId()).sortValue("INFO").build());
            subjectName = (subject != null) ? subject.getName() : null;
        }

        String lecturerName = null;
        if (item.getTeacherId() != null) {
            SchoolItem teacher = table().getItem(Key.builder().partitionValue(item.getTeacherId()).sortValue("PROFILE").build());
            lecturerName = (teacher != null) ? teacher.getName() : null;
        }

        return ClassDto.builder()
                .id(item.getId())
                .name(item.getName())
                .subjectId(item.getSubjectId() != null ? item.getSubjectId().replace("SUBJECT#", "") : null)
                .subjectName(subjectName)
                .teacherId(item.getTeacherId() != null ? item.getTeacherId().replace("USER#", "") : null)
                .lecturerName(lecturerName)
                .room(item.getRoom())
                .semester(item.getSemester())
                .academicYear(item.getAcademicYear())
                .studentCount(item.getStudentCount())
                .status(item.getStatus())
                .description(item.getDescription())
                .password(item.getPassword()) // Trả về password nếu cần
                .build();
    }

    private SchoolItem fetchPostById(String postId) {
        QueryConditional qc = QueryConditional.keyEqualTo(k -> k.partitionValue("POST#" + postId));
        QueryConditional idxQc = QueryConditional.keyEqualTo(k -> k.partitionValue("POST#" + postId));
        for (Page<SchoolItem> page : gsi1().query(idxQc)) {
            for (SchoolItem item : page.items()) {
                return table().getItem(Key.builder().partitionValue(item.getPk()).sortValue(item.getSk()).build());
            }
        }
        return table().query(qc).items().stream().findFirst().orElse(null);
    }

    private SchoolItem fetchCommentById(String commentId) {
        QueryConditional idxQc = QueryConditional.keyEqualTo(k -> k.partitionValue("COMMENT#" + commentId));
        for (Page<SchoolItem> page : gsi1().query(idxQc)) {
            for (SchoolItem item : page.items()) {
                return table().getItem(Key.builder().partitionValue(item.getPk()).sortValue(item.getSk()).build());
            }
        }
        return null;
    }

    private SchoolItem fetchEntityById(String entityId, String type) {
        if ("POST".equalsIgnoreCase(type)) return fetchPostById(entityId);
        if ("COMMENT".equalsIgnoreCase(type)) return fetchCommentById(entityId);
        return null;
    }

    private void ensureEnrolled(String classIdInput, String studentId) {
        String pk = classIdInput.startsWith("CLASS#") ? classIdInput : "CLASS#" + classIdInput;
        String rawStudentId = studentId.startsWith("USER#") ? studentId.replace("USER#", "") : studentId;
        String sk = "STUDENT#" + rawStudentId;

        Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
        SchoolItem enrollment = table().getItem(key);

        if (enrollment == null) throw new SecurityException("Bạn chưa tham gia lớp này.");

        boolean isActive = false;
        if (enrollment.getStatus() instanceof Number) {
            int statusVal = ((Number) enrollment.getStatus()).intValue();
            if (statusVal == 1) isActive = true;
        }
        if (!isActive) throw new IllegalArgumentException("Trạng thái enrollment không hợp lệ.");
    }

    private void ensureEnrolledOrTeacher(String classPk, String userId) {
        SchoolItem classItem = table().getItem(Key.builder().partitionValue(classPk).sortValue("INFO").build());
        if (classItem == null) throw new IllegalArgumentException("Class not found: " + classPk);
        String teacherId = classItem.getTeacherId() != null ? classItem.getTeacherId().replace("USER#", "") : null;
        String normalizedUserId = userId != null && userId.startsWith("USER#") ? userId.replace("USER#", "") : userId;

        if (teacherId != null && teacherId.equals(normalizedUserId)) return;
        ensureEnrolled(classPk, userId);
    }

    private void incrementCommentCount(String pk, String sk, int delta) {
        SchoolItem post = table().getItem(Key.builder().partitionValue(pk).sortValue(sk).build());
        if (post == null) return;
        int next = Math.max(0, (post.getCommentCount() != null ? post.getCommentCount() : 0) + delta);
        post.setCommentCount(next);
        table().updateItem(post);
    }

    private void adjustLikeCount(SchoolItem entity, int delta) {
        int current = entity.getLikeCount() != null ? entity.getLikeCount() : 0;
        int next = Math.max(0, current + delta);
        entity.setLikeCount(next);
        table().updateItem(entity);
    }

    private boolean isLateSubmission(String deadline, String submittedAt) {
        if (deadline == null || deadline.isEmpty()) return false;
        try {
            Instant dl = Instant.parse(deadline);
            Instant sub = Instant.parse(submittedAt);
            return sub.isAfter(dl);
        } catch (Exception e) {
            return false;
        }
    }

    private PostDto mapToPostDto(SchoolItem item) {
        return PostDto.builder()
                .id(item.getPostId() != null ? item.getPostId() : item.getSk().replace("POST#", ""))
                .classId(item.getClassId())
                .lecturerId(item.getSenderId())
                .title(item.getTitle())
                .content(item.getContent())
                .attachmentUrl(item.getFileUrl())
                .isPinned(item.getIsPinned())
                .likeCount(item.getLikeCount())
                .commentCount(item.getCommentCount())
                .createdAt(item.getCreatedAt())
                .build();
    }
}