package com.example.demo.dto.Auth;

import lombok.Data;

@Data
public class RegisterDto {
    private String email;
    private String name;
    private String role;
    private String password;
}
