package com.example.demo.dto.Subjects;

import lombok.Data;

@Data
public class UpdateSubjectDto {
        private String name ;
        private Integer credits;
        private String description;
        private String department;
        private Integer status;
}
