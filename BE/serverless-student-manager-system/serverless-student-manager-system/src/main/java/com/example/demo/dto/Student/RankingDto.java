package com.example.demo.dto.Student;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RankingDto {
    private String studentId;
    private int rank;
    private double score;
    private String recommendations;
}
