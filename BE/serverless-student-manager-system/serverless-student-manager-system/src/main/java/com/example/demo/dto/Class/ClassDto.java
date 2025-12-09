package com.example.demo.dto.Class;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassDto {
    private String id;
    private String name;
    private String subjectId;
    private String teacherId;
    private String subjectName;
    private String lecturerName;
    private String room;
    private String semester;
    private String academicYear;
    private Integer studentCount;
    private Integer status;
    private String description;
    private String password;
}
