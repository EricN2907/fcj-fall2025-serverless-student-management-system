package com.example.demo.dto.Notification;

import lombok.Data;

@Data
public class CreateNotificationRequest {
    private String classId;  // Bắt buộc
    private String title;    // Tiêu đề
    private String content;  // Nội dung
    private String type;     // Loại (class, reminder...)
}
