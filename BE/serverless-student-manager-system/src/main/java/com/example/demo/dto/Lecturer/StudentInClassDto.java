package com.example.demo.dto.Lecturer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentInClassDto {
    private String studentId;
    private String studentCode;
    private String studentName;
    private String email;
    private String joinedAt;
    private String status;           // enrolled, waitlist, dropped
    private Double totalScore;       // Tổng điểm (tính từ các bài tập)
}
