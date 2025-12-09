package com.example.demo.dto.Student;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StudentAssignmentResponse {
    // --- Assignment Info ---
    private String id;
    private String title;
    private String description;
    private String type;         // homework, project...
    private Double weight;       // Trọng số
    private String deadline;
    private Double maxScore;
    private Boolean isPublished;
    private String createdAt;
    private String updatedAt;

    // --- Assignment Materials (File đính kèm của GV) ---
    private String fileUrl;
    private String fileName;
    private String fileType;     // Có thể lấy từ đuôi file
    private String uploadedBy;
    private String uploadedAt;
}