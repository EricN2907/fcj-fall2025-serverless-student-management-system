package com.example.demo.dto.Subjects;

import lombok.Data;

@Data
public class CreateSubjectDto {
    private String codeSubject; // Bắt buộc, Unique (VD: SWP391)
    private String name;        // Bắt buộc (VD: Software Project)
    private Integer credits;    // Bắt buộc (VD: 3)
    private String description;
    private String department;  // Khoa (VD: SE, IA, GD)
    private Integer status;     // Default 1
}
