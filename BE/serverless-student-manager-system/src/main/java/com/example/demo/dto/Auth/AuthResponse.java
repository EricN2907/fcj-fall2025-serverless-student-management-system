package com.example.demo.dto.Auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    // 3 cái này có khi đăng nhập thành công
    private String accessToken;
    private String idToken;
    private String refreshToken;

    // 2 cái này dùng để báo hiệu trạng thái cho Frontend
    private String message; // Ví dụ: "LOGIN_SUCCESS" hoặc "FORCE_CHANGE_PASSWORD"
    private String session; // <--- QUAN TRỌNG: Chuỗi này dùng để xác nhận đổi pass
}