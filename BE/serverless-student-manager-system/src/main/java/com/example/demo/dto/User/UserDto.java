package com.example.demo.dto.User;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDto {
    private String id;            // ID trong DB
    private String name;
    private String email;
    private String dateOfBirth;   // dd-MM-yyyy hoặc yyyy-MM-dd
    private String role;          // admin, student...
    private String codeUser;      // SV01, GV01
    private String avatar;        // Link ảnh (S3 hoặc link ngoài)
    private Integer status;
}
