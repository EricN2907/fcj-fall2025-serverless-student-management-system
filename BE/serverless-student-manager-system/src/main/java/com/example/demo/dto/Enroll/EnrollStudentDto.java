package com.example.demo.dto.Enroll;

import lombok.Data;

@Data
public class EnrollStudentDto {
    private String classId;    // Ví dụ: SE1701
    private String studentId;  // Ví dụ: SE182088
    private String action;     // "enroll"
}
