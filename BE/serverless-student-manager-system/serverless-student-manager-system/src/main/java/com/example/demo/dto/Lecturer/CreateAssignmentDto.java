package com.example.demo.dto.Lecturer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAssignmentDto {
    private String classId;
    private String title;
    private String description;
    private String type;           // homework, project, midterm, final
    private Double maxScore;
    private Double weight;         // 0.1, 0.2, 0.4
    private String deadline;       // ISO 8601 format: 2024-12-25T23:59:59Z
    private Boolean isPublished;
}
