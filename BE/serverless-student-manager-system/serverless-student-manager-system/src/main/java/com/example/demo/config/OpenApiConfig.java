package com.example.demo.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.parameters.Parameter;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @io.swagger.v3.oas.annotations.info.Info(title = "Student Management API", version = "v1.0"),
        // Dòng này sẽ áp dụng ổ khóa cho TOÀN BỘ API
        security = @SecurityRequirement(name = "bearerAuth")
)
@SecurityScheme(
        name = "bearerAuth",          // Tên trùng với name ở trên
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT"
)

public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Student Management API")
                        .version("1.0")
                        .description("Tài liệu API cho hệ thống quản lý sinh viên (Serverless Spring Boot + DynamoDB + Cognito)"));
    }

    @Bean
    public OperationCustomizer customGlobalHeaders() {
        return (operation, handlerMethod) -> {
            // 1. Kiểm tra xem trong list parameters đã có cái nào tên "user-idToken" chưa
            boolean headerExists = operation.getParameters() != null && operation.getParameters().stream()
                    .anyMatch(p -> "user-idToken".equalsIgnoreCase(p.getName()));

            // 2. Nếu chưa có thì mới thêm vào
            if (!headerExists) {
                operation.addParametersItem(new Parameter()
                        .in("header")
                        .required(false)
                        .name("user-idToken")
                        .description("Nhập ID Token (để lấy email/user info)"));
            }

            return operation;
        };
    }
}
