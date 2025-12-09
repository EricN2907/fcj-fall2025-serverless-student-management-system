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
    private final SchoolService schoolService;

    @Value("${aws.clientId}")
    private String clientId;

    @Value("${aws.cognito.user-pool-id}")
    private String userPoolId;

    public AuthService(CognitoIdentityProviderClient cognitoClient, SchoolService schoolService, JwtTokenValidator jwtTokenValidator) {
        this.cognitoClient = cognitoClient;
        this.schoolService = schoolService;
        this.jwtTokenValidator = jwtTokenValidator;
    }

    public Map<String, String> login(String email, String password) {
        Map<String, String> authParams = new HashMap<>();
        authParams.put("USERNAME", email);
        authParams.put("PASSWORD", password);

        try {
            InitiateAuthRequest request = InitiateAuthRequest.builder()
                    .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
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
                result.put("status", "CHALLENGE_REQUIRED");
                result.put("challengeName", response.challengeNameAsString());
                result.put("session", response.session());
                result.put("message", "Cần thực hiện bước tiếp theo: " + response.challengeNameAsString());
            }
            return result;

        } catch (CognitoIdentityProviderException e) {
            throw new RuntimeException("Lỗi đăng nhập: " + e.awsErrorDetails().errorMessage());
        }
    }

    public String adminCreateUser(String email, String name, String role, String tempPassword) {
        try {
            AdminCreateUserRequest request = AdminCreateUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(email)
                    .temporaryPassword(tempPassword)
                    .userAttributes(
                            AttributeType.builder().name("email").value(email).build(),
                            AttributeType.builder().name("name").value(name).build(),
                            AttributeType.builder().name("email_verified").value("true").build(),
                            AttributeType.builder().name("custom:role").value(role).build()
                    )
                    .messageAction(MessageActionType.SUPPRESS)
                    .build();

            AdminCreateUserResponse response = cognitoClient.adminCreateUser(request);

            String cognitoSub = response.user().username();

            SchoolItem newUser = new SchoolItem();
            newUser.setPk("USER#" + cognitoSub);
            newUser.setSk("PROFILE");

            newUser.setEmail(email);
            newUser.setName(name);
            newUser.setRoleName(role);
            newUser.setStatus(1);

            newUser.setGsi1Pk("ROLE#" + role.toUpperCase());
            newUser.setGsi1Sk("USER#" + cognitoSub);

            schoolService.saveUser(newUser);

            return cognitoSub;

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
                    .authParameters(authParams)
                    .build();

            InitiateAuthResponse response = cognitoClient.initiateAuth(authRequest);

            if (response.authenticationResult() != null) {
                return new AuthResponse(
                        response.authenticationResult().accessToken(),
                        response.authenticationResult().idToken(),
                        response.authenticationResult().refreshToken(),
                        "LOGIN_SUCCESS", null
                );
            } else if (ChallengeNameType.NEW_PASSWORD_REQUIRED.equals(response.challengeName())) {
                return new AuthResponse(
                        null, null, null,
                        "FORCE_CHANGE_PASSWORD",
                        response.session()
                );
            }

        } catch (Exception e) {
            throw new RuntimeException("Login failed: " + e.getMessage());
        }
        return null;
    }

    public AuthResponse respondToNewPasswordChallenge(String session, String username, String newPassword) {
        Map<String, String> challengeResponses = new HashMap<>();
        challengeResponses.put("USERNAME", username);
        challengeResponses.put("NEW_PASSWORD", newPassword);

        RespondToAuthChallengeRequest challengeRequest = RespondToAuthChallengeRequest.builder()
                .clientId(clientId)
                .challengeName(ChallengeNameType.NEW_PASSWORD_REQUIRED)
                .session(session)
                .challengeResponses(challengeResponses)
                .build();

        RespondToAuthChallengeResponse response = cognitoClient.respondToAuthChallenge(challengeRequest);

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