package com.example.demo.dto.Student;

import lombok.Data;

@Data
public class EnrollRequest {
    private String classId;
    private String password;
    private String action; // enroll | unenroll
}
