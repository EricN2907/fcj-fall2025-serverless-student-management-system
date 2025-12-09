package com.example.demo.dto.Search;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SearchResultDto {
    private String id;          // VD: USER#123 hoặc CLASS#456
    private String title;       // Tên sinh viên hoặc Tên lớp
    private String subtitle;    // Email (nếu là user) hoặc Mã môn (nếu là class)
    private String type;        // 'student', 'lecturer', 'class'
    private String avatar;      // Url ảnh (nếu có)
    private String extraInfo;   // VD: Semester, Role...
    private String createdAt;
    private Integer status;
}