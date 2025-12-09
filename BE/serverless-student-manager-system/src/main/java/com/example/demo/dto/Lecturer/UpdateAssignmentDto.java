package com.example.demo.dto.Lecturer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAssignmentDto {
    private String title;
    private String description;
    private String type;
    private Double maxScore;
    private Double weight;
    private String deadline;
    private Boolean isPublished;
}
