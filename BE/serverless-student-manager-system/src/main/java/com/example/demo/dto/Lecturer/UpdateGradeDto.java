package com.example.demo.dto.Lecturer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGradeDto {
    private String studentId;
    private Double score;          // Điểm từ 0 - maxScore của Assignment
}
