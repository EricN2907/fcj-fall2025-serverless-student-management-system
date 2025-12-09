package com.example.demo.controller;

import com.example.demo.dto.User.UpdateProfileRequest;
import com.example.demo.dto.User.UserDto;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.GetUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.GetUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final CognitoIdentityProviderClient cognitoClient;

    @GetMapping("/profile")
    public ResponseEntity<?> getMyProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            String accessToken = authHeader.replace("Bearer ", "");
            GetUserRequest getUserRequest = GetUserRequest.builder()
                    .accessToken(accessToken)
                    .build();
            GetUserResponse userResponse = cognitoClient.getUser(getUserRequest);
            String email = userResponse.userAttributes().stream()
                    .filter(attr -> attr.name().equals("email"))
                    .findFirst()
                    .map(AttributeType::value)
                    .orElse(null);
            if (email == null) {
                // Dùng Collections.singletonMap thay cho Map.of (Java 8 safe)
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Không tìm thấy email trong tài khoản Cognito này."));
            }
            UserDto userProfile = userService.getMyProfile(email);
            return ResponseEntity.ok(Collections.singletonMap("data", userProfile));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Collections.singletonMap("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    @PatchMapping(value = "/profile") // Bỏ consumes Multipart
    public ResponseEntity<?> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateProfileRequest request // <-- Dùng @RequestBody (JSON)
    ) {
        try {
            String email = getEmailFromToken(authHeader);

            UserDto updatedUser = userService.updateProfile(email, request);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Updated successfully");
            response.put("updatedUser", updatedUser);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    // =========================================================
    // HÀM PHỤ TRỢ (HELPER METHOD) - TÁI SỬ DỤNG LOGIC
    // =========================================================
    private String getEmailFromToken(String authHeader) {
        // 1. Lấy token raw
        String accessToken = authHeader.replace("Bearer ", "");

        // 2. Hỏi Cognito
        GetUserRequest getUserRequest = GetUserRequest.builder()
                .accessToken(accessToken)
                .build();

        var userResponse = cognitoClient.getUser(getUserRequest);

        // 3. Lọc lấy email
        String email = userResponse.userAttributes().stream()
                .filter(attr -> attr.name().equals("email"))
                .findFirst()
                .map(AttributeType::value)
                .orElse(null);

        if (email == null) {
            throw new IllegalArgumentException("Không tìm thấy email trong Token (Cognito).");
        }
        return email;
    }
}