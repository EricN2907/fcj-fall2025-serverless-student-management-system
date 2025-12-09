package com.example.demo.dto.Password;

import lombok.Data;

@Data
public class NewPasswordRequest {
    private String session;      // Chuỗi phiên làm việc nhận được khi login lần đầu
    private String email;        // Email của user
    private String newPassword;  // Mật khẩu mới người dùng muốn đặt
}