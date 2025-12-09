package com.example.demo.dto.User;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class UpdateProfileRequest {
    private String name;
    private String dateOfBirth;
    private String avatarUrl;
}
