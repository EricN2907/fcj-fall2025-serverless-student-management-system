package com.example.demo.dto.Class;

import lombok.Data;

@Data
public class UpdateClassDto {
    private String name;            // Tên lớp (SE1701 - SWP391)
    private String password;        // Passcode vào lớp
    private String semester;        // SPRING2024
    private String academicYear;    // 2024-2025
    private String description;     // Mô tả
    private String teacherId;       // ID Giảng viên mới (VD: GV02)
    private Integer status;         // 1=Active, 0=Inactive
}