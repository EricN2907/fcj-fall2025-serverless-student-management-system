package com.example.demo.dto.Lecturer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RankingDto {
    private Integer rank;
    private String studentId;
    private String studentCode;
    private String studentName;
    private Double totalScore;
}
