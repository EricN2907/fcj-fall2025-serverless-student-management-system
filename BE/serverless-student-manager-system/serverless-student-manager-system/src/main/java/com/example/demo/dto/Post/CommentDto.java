package com.example.demo.dto.Post;

import lombok.Builder;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
public class CommentDto {
    private String id;
    private String content;
    private String parentId;
    private String postId;
    private String classId;
    private String senderId;
    private String attachmentUrl;
    private Integer likeCount;
    private String createdAt;
    private String studentName;
    private String avatar;
}
