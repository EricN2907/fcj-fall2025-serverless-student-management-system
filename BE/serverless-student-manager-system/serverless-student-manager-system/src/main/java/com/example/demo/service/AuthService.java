package com.example.demo.service;

import com.example.demo.dto.Auth.AuthResponse;
import com.example.demo.dto.Auth.LoginDto;
import com.example.demo.entity.SchoolItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final CognitoIdentityProviderClient cognitoClient;
    private final SchoolService schoolService; // Cần service này để lưu User vào DynamoDB


    @Value("${aws.clientId}")
    private String clientId;

    @Value("${aws.cognito.user-pool-id}")
    private String userPoolId;

    public AuthService(CognitoIdentityProviderClient cognitoClient, SchoolService schoolService) {
        this.cognitoClient = cognitoClient;
        this.schoolService = schoolService;
    }


    // ========================================================================
    // 1. CHỨC NĂNG ĐĂNG NHẬP (LOGIN)
    // ========================================================================
    public Map<String, String> login(String email, String password) {
        Map<String, String> authParams = new HashMap<>();
        authParams.put("USERNAME", email);
        authParams.put("PASSWORD", password);

        try {
            // Gọi sang AWS Cognito để kiểm tra password
            InitiateAuthRequest request = InitiateAuthRequest.builder()
                    .authFlow(AuthFlowType.USER_PASSWORD_AUTH) // Flow dành cho Username/Password
                    .clientId(clientId)
                    .authParameters(authParams)
                    .build();

            InitiateAuthResponse response = cognitoClient.initiateAuth(request);
            AuthenticationResultType resultType = response.authenticationResult();

            Map<String, String> result = new HashMap<>();

            if (resultType != null) {
                result.put("accessToken", resultType.accessToken());
                result.put("idToken", resultType.idToken());
                result.put("refreshToken", resultType.refreshToken());
                result.put("status", "SUCCESS");
                result.put("message", "Đăng nhập thành công!");
            } else {
                // Trường hợp bị bắt đổi mật khẩu lần đầu hoặc MFA
                result.put("status", "CHALLENGE_REQUIRED");
                result.put("challengeName", response.challengeNameAsString());
                result.put("session", response.session());
                result.put("message", "Cần thực hiện bước tiếp theo: " + response.challengeNameAsString());
            }
            return result;

        } catch (CognitoIdentityProviderException e) {
            // Bắt lỗi sai pass, user không tồn tại...
            throw new RuntimeException("Lỗi đăng nhập: " + e.awsErrorDetails().errorMessage());
        }
    }

    // ========================================================================
    // 2. CHỨC NĂNG TẠO USER (CHỈ ADMIN DÙNG)
    // ========================================================================
    public String adminCreateUser(String email, String name, String role, String tempPassword) {
        try {
            // BƯỚC 1: Tạo tài khoản bên Cognito (Kho chứa password)
            AdminCreateUserRequest request = AdminCreateUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(email)
                    .temporaryPassword(tempPassword) // Mật khẩu tạm
                    .userAttributes(
                            AttributeType.builder().name("email").value(email).build(),
                            AttributeType.builder().name("name").value(name).build(),
                            AttributeType.builder().name("email_verified").value("true").build(),
                            AttributeType.builder().name("custom:role").value(role).build()
                    )
                    .messageAction(MessageActionType.SUPPRESS) // Không gửi mail mặc định của AWS
                    .build();

            AdminCreateUserResponse response = cognitoClient.adminCreateUser(request);

            // Lấy ID duy nhất (sub) mà Cognito vừa tạo cho user này
            String cognitoSub = response.user().username();

            // BƯỚC 2: Tạo Profile chi tiết để lưu vào DynamoDB
            SchoolItem newUser = new SchoolItem();
            // Mapping Key theo quy tắc Single Table: PK = USER#<CognitoID>
            newUser.setPk("USER#" + cognitoSub);
            newUser.setSk("PROFILE");

            // Các thông tin khác
            newUser.setEmail(email);
            newUser.setName(name);
            newUser.setRoleName(role); // student hoặc lecturer
            newUser.setStatus(1); // 1 = Active

            // Tạo GSI (Index phụ) để sau này tìm kiếm: "Lấy tất cả user là student"
            newUser.setGsi1Pk("ROLE#" + role.toUpperCase());
            newUser.setGsi1Sk("USER#" + cognitoSub);

            // Gọi SchoolService để lưu vào DB
            schoolService.saveUser(newUser);

            return cognitoSub; // Trả về ID để báo cáo

        } catch (CognitoIdentityProviderException e) {
            throw new RuntimeException("Lỗi tạo user Cognito: " + e.awsErrorDetails().errorMessage());
        }
    }

    public AuthResponse login(LoginDto request) {
        try {
            Map<String, String> authParams = new HashMap<>();
            authParams.put("USERNAME", request.getEmail());
            authParams.put("PASSWORD", request.getPassword());

            InitiateAuthRequest authRequest = InitiateAuthRequest.builder()
                    .clientId(clientId)
                    .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
                    .authParameters(authParams) //
                    .build();

            InitiateAuthResponse response = cognitoClient.initiateAuth(authRequest);

            // CASE 1: Đăng nhập thành công luôn (User cũ)
            if (response.authenticationResult() != null) {
                return new AuthResponse(
                        response.authenticationResult().accessToken(),
                        response.authenticationResult().idToken(),
                        response.authenticationResult().refreshToken(),
                        "LOGIN_SUCCESS",null
                );
            }

            // CASE 2: Bắt buộc đổi mật khẩu (User mới do Admin tạo)
            else if (ChallengeNameType.NEW_PASSWORD_REQUIRED.equals(response.challengeName())) {
                // Trả về Session để FE dùng cho bước đổi pass
                return new AuthResponse(
                        null, null, null,
                        "FORCE_CHANGE_PASSWORD", // Báo hiệu cho FE biết
                        response.session()       // <--- QUAN TRỌNG: Phải trả cái Session này về FE
                );
            }

        } catch (Exception e) {
            throw new RuntimeException("Login failed: " + e.getMessage());
        }
        return null;
    }

    public AuthResponse respondToNewPasswordChallenge(String session, String username, String newPassword) {

        // [SỬA LỖI JAVA 8]: Dùng HashMap thay vì Map.of
        Map<String, String> challengeResponses = new HashMap<>();
        challengeResponses.put("USERNAME", username);
        challengeResponses.put("NEW_PASSWORD", newPassword);

        RespondToAuthChallengeRequest challengeRequest = RespondToAuthChallengeRequest.builder()
                .clientId(clientId)
                .challengeName(ChallengeNameType.NEW_PASSWORD_REQUIRED)
                .session(session) // Session lấy từ bước Login trước đó
                .challengeResponses(challengeResponses) // Truyền Map vào đây
                .build();

        RespondToAuthChallengeResponse response = cognitoClient.respondToAuthChallenge(challengeRequest);

        // Đổi pass xong thành công -> Trả về Token luôn
        if (response.authenticationResult() != null) {
            return new AuthResponse(
                    response.authenticationResult().accessToken(),
                    response.authenticationResult().idToken(),
                    response.authenticationResult().refreshToken(),
                    "LOGIN_SUCCESS",
                    null
            );
        }
        throw new RuntimeException("Đổi mật khẩu thất bại");
    }
    public void logout(String accessToken) {
        try {
            GlobalSignOutRequest request = GlobalSignOutRequest.builder()
                    .accessToken(accessToken)
                    .build();

            cognitoClient.globalSignOut(request);
        } catch (CognitoIdentityProviderException e) {
            throw new RuntimeException("Logout failed: " + e.awsErrorDetails().errorMessage());
        }
    }

    // 2. CHANGE PASSWORD (Đổi mật khẩu chủ động)
    // Dùng khi user đang đăng nhập và muốn đổi pass cũ sang mới
    public void changePassword(String accessToken, String oldPassword, String newPassword) {
        try {
            ChangePasswordRequest request = ChangePasswordRequest.builder()
                    .accessToken(accessToken)
                    .previousPassword(oldPassword)
                    .proposedPassword(newPassword)
                    .build();

            cognitoClient.changePassword(request);
        } catch (CognitoIdentityProviderException e) {
            throw new RuntimeException("Đổi mật khẩu thất bại: " + e.awsErrorDetails().errorMessage());
        }
    }

    // 3.1 FORGOT PASSWORD - BƯỚC 1: Yêu cầu gửi mã (Initiate)
    // Gửi email chứa mã xác nhận (Code) cho user
    public void forgotPassword(String email) {
        try {
            ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                    .clientId(clientId)
                    .username(email)
                    .build();

            cognitoClient.forgotPassword(request);
        } catch (CognitoIdentityProviderException e) {
            throw new RuntimeException("Lỗi gửi yêu cầu quên mật khẩu: " + e.awsErrorDetails().errorMessage());
        }
    }

    // 3.2 FORGOT PASSWORD - BƯỚC 2: Xác nhận đổi pass (Confirm)
    // Dùng mã code + pass mới để reset
    public void confirmForgotPassword(String email, String code, String newPassword) {
        try {
            ConfirmForgotPasswordRequest request = ConfirmForgotPasswordRequest.builder()
                    .clientId(clientId)
                    .username(email)
                    .confirmationCode(code)
                    .password(newPassword)
                    .build();

            cognitoClient.confirmForgotPassword(request);
        } catch (CognitoIdentityProviderException e) {
            throw new RuntimeException("Mã xác nhận sai hoặc hết hạn: " + e.awsErrorDetails().errorMessage());
        }
    }
}