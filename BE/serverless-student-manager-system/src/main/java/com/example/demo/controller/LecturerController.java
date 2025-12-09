package com.example.demo.controller;

import com.example.demo.dto.Class.ClassDto;
import com.example.demo.dto.Class.CreateClassRequest;
import com.example.demo.dto.Class.UpdateClassDto;
import com.example.demo.dto.Grade.GradeSubmissionDto;
import com.example.demo.dto.Lecturer.*;
import com.example.demo.dto.Notification.CreateNotificationRequest;
import com.example.demo.dto.Post.CreateCommentRequest;
import com.example.demo.dto.Post.CreatePostRequest;
import com.example.demo.dto.User.UserDto;
import com.example.demo.entity.SchoolItem;
import com.example.demo.service.LecturerService;
import com.example.demo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@RestController
@RequestMapping("/api/lecturer")
@RequiredArgsConstructor
@Tag(name = "Lecturer")
@CrossOrigin(origins = "*")
public class LecturerController {

    private final LecturerService lecturerService;
    private final UserService userService;
    @GetMapping("/classes")
    @Operation(summary = "List Classes", description = "Lấy danh sách lớp học của GV (optional filter, search)")
    public ResponseEntity<?> getClasses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String semester,
            Authentication authentication
    ) {
        try {
            String email = null;
            if (authentication.getPrincipal() instanceof Jwt jwt) {
                email = jwt.getClaimAsString("email");
            }
            if (email == null) {
                return ResponseEntity.badRequest()
                        .body(Collections.singletonMap("error", "Token không chứa email. Vui lòng sử dụng ID Token."));
            }
            UserDto lecturer = userService.getMyProfile(email);
            if (lecturer == null || lecturer.getCodeUser() == null) {
                return ResponseEntity.badRequest()
                        .body(Collections.singletonMap("error", "Không tìm thấy Code giảng viên (GV...) cho email: " + email));
            }
            List<ClassDto> classes = lecturerService.getClassesForLecturer(
                    lecturer.getCodeUser(),
                    keyword, status, semester
            );

            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Lấy danh sách lớp thành công");
            response.put("data", classes);
            response.put("count", classes.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PutMapping("/classes/{id}")
    @Operation(summary = "Edit Class", description = "Sửa thông tin lớp học (tên, mã, kỳ học, năm học, mô tả)")
    public ResponseEntity<?> editClass(
            @PathVariable("id") String classId,
            @RequestBody UpdateClassDto request,
            Authentication authentication
    ) {
        try {
            String teacherId = authentication.getName();
            ClassDto updatedClass = lecturerService.updateClassForLecturer(
                    classId, request, teacherId
            );

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Cập nhật lớp thành công");
            response.put("status", "success");
            response.put("data", updatedClass);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("error", "Bạn không có quyền chỉnh sửa lớp này"));
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @DeleteMapping("/classes/{id}")
    @Operation(summary = "Deactivate Class", description = "Hủy kích hoạt lớp học (status: 1->0)")
    public ResponseEntity<?> deactivateClass(
            @PathVariable("id") String classId,
            Authentication authentication
    ) {
        try {
            String teacherId = authentication.getName();
            lecturerService.deactivateClassForLecturer(classId, teacherId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lớp đã bị vô hiệu hóa");
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("error", "Bạn không có quyền xóa lớp này"));
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    @GetMapping("/students/{class_id}")
    @Operation(summary = "List Students in Class", description = "Lấy danh sách sinh viên trong lớp (optional search, filter)")
    public ResponseEntity<?> getStudentsInClass(
            @PathVariable("class_id") String classId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            Authentication authentication
    ) {
        try {
            String teacherId = authentication.getName();
            List<StudentInClassDto> students = lecturerService.getStudentsInClass(
                    classId, keyword, status, teacherId
            );

            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Lấy danh sách sinh viên thành công");
            response.put("count", students.size());
            response.put("data", students);

            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("error", "Bạn không có quyền xem danh sách sinh viên của lớp này"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }
    @PostMapping("/assignments")
    @Operation(summary = "Create Assignment", description = "GV tạo bài tập cho lớp")
    public ResponseEntity<?> createAssignment(@RequestBody CreateAssignmentDto request) {
        try {
            AssignmentDto newAssignment = lecturerService.createAssignment(
                    request.getClassId(),
                    request
            );

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Bài tập được tạo thành công");
            response.put("data", newAssignment);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @GetMapping("/classes/{class_id}/assignments")
    @Operation(summary = "List Assignments", description = "Lấy danh sách bài tập của lớp")
    public ResponseEntity<?> getAssignments(@PathVariable("class_id") String classId) {
        try {
            List<AssignmentDto> assignments = lecturerService.getAssignmentsByClass(classId);

            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Lấy danh sách bài tập thành công");
            response.put("data", assignments);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }


    @PutMapping("/assignments/{id}")
    @Operation(summary = "Edit Assignment", description = "Sửa thông tin bài tập/cột điểm")
    public ResponseEntity<?> editAssignment(
            @PathVariable("id") String assignmentId,
            @RequestParam("classId") String classId,
            @RequestBody UpdateAssignmentDto request
    ) {
        try {
            AssignmentDto updatedAssignment = lecturerService.updateAssignment(
                    classId,
                    assignmentId,
                    request
            );

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Bài tập được cập nhật thành công");
            response.put("status", "success");
            response.put("data", updatedAssignment);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @DeleteMapping("/assignments/{id}")
    @Operation(summary = "Delete Assignment", description = "Xóa bài tập (kiểm tra submissions trước)")
    public ResponseEntity<?> deleteAssignment(
            @PathVariable("id") String assignmentId,
            @RequestParam("classId") String classId
    ) {
        try {
            lecturerService.deleteAssignment(classId, assignmentId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Bài tập đã được xóa hoặc vô hiệu hóa");
            response.put("status", "success");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PutMapping("/assignments/{assignment_id}/update-grades")
    @Operation(summary = "Grade Submission", description = "GV chấm điểm (Lấy email từ user-idToken)")
    public ResponseEntity<?> updateGrades(
            @PathVariable("assignment_id") String pathAssignmentId,
            @RequestHeader("Authorization") String authHeader,
            @RequestHeader(value = "user-idToken", required = true) String idToken,
            @RequestParam("classId") String classId,
            @RequestBody GradeSubmissionDto gradeDto
    ) {
        try {
            if (gradeDto.getAssignmentId() == null || !gradeDto.getAssignmentId().equals(pathAssignmentId)) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Assignment ID không khớp"));
            }
            String email = getEmailFromIdToken(idToken);
            if (email == null) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Token user-idToken không hợp lệ"));
            }

            // 3. Lấy Profile GV từ Email
            UserDto lecturer = userService.getMyProfile(email);
            if (lecturer == null || lecturer.getCodeUser() == null) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Không tìm thấy GV với email: " + email));
            }

            // 4. GỌI SERVICE CHẤM ĐIỂM
            lecturerService.processGradeUpdate(
                    classId,
                    pathAssignmentId,
                    lecturer.getCodeUser(), // Mã GV (GV...)
                    gradeDto
            );

            return ResponseEntity.ok(Collections.singletonMap("message", "Chấm điểm thành công"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PostMapping(value = "/classes/{class_id}/posts") // Bỏ consumes Multipart
    @Operation(summary = "Create Post", description = "GV tạo bài viết (Gửi link ảnh từ S3)")
    public ResponseEntity<?> createPost(
            @PathVariable("class_id") String classId,
            @RequestBody CreatePostRequest request, // <--- Dùng @RequestBody
            Authentication authentication
    ) {
        try {
            // 1. Lấy Email từ Token
            String email = null;
            if (authentication.getPrincipal() instanceof Jwt jwt) {
                email = jwt.getClaimAsString("email");
            }
            if (email == null) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Token không hợp lệ (thiếu email)"));
            }

            // 2. Lấy thông tin giảng viên (UserCode)
            UserDto lecturer = userService.getMyProfile(email);
            if (lecturer == null || lecturer.getCodeUser() == null) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Không tìm thấy thông tin giảng viên"));
            }

            // 3. Gán classId vào request cho chắc chắn
            request.setClassId(classId);

            // 4. Gọi Service
            lecturerService.createClassPost(classId, lecturer.getCodeUser(), request);

            return ResponseEntity.ok(Collections.singletonMap("message", "Đăng bài thành công"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    /**
     * Lấy danh sách bài viết của lớp
     * GET /api/lecturer/classes/{class_id}/posts
     */
    @GetMapping("/classes/{class_id}/posts")
    @Operation(summary = "List Posts/Comments", description = "Lấy danh sách bài viết của lớp")
    public ResponseEntity<?> getPostsByClass(@PathVariable("class_id") String classId) {
        try {
            List<Map<String, Object>> posts = lecturerService.getPostsByClass(classId);

            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Lấy danh sách bài viết thành công");
            response.put("data", posts);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    /**
     * Tạo bình luận cho bài viết
     * POST /api/lecturer/posts/{post_id}/comments
     */
    @PostMapping(value = "/posts/{post_id}/comments") // Bỏ consumes multipart
    @Operation(summary = "Create Comment", description = "GV bình luận (Gửi link ảnh từ S3)")
    public ResponseEntity<?> createComment(
            @PathVariable("post_id") String postId,
            @RequestBody CreateCommentRequest request, // <--- Dùng @RequestBody
            Authentication authentication
    ) {
        try {
            String email = null;
            if (authentication.getPrincipal() instanceof Jwt jwt) {
                email = jwt.getClaimAsString("email");
            }
            UserDto user = userService.getMyProfile(email);
            if (user == null) return ResponseEntity.badRequest().body(Collections.singletonMap("error", "User not found"));
            request.setPostId(postId);
            lecturerService.createComment(postId, user.getCodeUser(), request);
            return ResponseEntity.ok(Collections.singletonMap("message", "Bình luận thành công"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    /**
     * Lấy bình luận của bài viết
     * GET /api/lecturer/posts/{post_id}/comments
     */
    @GetMapping("/posts/{post_id}/comments")
    @Operation(summary = "Get Comments", description = "Lấy danh sách bình luận của bài viết")
    public ResponseEntity<?> getCommentsByPost(@PathVariable("post_id") String postId) {
        try {
            List<Map<String, String>> comments = lecturerService.getCommentsByPost(postId);

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

    /**
     * Xóa bài viết
     * DELETE /api/lecturer/posts/{id}
     */
    @DeleteMapping("/posts/{id}")
    @Operation(summary = "Delete Post", description = "Xóa bài viết")
    public ResponseEntity<?> deletePost(
            @PathVariable("id") String postId,
            @RequestParam("classId") String classId
    ) {
        try {
            lecturerService.deletePost(classId, postId);

            return ResponseEntity.ok(Collections.singletonMap("message", "Bài viết đã bị xóa"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    /**
     * Xóa bình luận
     * DELETE /api/lecturer/comments/{id}
     */
    @DeleteMapping("/comments/{id}")
    @Operation(summary = "Delete Comment", description = "Xóa bình luận")
    public ResponseEntity<?> deleteComment(@PathVariable("id") String commentId,
                                           @RequestParam("postId") String postId) {
        try {
            lecturerService.deleteComment(postId, commentId);

            return ResponseEntity.ok(Collections.singletonMap("message", "Bình luận đã bị xóa"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    // ========================================================================
    // 6. XẾP HẠNG SINH VIÊN
    // ========================================================================

    /**
     * Lấy xếp hạng sinh viên theo lớp
     * GET /api/lecturer/ranking/{class_id}
     */
    @GetMapping("/ranking/{class_id}")
    @Operation(summary = "Get Ranking per Class", description = "Lấy xếp hạng sinh viên theo điểm tổng")
    public ResponseEntity<?> getRanking(@PathVariable("class_id") String classId) {
        try {
            List<RankingDto> ranking = lecturerService.getRankingByClass(classId);

            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Lấy xếp hạng thành công");
            response.put("data", ranking);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PostMapping("/notifications/email")
    @Operation(summary = "Send Class Notification", description = "Gửi thông báo đến toàn bộ sinh viên (App + Email)")
    public ResponseEntity<?> sendNotification(
            @RequestBody CreateNotificationRequest request,
            Authentication authentication
    ) {
        try {
            String email = null;

            // 1. Lấy Email từ ID Token
            if (authentication.getPrincipal() instanceof Jwt jwt) {
                email = jwt.getClaimAsString("email");
            }

            if (email == null) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Token không hợp lệ (thiếu email)"));
            }

            // 2. Tìm thông tin Giảng viên từ Email (Để lấy teacherCode chuẩn: GV...)
            UserDto lecturer = userService.getMyProfile(email);

            if (lecturer == null || lecturer.getCodeUser() == null) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Không tìm thấy thông tin giảng viên"));
            }

            // 3. Gọi Service với teacherCode chuẩn
            // Sửa: Truyền lecturer.getCodeUser() thay vì gọi getTeacherCodeFromUuid(userUuid)
            lecturerService.sendClassNotification(lecturer.getCodeUser(), request);

            return ResponseEntity.ok(Collections.singletonMap("message", "Sent successfully"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace(); // In lỗi ra console để debug
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }


    @GetMapping("/assignments/get-submisstions")
    @Operation(summary = "Get All Submissions", description = "GV lấy danh sách bài nộp (Lấy Email từ header user-idToken)")
    public ResponseEntity<?> getSubmissionsForAssignment(
            @RequestHeader("Authorization") String authHeader, // Spring Security cần cái này để cho qua cửa
            @RequestHeader(value = "user-idToken", required = true) String idToken, // <--- LẤY TOKEN TỪ ĐÂY
            @RequestParam("classId") String classId,
            @RequestParam("assignmentId") String assignmentId
    ) {
        try {
            String email = getEmailFromIdToken(idToken);

            if (email == null) {
                return ResponseEntity.badRequest()
                        .body(Collections.singletonMap("error", "Token ở header user-idToken không hợp lệ hoặc thiếu email."));
            }
            UserDto lecturer = userService.getMyProfile(email);
            if (lecturer == null || lecturer.getCodeUser() == null) {
                return ResponseEntity.badRequest()
                        .body(Collections.singletonMap("error", "Không tìm thấy Code giảng viên (GV...) cho email: " + email));
            }
            List<AssignmentSubmissionResponse> submissions = lecturerService.getSubmissions(
                    lecturer.getCodeUser(),
                    classId,
                    assignmentId
            );

            // 4. TRẢ VỀ KẾT QUẢ (Format chuẩn)
            Map<String, Object> response = new HashMap<>();
            response.put("status", HttpStatus.OK.value());
            response.put("message", "Lấy danh sách bài nộp thành công");
            response.put("data", submissions);
            response.put("count", submissions.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }
    // =========================================================================
// HÀM GIẢI MÃ NHANH (Copy cái này để xuống dưới cùng Controller)
// Vì mình không dùng Authentication của Spring nên phải tự decode chuỗi String này
// =========================================================================
    private String getEmailFromIdToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;

            java.util.Base64.Decoder decoder = java.util.Base64.getUrlDecoder();
            String payload = new String(decoder.decode(parts[1]));

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> claims = mapper.readValue(payload, java.util.Map.class);

            return (String) claims.get("email");
        } catch (Exception e) {
            return null;
        }
    }


}
