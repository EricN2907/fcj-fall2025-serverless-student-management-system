package com.example.demo.dto.Password;

import lombok.Data;

@Data
public class ConfirmForgotPasswordDto {
    private String email;
    private String confirmationCode; // Mã code gửi về mail
    private String newPassword;
}