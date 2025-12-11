package com.example.demo.controller;

import com.example.demo.dto.Class.NotificationDto;
import com.example.demo.dto.Post.CommentDto;
import com.example.demo.dto.Post.CreateCommentRequest;
import com.example.demo.dto.Post.CreatePostRequest;
import com.example.demo.dto.Post.PostDto;
import com.example.demo.dto.Post.ReactionRequest;
import com.example.demo.dto.Search.SearchResultDto;
import com.example.demo.dto.Student.*;
import com.example.demo.dto.User.UserDto;
import com.example.demo.service.StudentService;
import com.example.demo.service.UserService; // <--- Cần thêm Service này
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper; // <--- Cần thêm để decode JSON
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;
    private final UserService userService;       // Inject UserService để tìm thông tin user
    private final ObjectMapper objectMapper;     // Inject ObjectMapper để decode Token

    // ========================================================================
    // 🛠️ PRIVATE HELPER: LẤY STUDENT ID THẬT (SE...) TỪ ID TOKEN
    // ========================================================================
    private String getStudentIdFromToken(String idToken) {
        if (idToken == null || idToken.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng gửi kèm header 'user-idToken' để xác thực.");
        }

        try {
            // 1. Clean token (Bỏ chữ Bearer nếu FE lỡ gửi thừa)
            String cleanToken = idToken.replace("Bearer ", "");

            // 2. Decode Payload (Phần ở giữa dấu chấm của JWT)
            String[] parts = cleanToken.split("\\.");
            if (parts.length < 2) throw new IllegalArgumentException("Token không hợp lệ");

            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]));
            JsonNode node = objectMapper.readTree(payloadJson);

            // 3. Lấy Email
            if (!node.has("email")) {
                throw new IllegalArgumentException("Token không chứa email");
            }
            String email = node.get("email").asText();

            // 4. Tìm User trong DB bằng Email -> Lấy CodeUser (SE123...)
            UserDto student = userService.getMyProfile(email);

            if (student == null || student.getCodeUser() == null) {
                throw new IllegalArgumentException("Không tìm thấy thông tin sinh viên cho email: " + email);
            }

            return student.getCodeUser(); // Trả về ID thật trong DB (VD: SE170123)

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new IllegalArgumentException("Lỗi xác thực ID Token: " + e.getMessage());
        }
    }

    // ========================================================================
    // 🚀 CÁC API STUDENT (ĐÃ CẬP NHẬT HEADER)
    // ========================================================================

    @GetMapping("/classes/enrolled")
    public ResponseEntity<?> getEnrolledClasses(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "user-idToken", required = false) String idToken, // <--- Header mới
            @RequestParam(value = "class_id", required = false) String classId
    ) {
        try {
            String studentId = getStudentIdFromToken(idToken); // <--- Logic mới
            return ResponseEntity.ok(Collections.singletonMap("results", studentService.getEnrolledClasses(studentId, classId)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PostMapping("/enroll")
    public ResponseEntity<?> enrollOrUnenroll(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "user-idToken", required = false) String idToken,
            @RequestBody EnrollRequest request
    ) {
        try {
            String studentId = getStudentIdFromToken(idToken);
            studentService.handleEnrollAction(studentId, request);
            String message = "enroll".equalsIgnoreCase(request.getAction()) ? "Enrolled Successfully" : "Unenrolled Successfully";
            return ResponseEntity.ok(Collections.singletonMap("message", message));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitAssignment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody SubmitAssignmentRequest request
    ) {
        try {
            String studentId = getStudentIdFromToken(authHeader);
            studentService.submitAssignment(studentId, request);
            return ResponseEntity.ok(Collections.singletonMap("message", "Submitted Successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "user-idToken", required = false) String idToken,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "class_id", required = false) String classId
    ) {
        try {
            String studentId = getStudentIdFromToken(idToken);
            List<NotificationDto> notifications = studentService.getNotifications(studentId, type, classId);
            return ResponseEntity.ok(Collections.singletonMap("results", notifications));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @GetMapping("/ranking/{class_id}")
    public ResponseEntity<?> getRanking(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "user-idToken", required = false) String idToken,
            @PathVariable("class_id") String classId
    ) {
        try {
            String studentId = getStudentIdFromToken(idToken);
            RankingDto dto = studentService.getRanking(classId, studentId);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(
            @RequestParam("type") String type,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "subject_id", required = false) String subjectId,
            @RequestParam(value = "teacher_id", required = false) String teacherId,
            @RequestParam(value = "semester", required = false) String semester,
            @RequestParam(value = "academic_year", required = false) String academicYear,
            @RequestParam(value = "department", required = false) String department
    ) {
        // API này không cần ID sinh viên nên giữ nguyên
        Map<String, Object> filters = new HashMap<>();
        if (subjectId != null) filters.put("subject_id", subjectId);
        if (teacherId != null) filters.put("teacher_id", teacherId);
        if (semester != null) filters.put("semester", semester);
        if (academicYear != null) filters.put("academic_year", academicYear);
        if (department != null) filters.put("department", department);
        List<SearchResultDto> results = studentService.searchForStudent(type, keyword, filters);
        return ResponseEntity.ok(Collections.singletonMap("results", results));
    }

    @PostMapping(value = "/classes/{class_id}/posts") // Bỏ consumes multipart
    public ResponseEntity<?> createPost(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "user-idToken", required = false) String idToken,
            @PathVariable("class_id") String classId,
            @RequestBody CreatePostRequest request // <-- Dùng @RequestBody
    ) {
        try {
            String studentId = getStudentIdFromToken(idToken);

            // Gán classId từ URL vào DTO để đảm bảo tính nhất quán
            request.setClassId(classId);

            // Gọi Service
            PostDto post = studentService.createPost(studentId, "STUDENT", request);

            return ResponseEntity.ok(post);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PostMapping(value = "/posts/{post_id}/comments") // Bỏ consumes Multipart
    public ResponseEntity<?> createComment(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "user-idToken", required = false) String idToken,
            @PathVariable("post_id") String postId,
            @RequestBody CreateCommentRequest request // <-- Dùng @RequestBody
    ) {
        try {
            String studentId = getStudentIdFromToken(idToken);

            // Gán postId vào DTO cho chắc chắn
            request.setPostId(postId);

            CommentDto comment = studentService.createComment(studentId, request);
            return ResponseEntity.ok(comment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @GetMapping("/classes/{class_id}/posts")
    public ResponseEntity<?> listPostsOrComments(
            @PathVariable("class_id") String classId,
            @RequestParam(value = "post_id", required = false) String postId
    ) {
        // API này public hoặc không cần user id cụ thể để xem list
        if (postId != null) {
            List<CommentDto> comments = studentService.listComments(postId);
            return ResponseEntity.ok(Collections.singletonMap("results", comments));
        }
        List<PostDto> posts = studentService.listPosts(classId);
        return ResponseEntity.ok(Collections.singletonMap("results", posts));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePost(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "user-idToken", required = false) String idToken,
            @PathVariable("id") String postId
    ) {
        try {
            String studentId = getStudentIdFromToken(idToken);
            studentService.deletePost(studentId, "STUDENT", postId);
            return ResponseEntity.ok(Collections.singletonMap("message", "Deleted"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<?> deleteComment(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "user-idToken", required = false) String idToken,
            @PathVariable("id") String commentId
    ) {
        try {
            String studentId = getStudentIdFromToken(idToken);
            studentService.deleteComment(studentId, "STUDENT", commentId);
            return ResponseEntity.ok(Collections.singletonMap("message", "Deleted"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PutMapping("/reactions/{id}")
    public ResponseEntity<?> updateReaction(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "user-idToken", required = false) String idToken,
            @PathVariable("id") String entityId,
            @RequestBody ReactionRequest request
    ) {
        if (!"POST".equalsIgnoreCase(request.getEntityType()) && !"COMMENT".equalsIgnoreCase(request.getEntityType())) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Chỉ hỗ trợ reactions cho post/comment."));
        }
        try {
            String studentId = getStudentIdFromToken(idToken);
            if (request.getEntityId() == null) {
                request.setEntityId(entityId);
            }
            int updated = studentService.updateReaction(studentId, request);
            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Updated");
            resp.put("updatedLikeCount", updated);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @GetMapping("/assignments")
    @Operation(summary = "Get All Assignments", description = "Lấy danh sách bài tập của một lớp (Chỉ lấy bài đã Publish)")
    public ResponseEntity<?> getAssignments(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "user-idToken", required = false) String idToken,
            @RequestParam("classId") String classId
    ) {
        try {
            String studentId = getStudentIdFromToken(idToken);
            List<StudentAssignmentResponse> assignments = studentService.getStudentAssignments(studentId, classId);
            return ResponseEntity.ok(Collections.singletonMap("data", assignments));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @GetMapping("/assignments/get-submisstions")
    @Operation(summary = "Get Personal Submission", description = "HS lấy chi tiết bài nộp của bản thân")
    public ResponseEntity<?> getPersonalSubmission(
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "user-idToken", required = false) String idToken,
            @RequestParam("assignmentId") String assignmentId
    ) {
        try {
            // Thay vì truyền authHeader, bây giờ chúng ta lấy ID thật từ Token
            String studentId = getStudentIdFromToken(idToken);

            // LƯU Ý: Bạn cần update hàm getPersonalSubmission trong Service để nhận studentId (String)
            // thay vì nhận authHeader.
            StudentSubmissionResponse submission = studentService.getPersonalSubmission(studentId, assignmentId);

            return ResponseEntity.ok(Collections.singletonMap("data", submission));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PutMapping("/assignments/{assignmentId}/submit")
    public ResponseEntity<?> updateSubmission(
            @PathVariable("assignmentId") String assignmentId,
            @RequestHeader(value = "user-idToken", required = false) String idToken,
            @RequestBody SubmitAssignmentRequest request // Nhận JSON
    ) {
        try {
            String studentId = getStudentIdFromToken(idToken);

            // Đảm bảo assignmentId trong body khớp với path (hoặc set lại cho chắc)
            request.setAssignmentId(assignmentId);

            studentService.updateSubmission(studentId, request);

            return ResponseEntity.ok(Collections.singletonMap("message", "Cập nhật bài nộp thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }
    @GetMapping("/posts/{post_id}/comments")
    @Operation(summary = "Get Comments", description = "SV xem danh sách bình luận của bài viết")
    public ResponseEntity<?> getCommentsByPost(
            @RequestHeader("Authorization") String authHeader, // Header bắt buộc
            @PathVariable("post_id") String postId
    ) {
        try {
            // Gọi Service
            List<CommentDto> comments = studentService.getCommentsByPost(postId);

            // Trả về
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Lấy danh sách bình luận thành công");
            response.put("data", comments);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }
}