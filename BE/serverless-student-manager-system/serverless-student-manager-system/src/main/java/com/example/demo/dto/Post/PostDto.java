package com.example.demo.dto.Post;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostDto {
    private String id;
    private String classId;
    private String lecturerId;
    private String title;
    private String content;
    private String attachmentUrl;
    private Boolean isPinned;
    private Integer likeCount;
    private Integer commentCount;
    private String createdAt;
}
