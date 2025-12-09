package com.example.demo.dto.Student;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StudentSubmissionResponse {
    private String id;
    private String fileUrl;
    private String fileName;
    private String submittedAt;
    private Double score;
    private String feedback;
    private Integer status;
    private String gradedAt;
    private String createdAt;
    private String updatedAt;
}