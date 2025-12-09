package com.example.demo.dto.Grade;

import lombok.Data;

@Data
public class GradeSubmissionDto {
    private String assignmentId; // Required: để check khớp với Path
    private String studentId;    // Required
    private Double score;        // Required (0-10)
    private String feedback;     // Optional
}