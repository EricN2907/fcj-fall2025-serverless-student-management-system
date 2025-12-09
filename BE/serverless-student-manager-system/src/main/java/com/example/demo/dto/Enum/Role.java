package com.example.demo.dto.Enum;

import lombok.Getter;

import java.util.Arrays;

@Getter
public enum Role {
    // Định nghĩa các hằng số
    ADMIN(1, "Admin", "ROLE#ADMIN"),
    LECTURER(2, "Lecturer", "ROLE#LECTURER"),
    STUDENT(3, "Student", "ROLE#STUDENT");

    private final int id;
    private final String cognitoRoleName; // Tên lưu trong Cognito/DB
    private final String searchKey;       // Tên lưu trong GSI1PK để Search

    Role(int id, String cognitoRoleName, String searchKey) {
        this.id = id;
        this.cognitoRoleName = cognitoRoleName;
        this.searchKey = searchKey;
    }

    // Hàm tiện ích: Tìm Role theo ID (Dùng để convert từ request)
    public static Role fromId(Integer id) {
        return Arrays.stream(values())
                .filter(role -> role.id == id)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Role ID " + id + " không hợp lệ!"));
    }
}