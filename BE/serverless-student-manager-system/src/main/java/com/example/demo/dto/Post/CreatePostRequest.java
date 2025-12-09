package com.example.demo.dto.Post;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class CreatePostRequest {
    private String title;
    private String content;
    private String attachmentUrl;
    private String classId;
    private Boolean pinned;
}
