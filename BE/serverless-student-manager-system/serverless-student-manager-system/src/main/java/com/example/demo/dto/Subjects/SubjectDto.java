package com.example.demo.dto.Subjects;


import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubjectDto {
    private String id;          // PK (VD: SUBJECT#SWP391)
    private String codeSubject; // SWP391
    private String name;        // Software Project
    private Integer credits;    // 3
    private String department;  // SE
    private Integer status;     // 1: Active, 0: Inactive
    private String description;
}