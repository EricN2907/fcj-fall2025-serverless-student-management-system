package com.example.demo.dto.Post;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class CreateCommentRequest {
    private String content;
    private String parentId;
    private String attachmentUrl;
    private String postId;
}
