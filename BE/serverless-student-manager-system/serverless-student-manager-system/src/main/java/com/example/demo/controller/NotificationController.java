package com.example.demo.controller;

import com.example.demo.dto.Class.NotificationDto;
import com.example.demo.dto.User.UserDto;
import com.example.demo.entity.SchoolItem;
import com.example.demo.service.SchoolService;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.GetUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.GetUserResponse;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final SchoolService schoolService;
    private final UserService userService;
    private final CognitoIdentityProviderClient cognitoClient;

    @GetMapping
    public ResponseEntity<?> getMyNotifications(
            @RequestHeader("Authorization") String authHeader, // Spring Security check quyền
            @RequestHeader(value = "user-idToken", required = true) String idToken // <--- Lấy Email nhanh từ đây
    ) {
        try {
            // 1. Giải mã Email từ ID Token (Nhanh, không cần gọi AWS)
            String email = getEmailFromIdToken(idToken);
            if (email == null) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Token không hợp lệ"));
            }

            // 2. Lấy Profile (để lấy ID thật: SE123/GV456)
            UserDto myProfile = userService.getMyProfile(email);
            if (myProfile == null) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "User not found"));
            }

            // Lấy ID: ví dụ SE1701
            String myId = myProfile.getId();

            // 3. Gọi Service
            List<SchoolItem> notiItems = schoolService.getNotifications(myId);

            // 4. Convert sang DTO
            List<NotificationDto> dtos = notiItems.stream().map(item -> NotificationDto.builder()
                    .id(item.getSk()) // NOTI#1723...
                    .title(item.getTitle())
                    .content(item.getContent())
                    .type(item.getType())
                    .isRead(item.getIsRead())
                    .createdAt(item.getCreatedAt())
                    .classId(item.getClassId())
                    .sentBy(item.getSentBy())
                    .sentAt(item.getSentAt())
                    .build()
            ).collect(Collectors.toList());

            return ResponseEntity.ok(Collections.singletonMap("results", dtos));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    // Hàm Helper giải mã token (Copy để dưới cùng Controller)
    private String getEmailFromIdToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;
            java.util.Base64.Decoder decoder = java.util.Base64.getUrlDecoder();
            String payload = new String(decoder.decode(parts[1]));
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> claims = mapper.readValue(payload, java.util.Map.class);
            return (String) claims.get("email");
        } catch (Exception e) {
            return null;
        }
    }
}