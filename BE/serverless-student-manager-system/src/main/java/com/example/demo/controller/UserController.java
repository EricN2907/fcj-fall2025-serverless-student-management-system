package com.example.demo.controller;

import com.example.demo.dto.User.UpdateProfileRequest;
import com.example.demo.dto.User.UserDto;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.GetUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.GetUserResponse;

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

    @PatchMapping(value = "/profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateProfileRequest request
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

    private String getEmailFromToken(String authHeader) {
        String accessToken = authHeader.replace("Bearer ", "");

        GetUserRequest getUserRequest = GetUserRequest.builder()
                .accessToken(accessToken)
                .build();

        var userResponse = cognitoClient.getUser(getUserRequest);

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