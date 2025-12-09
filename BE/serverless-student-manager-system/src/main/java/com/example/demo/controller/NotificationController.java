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
    public ResponseEntity<?> getMyNotifications(@RequestHeader("Authorization") String authHeader) {
        try {
            String accessToken = authHeader.replace("Bearer ", "");
            GetUserRequest getUserRequest = GetUserRequest.builder().accessToken(accessToken).build();
            GetUserResponse userResponse = cognitoClient.getUser(getUserRequest);
            String email = userResponse.userAttributes().stream()
                    .filter(attr -> attr.name().equals("email"))
                    .findFirst()
                    .map(AttributeType::value)
                    .orElse(null);
            if (email == null) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Invalid Token"));
            }
            UserDto myProfile = userService.getMyProfile(email);
            String myId = myProfile.getId();
            List<SchoolItem> notiItems = schoolService.getNotifications(myId);
            List<NotificationDto> dtos = notiItems.stream().map(item -> NotificationDto.builder()
                    .id(item.getSk())
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
}