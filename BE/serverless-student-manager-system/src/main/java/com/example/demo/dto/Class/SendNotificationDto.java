package com.example.demo.dto.Class;


import lombok.Data;

@Data
public class SendNotificationDto {
    private String userId;  // ID người nhận (VD: GV01, SE182088)
    private String title;   // Tiêu đề thông báo
    private String content; // Nội dung thông báo
    private String type;
    private String ClassId;
}
