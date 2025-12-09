package com.example.demo.dto.Log;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LogDto {
    private String id;          // Log ID (UUID)
    private String userId;      // Người thực hiện (VD: USER#GV01)
    private String classId;     // Lớp bị tác động (Optional)
    private String actionType;  // VD: "DEACTIVATE_USER", "UPDATE_CLASS"
    private String details;     // JSON chi tiết thay đổi
    private String timestamp;   // Thời gian thực hiện
}