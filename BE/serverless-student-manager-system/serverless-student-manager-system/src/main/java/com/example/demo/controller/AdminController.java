package com.example.demo.controller;

import com.example.demo.dto.Admin.RegisterUserDto;
import com.example.demo.dto.Class.ClassDto;
import com.example.demo.dto.Class.CreateClassRequest;
import com.example.demo.dto.Class.SendNotificationDto;
import com.example.demo.dto.Class.UpdateClassDto;
import com.example.demo.dto.Enroll.EnrollStudentDto;
import com.example.demo.dto.Log.LogDto;
import com.example.demo.dto.Subjects.CreateSubjectDto;
import com.example.demo.dto.Subjects.UpdateSubjectDto;
import com.example.demo.dto.Search.SubjectDto;
import com.example.demo.dto.User.UserDto;
import com.example.demo.search.SearchService;
import com.example.demo.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final SearchService searchService;

    @PostMapping("/create-users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody RegisterUserDto request) {
        try {
            // 1. Gọi Service tạo User
            String newUserId = adminService.createUser(request);

            // 2. Trả về kết quả (Dùng HashMap truyền thống)
            Map<String, Object> response = new HashMap<>();
            response.put("message", "User created. Temporary password has been sent to " + request.getEmail());
            response.put("userId", newUserId);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            // Lỗi do input (VD: Ngày sinh sai)
            // SỬA: Dùng Collections.singletonMap thay cho Map.of (Java 8 safe)
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));

        } catch (Exception e) {
            // Lỗi hệ thống
            // SỬA: Dùng Collections.singletonMap thay cho Map.of (Java 8 safe)
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @GetMapping("/subjects")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> searchSubjects(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Integer status // Đây là status để lọc (input)
    ) {
        Map<String, Object> filters = new HashMap<>();
        if (department != null && !department.isEmpty()) {
            filters.put("department", department);
        }
        if (status != null) {
            filters.put("status", status);
        }
        var results = searchService.executeSearch("subject", keyword, filters);
        Map<String, Object> responseBody = new LinkedHashMap<>();
        responseBody.put("status", HttpStatus.OK.value());
        responseBody.put("message", "Search completed successfully");
        responseBody.put("data", results);
        return ResponseEntity.ok(responseBody);
    }


    @PatchMapping("/subjects/{codeSubject}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> editSubject(
            @PathVariable String codeSubject,
            @RequestBody UpdateSubjectDto request
    ) {
        try {
            SubjectDto updatedSubject = adminService.updateSubject(codeSubject, request);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Cập nhật thành công");
            response.put("data", updatedSubject);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }
    /**
     * API: Lấy chi tiết môn học
     * URL: GET /api/admin/subjects/SWP391
     */
    @GetMapping("/subjects/{codeSubject}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getSubjectDetail(@PathVariable String codeSubject) {
        try {
            SubjectDto subject = adminService.getSubjectByCode(codeSubject);

            // Trả về thẳng Object (không cần bọc trong map "data" nếu muốn đơn giản)
            return ResponseEntity.ok(subject);

        } catch (IllegalArgumentException e) {
            // Trả về 404 Not Found nếu không thấy môn
            return ResponseEntity.status(404).body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }
    /**
     * API: Xóa mềm môn học (Chuyển status -> 0)
     * URL: PATCH /api/admin/subjects/{codeSubject}/delete
     */
    @PatchMapping("/subjects/{codeSubject}/delete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteSubject(@PathVariable String codeSubject) {
        try {
            adminService.softDeleteSubject(codeSubject);

            // Trả về JSON message như yêu cầu
            return ResponseEntity.ok(Collections.singletonMap("message", "Deleted"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }
    @PatchMapping("/subjects/ban/{codeSubject}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> banSubject(@PathVariable String codeSubject) {
        try {
            adminService.softDeleteSubject(codeSubject);
            return ResponseEntity.ok(Collections.singletonMap("message", "Deleted"));
        } catch (IllegalArgumentException e) {
            // Lỗi 400: Nếu không tìm thấy môn học
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            // Lỗi 500: Lỗi hệ thống khác
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }
    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            @RequestParam(value = "role_id", required = false) Integer roleId,
            @RequestParam(value = "keyword", required = false) String keyword
    ) {
        // 1. Gọi Service đã viết sẵn logic Query/Scan
        List<UserDto> users = adminService.searchUsers(roleId, keyword);

        // 2. Tạo response có cấu trúc (Status + Data)
        Map<String, Object> response = new LinkedHashMap<>();

        // Thêm status code (200)
        response.put("status", HttpStatus.OK.value());

        // Thêm message (tùy chọn)
        response.put("message", "Get users successfully");

        // Đưa danh sách user vào key "data" (trước đây bạn để là "results", mình đổi thành "data" cho đồng bộ, bạn có thể sửa lại nếu thích)
        response.put("data", users);

        return ResponseEntity.ok(response);
    }


    @GetMapping("/classes")
    public ResponseEntity<?> getClasses(
            @RequestParam(name = "subject_id", required = false) String subjectId,
            @RequestParam(name = "teacher_id", required = false) String teacherId,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "status", required = false) Integer status
    ) {
        // Gọi Service
        List<ClassDto> classes = adminService.searchClasses(subjectId, teacherId, keyword, status);

        // Trả về JSON chuẩn: { "results": [...] }
        return ResponseEntity.ok(Collections.singletonMap("results", classes));
    }

    @PostMapping("/notifications")
    public ResponseEntity<?> sendNotification(@RequestBody SendNotificationDto request, Authentication authentication) {
        String currentAdminId = authentication.getName();
        adminService.sendManualNotification(currentAdminId, request);

        // 3. Trả về kết quả
        return ResponseEntity.ok(Collections.singletonMap("message", "Đã gửi thông báo thành công!"));
    }
    // Tạo môn học
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/subjects")
    public ResponseEntity<?> createSubject(@RequestBody CreateSubjectDto request) {
        try {
            SubjectDto newSubject = adminService.createSubject(request);
            return ResponseEntity.ok(Collections.singletonMap("result", newSubject));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/classes/update/{id}")
    public ResponseEntity<?> updateClass(
            @PathVariable("id") String classId,
            @RequestBody UpdateClassDto request
    ) {
        // Gọi Service xử lý logic update + notification
        ClassDto updatedClass = adminService.updateClass(classId, request);

        // Trả về thông tin lớp sau khi sửa
        return ResponseEntity.ok(updatedClass);
    }
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/classes/deactivate/{id}")
    public ResponseEntity<?> deactivateClass(@PathVariable("id") String classId) {
        adminService.deactivateClass(classId);
        return ResponseEntity.ok(Collections.singletonMap("message", "Deleted"));
    }
//Ban user
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/users/deactivate/{id}")
    public ResponseEntity<?> deactivateUser(@PathVariable("id") String userId) {
        adminService.deactivateUser(userId);
        return ResponseEntity.ok(Collections.singletonMap("message", "Deleted"));
    }
    //Update Status User
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/users/update-status/{id}")
    public ResponseEntity<?> updateStatusUser(
            @PathVariable("id") String userId,
            @RequestParam(name = "status", defaultValue = "0") int status) { // Mặc định là 0 (Khóa) nếu ko truyền

        // Gọi hàm bên Service (nhớ đổi tên hàm trong interface AdminService cho khớp nhé)
        adminService.updateStatusId(userId, status);

        // Trả về thông báo dynamic
        String message = (status == 1) ? "User Activated successfully" : "User Deactivated successfully";
        return ResponseEntity.ok(Collections.singletonMap("message", message));
    }
    // ========================================================================
    // 5. AUDIT LOGS (XEM LỊCH SỬ HOẠT ĐỘNG)
    // ========================================================================
    // GET /api/admin/audit-logs
    // Params: user_id, class_id, timestamp (YYYY-MM-DD)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(
            @RequestParam(name = "user_id", required = false) String userId,
            @RequestParam(name = "class_id", required = false) String classId,
            @RequestParam(name = "timestamp", required = false) String timestamp
    ) {
        List<LogDto> logs = adminService.getAuditLogs(userId, classId, timestamp);

        // Trả về: { "results": [ ...danh sách log... ] }
        return ResponseEntity.ok(Collections.singletonMap("results", logs));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/enrollments")
    public ResponseEntity<?> enrollStudent(@RequestBody EnrollStudentDto request) {
        // Validate Action
        if (!"enroll".equalsIgnoreCase(request.getAction())) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Action không hợp lệ. Phải là 'enroll'"));
        }

        try {
            adminService.enrollStudent(request);
            return ResponseEntity.ok(Collections.singletonMap("message", "Enrolled Successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/createClass")
    public ResponseEntity<?> createNewClass(@RequestBody CreateClassRequest request) {

        if (request.getName() == null || request.getName().isEmpty()) {
            Map<String, Object> errorResponse = new LinkedHashMap<>();
            errorResponse.put("status", 400);
            errorResponse.put("message", "Tên lớp không được để trống");
            return ResponseEntity.badRequest().body(errorResponse);
        }
        adminService.createClass(request);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", HttpStatus.OK.value());
        response.put("message", "Tạo lớp học thành công");

        return ResponseEntity.ok(response);
    }
}


