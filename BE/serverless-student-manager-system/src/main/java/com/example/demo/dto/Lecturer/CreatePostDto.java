package com.example.demo.dto.Lecturer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data

public class CreatePostDto {
    private String title;
    private String content;        // Nội dung bài viết
    private String classId;        // (Nếu là POST từ class)
    private MultipartFile file;
}
