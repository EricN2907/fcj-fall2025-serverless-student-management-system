# 🎓 Serverless Student Management System - Backend

Hệ thống quản lý sinh viên serverless được xây dựng với Spring Boot và các dịch vụ AWS.

## 📋 Mục lục

- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Cài đặt và chạy](#-cài-đặt-và-chạy)
- [API Documentation](#-api-documentation)

## 🛠 Công nghệ sử dụng

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| **Java** | 17 | Ngôn ngữ lập trình chính |
| **Spring Boot** | 2.7.18 | Framework phát triển ứng dụng |
| **Spring Security** | - | Xác thực và phân quyền |
| **Spring OAuth2 Resource Server** | - | Xử lý JWT token |
| **AWS SDK v2** | 2.25.11 | Tích hợp các dịch vụ AWS |
| **AWS DynamoDB** | - | Cơ sở dữ liệu NoSQL |
| **AWS Cognito** | - | Quản lý người dùng và xác thực |
| **AWS S3** | - | Lưu trữ file (avatar, tài liệu) |
| **AWS EventBridge** | - | Xử lý sự kiện |
| **SpringDoc OpenAPI** | 1.7.0 | Tạo tài liệu API tự động (Swagger UI) |
| **Lombok** | - | Giảm boilerplate code |
| **Maven** | - | Quản lý dependencies |

## 📁 Cấu trúc dự án

```
src/main/java/com/example/demo/
├── config/                          # Cấu hình ứng dụng
│   ├── CognitoConfig.java          # Cấu hình AWS Cognito
│   ├── DynamoConfig.java           # Cấu hình DynamoDB
│   ├── JwtAuthenticationConverter.java  # Chuyển đổi JWT
│   ├── JwtAuthenticationFilter.java     # Filter xác thực JWT
│   ├── OpenApiConfig.java          # Cấu hình Swagger/OpenAPI
│   ├── S3Config.java               # Cấu hình AWS S3
│   ├── SecurityConfig.java         # Cấu hình Spring Security
│   └── WebConfig.java              # Cấu hình CORS
│
├── controller/                      # REST API Controllers
│   ├── AdminController.java        # API quản trị viên
│   ├── AuthController.java         # API xác thực (login, register)
│   ├── LecturerController.java     # API giảng viên
│   ├── NotificationController.java # API thông báo
│   ├── SearchController.java       # API tìm kiếm
│   ├── StudentController.java      # API sinh viên
│   ├── UploadController.java       # API upload file
│   └── UserController.java         # API người dùng
│
├── dto/                             # Data Transfer Objects
│   ├── Admin/                      # DTO cho Admin
│   ├── Auth/                       # DTO cho Authentication
│   ├── Class/                      # DTO cho Class/Lớp học
│   ├── Enroll/                     # DTO cho đăng ký lớp
│   ├── Enum/                       # Enums (Role, Status)
│   ├── Grade/                      # DTO cho điểm số
│   ├── Lecturer/                   # DTO cho giảng viên
│   ├── Log/                        # DTO cho audit log
│   ├── Notification/               # DTO cho thông báo
│   ├── Password/                   # DTO cho đổi mật khẩu
│   ├── Post/                       # DTO cho bài đăng
│   ├── Search/                     # DTO cho tìm kiếm
│   ├── Student/                    # DTO cho sinh viên
│   ├── Subjects/                   # DTO cho môn học
│   └── User/                       # DTO cho người dùng
│
├── entity/                          # Entity classes
│   └── SchoolItem.java             # Entity chính cho DynamoDB
│
├── search/                          # Search functionality
│   ├── ISearchService.java         # Interface tìm kiếm
│   ├── SearchService.java          # Service tìm kiếm
│   └── SearchParam/                # Strategy pattern cho tìm kiếm
│       ├── ClassSearchStrategy.java
│       ├── SubjectSearchStrategy.java
│       └── UserSearchStrategy.java
│
├── service/                         # Business Logic Services
│   ├── AdminService.java           # Logic quản trị
│   ├── AuthService.java            # Logic xác thực
│   ├── EmailService.java           # Gửi email
│   ├── LecturerService.java        # Logic giảng viên
│   ├── S3Service.java              # Upload/download file
│   ├── SchoolService.java          # Logic chung
│   ├── StudentService.java         # Logic sinh viên
│   └── UserService.java            # Logic người dùng
│
├── util/                            # Utility classes
│   └── JwtTokenValidator.java      # Validate JWT token
│
└── SchoolApplication.java           # Main Application Entry Point
```

## 🚀 Cài đặt và chạy

### Yêu cầu
- Java 17+
- Maven 3.6+
- AWS Account với các dịch vụ: DynamoDB, Cognito, S3

### Cấu hình
Tạo file `application.properties` hoặc thiết lập biến môi trường:

```properties
# AWS Configuration
aws.region=ap-southeast-1
aws.cognito.userPoolId=your-user-pool-id
aws.cognito.clientId=your-client-id
aws.s3.bucketName=your-bucket-name
aws.dynamodb.tableName=your-table-name
```

### Chạy ứng dụng

```bash
# Build project
./mvnw clean install

# Chạy ứng dụng
./mvnw spring-boot:run
```

### Chạy với Docker

```bash
docker build -t student-management-be .
docker run -p 8080:8080 student-management-be
```

## 📖 API Documentation

Sau khi chạy ứng dụng, truy cập Swagger UI tại:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

## 👥 Vai trò người dùng

| Vai trò | Mô tả |
|---------|-------|
| **ADMIN** | Quản lý toàn bộ hệ thống, người dùng, môn học, lớp học |
| **LECTURER** | Quản lý lớp học, bài tập, chấm điểm, đăng bài |
| **STUDENT** | Xem lớp học, nộp bài, xem điểm, tương tác bài đăng |

## 📝 License

[MIT License](LICENSE)
