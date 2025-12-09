package com.example.demo.dto.Lecturer;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AssignmentSubmissionResponse {
    private String id;
    private String studentId;
    private String studentName;
    private String fileUrl;
    private String fileName;
    private String submittedAt;
    private Double score;
    private String feedback;
    private Integer status;
    private String gradedAt;
    private String createdAt;
    private String updatedAt;
    private String type;
}