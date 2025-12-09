package com.example.demo.dto.Class;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationDto {
    private String id;          // SK: NOTI#2024...
    private String title;
    private String content;
    private String type;        // CLASS_ASSIGNMENT, SYSTEM...
    private Boolean isRead;
    private String createdAt;
    private String classId;
    private String sentBy;
    private String sentAt;
}
