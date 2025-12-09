package com.example.demo.controller;

import com.example.demo.dto.Auth.AuthResponse;
import com.example.demo.dto.Auth.LoginDto;
import com.example.demo.dto.Password.ChangePasswordDto;
import com.example.demo.dto.Password.ConfirmForgotPasswordDto;
import com.example.demo.dto.Password.ForgotPasswordDto;
import com.example.demo.dto.Password.NewPasswordRequest;
import com.example.demo.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authen")
@CrossOrigin(origins = "*") // Cho phép Frontend (React/Vue...) gọi API thoải mái
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/loginV2")
    @Operation(summary = "Đăng nhập hệ thống", description = "Nhập email và password để lấy JWT Token (Access, ID, Refresh Token)")
    public ResponseEntity<?> loginTakeToken(@RequestBody LoginDto login) {
        String email = login.getEmail();
        String password = login.getPassword();
        Map<String, String> result = authService.login(email, password);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginDto request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/complete-password")
    public ResponseEntity<AuthResponse> completePassword(@RequestBody NewPasswordRequest request) {
        AuthResponse response = authService.respondToNewPasswordChallenge(
                request.getSession(),
                request.getEmail(),
                request.getNewPassword()
        );
        return ResponseEntity.ok(response);
    }
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Token invalid"));
        }
        String accessToken = authHeader.substring(7);
        authService.logout(accessToken);
        return ResponseEntity.ok(Collections.singletonMap("message", "Logged out successfully"));
    }


    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestBody ChangePasswordDto request
    ) {
        String accessToken = authHeader.substring(7);

        try {
            authService.changePassword(accessToken, request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok(Collections.singletonMap("message", "Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordDto request) {
        try {
            authService.forgotPassword(request.getEmail());
            return ResponseEntity.ok(Collections.singletonMap("message", "Reset code sent to your email"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PostMapping("/confirm-forgot-password")
    public ResponseEntity<?> confirmForgotPassword(@RequestBody ConfirmForgotPasswordDto request) {
        try {
            authService.confirmForgotPassword(request.getEmail(), request.getConfirmationCode(), request.getNewPassword());
            return ResponseEntity.ok(Collections.singletonMap("message", "Password reset successfully. Please login again."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

   // ========================================================================
   // 3. API ĐĂNG XUẤT (LOGOUT)
   // ========================================================================
   @PostMapping("/logout")
   @Operation(summary = "Đăng xuất khỏi hệ thống",
           description = "Invalidate tất cả tokens của user và đăng xuất khỏi AWS Cognito. Sau khi logout, access token sẽ không còn sử dụng được.")
   public ResponseEntity<?> logout(@RequestBody LogoutDto request) {
       // Lấy access token từ body request
       String accessToken = request.getAccessToken();

       // Gọi Service xử lý logout
       authService.logout(accessToken);

       return ResponseEntity.ok(Map.of(
               "message", "Đăng xuất thành công!",
               "status", "SUCCESS"
       ));
   }

   // ========================================================================
   // 4. API LÀM MỚI TOKEN (REFRESH TOKEN)
   // ========================================================================
   @PostMapping("/refresh-token")
   @Operation(summary = "Làm mới Access Token",
           description = "Sử dụng Refresh Token để lấy Access Token và ID Token mới mà không cần đăng nhập lại. Access Token thường hết hạn sau 1 giờ.")
   public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenDto request) {
       // Lấy refresh token từ body request
       String refreshToken = request.getRefreshToken();

       // Gọi Service xử lý refresh token
       Map<String, String> result = authService.refreshToken(refreshToken);

       return ResponseEntity.ok(result);
   }

    // 1. API Đăng nhập
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginDto request) {
        // Gọi hàm login bạn vừa viết
        return ResponseEntity.ok(authService.login(request));
    }

    // 2. API Đổi mật khẩu lần đầu (Challenge Response)
    // URL: POST /api/auth/complete-password
    @PostMapping("/complete-password")
    public ResponseEntity<AuthResponse> completePassword(@RequestBody NewPasswordRequest request) {
        // Gọi hàm respondToNewPasswordChallenge bạn vừa viết
        AuthResponse response = authService.respondToNewPasswordChallenge(
                request.getSession(),
                request.getEmail(),
                request.getNewPassword()
        );
        return ResponseEntity.ok(response);
    }
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Token invalid"));
        }

        // Lấy chuỗi token (bỏ chữ "Bearer ")
        String accessToken = authHeader.substring(7);

        authService.logout(accessToken);
        return ResponseEntity.ok(Collections.singletonMap("message", "Logged out successfully"));
    }

    // -----------------------------------------------------------
    // 2. CHANGE PASSWORD
    // URL: POST /api/auth/change-password
    // Yêu cầu: Header "Authorization: Bearer <token>" + Body JSON
    // -----------------------------------------------------------
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader,
            @RequestBody ChangePasswordDto request
    ) {
        String accessToken = authHeader.substring(7);

        try {
            authService.changePassword(accessToken, request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok(Collections.singletonMap("message", "Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    // -----------------------------------------------------------
    // 3.1 FORGOT PASSWORD (BƯỚC 1: Gửi Mail)
    // URL: POST /api/auth/forgot-password
    // Yêu cầu: Public (Không cần Token)
    // -----------------------------------------------------------
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordDto request) {
        try {
            authService.forgotPassword(request.getEmail());
            return ResponseEntity.ok(Collections.singletonMap("message", "Reset code sent to your email"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    // -----------------------------------------------------------
    // 3.2 CONFIRM FORGOT PASSWORD (BƯỚC 2: Đổi Pass)
    // URL: POST /api/auth/confirm-forgot-password
    // Yêu cầu: Public (Không cần Token)
    // -----------------------------------------------------------
    @PostMapping("/confirm-forgot-password")
    public ResponseEntity<?> confirmForgotPassword(@RequestBody ConfirmForgotPasswordDto request) {
        try {
            authService.confirmForgotPassword(request.getEmail(), request.getConfirmationCode(), request.getNewPassword());
            return ResponseEntity.ok(Collections.singletonMap("message", "Password reset successfully. Please login again."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }
}