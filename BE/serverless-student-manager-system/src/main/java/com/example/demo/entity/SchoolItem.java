package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@DynamoDbBean
public class SchoolItem {

    // ========================================================================
    // 1. CÁC KHÓA (KEYS)
    // ========================================================================
    private String pk;
    private String sk;
    private String gsi1Pk;
    private String gsi1Sk;

    // ========================================================================
    // 2. THÔNG TIN CHUNG (COMMON FIELDS)
    // ========================================================================
    private String id;
    private String name;
    private String description;
    private Integer status;
    private String createdAt;
    private String updatedAt;

    // ========================================================================
    // 3. THÔNG TIN NGƯỜI DÙNG (USER PROFILE)
    // ========================================================================
    private String email;
    private String roleName;    // DB: role_name
    private String codeUser;    // DB: codeUser
    private String avatar;
    private String dateOfBirth; // DB: date_of_birth

    // ========================================================================
    // 4. THÔNG TIN LỚP HỌC & MÔN HỌC (CLASS & SUBJECT)
    // ========================================================================
    private String codeSubject;
    private Integer credits;
    private String department;

    private String semester;
    private String academicYear;
    private String room;
    private String subjectId;   // DB: subject_id
    private String teacherId;   // DB: teacher_id

    private String password;    // Passcode vào lớp
    private Integer studentCount;
    private String studentName; // Rất quan trọng để hiển thị danh sách lớp
    private String teacherName; // Hiển thị tên GV cho lớp học
    private String studentId;
        // Danh sách mã môn học tiên quyết, phân cách bằng dấu phẩy
        private String prerequisites;

        @DynamoDbAttribute("prerequisites")
        public String getPrerequisites() {
            return prerequisites;
        }

        public void setPrerequisites(String prerequisites) {
            this.prerequisites = prerequisites;
        }

    // ========================================================================
    // 5. ENROLLMENT (GHI DANH)
    // ========================================================================
    private String joinedAt;    // DB: joined_at

    // ========================================================================
    // 6. ASSIGNMENTS & NOTIFICATIONS (BÀI TẬP & THÔNG BÁO)
    // ========================================================================
    private String title;
    private String content;
    private String type;

    private Double weight;
    private Double maxScore;
    private String deadline;
    private Boolean isPublished;

    // ========================================================================
    // 7. SUBMISSIONS & FILE MATERIAL
    // ========================================================================
    private String fileUrl;
    private String fileName;
    private String fileType;
    private String uploadedBy;
    private String submittedAt;
    private Double score;
    private String feedback;
    private Boolean isRead;
    private String gradedAt;
    // ========================================================================
    // 8a. POSTS & COMMENTS
    // ========================================================================
    private String postId;      // ID bài post hoặc post cha cho comment
    private String parentId;    // ID comment cha (nested)
    private String senderId;    // Người gửi comment/post
    private Boolean isPinned;   // Pin bài post
    private Integer likeCount;  // Đếm like/reactions
    private Integer commentCount; // Đếm comment trên post

    // ========================================================================
    // 8. MAPPING VỚI DYNAMODB
    // ========================================================================

    // ========================================================================
    // [MỚI] 9. AUDIT LOGS (LỊCH SỬ HOẠT ĐỘNG)
    // ========================================================================
    private String actionType;  // Loại hành động
    private String logDetails;  // Chi tiết
    private String targetClassId; // ID lớp học bị tác động
    private String actorId;     // ID người thực hiện
    // --- KEYS ---
    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1Pk() { return gsi1Pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1Sk() { return gsi1Sk; }

    // --- MAPPING SNAKE_CASE ---

    @DynamoDbAttribute("role_name")
    @JsonProperty("role")
    public String getRoleName() { return roleName; }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }
    @DynamoDbAttribute("created_at")
    public String getCreatedAt() { return createdAt; }

    @DynamoDbAttribute("updated_at")
    public String getUpdatedAt() { return updatedAt; }

    @DynamoDbAttribute("date_of_birth")
    public String getDateOfBirth() { return dateOfBirth; }

    @DynamoDbAttribute("subject_id")
    public String getSubjectId() { return subjectId; }

    @DynamoDbAttribute("teacher_id")
    public String getTeacherId() { return teacherId; }

    @DynamoDbAttribute("joined_at")
    public String getJoinedAt() { return joinedAt; }

    @DynamoDbAttribute("max_score")
    public Double getMaxScore() { return maxScore; }

    @DynamoDbAttribute("is_published")
    public Boolean getIsPublished() { return isPublished; }

    @DynamoDbAttribute("file_url")
    public String getFileUrl() { return fileUrl; }

    @DynamoDbAttribute("file_name")
    public String getFileName() { return fileName; }

    @DynamoDbAttribute("file_type")
    public String getFileType() { return fileType; }

    @DynamoDbAttribute("uploaded_by")
    public String getUploadedBy() { return uploadedBy; }

    @DynamoDbAttribute("submitted_at")
    public String getSubmittedAt() { return submittedAt; }

    @DynamoDbAttribute("is_read")
    public Boolean getIsRead() { return isRead; }

    public String getTitle() {
        return title;
    }

    public void setIsRead(Boolean isRead) { this.isRead = isRead; }
    @DynamoDbAttribute("action_type")
    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    @DynamoDbAttribute("log_details")
    public String getLogDetails() { return logDetails; }
    public void setLogDetails(String logDetails) { this.logDetails = logDetails; }

    @DynamoDbAttribute("target_class_id")
    public String getTargetClassId() { return targetClassId; }
    public void setTargetClassId(String targetClassId) { this.targetClassId = targetClassId; }

    @DynamoDbAttribute("actor_id")
    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }

    private String classId;
    private String sentBy;
    private String sentAt;

    // Mapping cho class_id
    @DynamoDbAttribute("class_id")
    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    // Mapping cho sent_by
    @DynamoDbAttribute("sent_by")
    public String getSentBy() { return sentBy; }
    public void setSentBy(String sentBy) { this.sentBy = sentBy; }

    // Mapping cho sent_at
    // Lưu ý: Nếu logic của bạn "createdAt" chính là "sent_at" thì dùng chung cũng được.
    // Còn nếu DB có cột riêng tên là "sent_at" thì thêm dòng này:

    @DynamoDbAttribute("sent_at")
    public String getSentAt() { return sentAt; }
    public void setSentAt(String sentAt) { this.sentAt = sentAt; }

    @DynamoDbAttribute("student_id")
    public String getStudentId() { return studentId; }

    public void setStudentId(String studentId) { this.studentId = studentId; }
}