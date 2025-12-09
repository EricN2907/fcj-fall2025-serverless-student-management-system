package com.example.demo.dto.Class;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class CreateClassRequest {
    @JsonProperty("subject_id")
    private String subjectId;

    private String name;       // Tên lớp (Required)
    private String password;   // Passcode
    private String semester;

    @JsonProperty("academic_year")
    private String academicYear;

    private String description;
    private String teacherId;  // ID giảng viên
    private Integer status;    // 1: Active, 0: Inactive
}
