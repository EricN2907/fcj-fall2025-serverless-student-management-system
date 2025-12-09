package com.example.demo.dto.Lecturer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentDto {
    private String id;
    private String classId;
    private String title;
    private String description;
    private String type;
    private Double maxScore;
    private Double weight;
    private String deadline;
    private Boolean isPublished;
    private String createdAt;
    private String updatedAt;
}
