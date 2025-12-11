# 🎓 Student Management System - Backend

Backend API cho hệ thống quản lý sinh viên serverless, xây dựng với Spring Boot và các dịch vụ AWS.

## 🛠 Công nghệ sử dụng

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| Java | 17 | Ngôn ngữ lập trình |
| Spring Boot | 2.7.18 | Framework chính |
| AWS SDK | 2.25.11 | Tích hợp AWS services |
| Maven | 3.x | Build tool |

## ☁️ AWS Services

- **DynamoDB** - Cơ sở dữ liệu NoSQL
- **Cognito** - Xác thực và quản lý người dùng
- **S3** - Lưu trữ file (avatar, bài tập, submissions)
- **EventBridge** - Xử lý sự kiện và scheduled tasks
- **SES** - Gửi email thông báo

## 📁 Cấu trúc dự án

```
src/main/java/com/example/demo/
├── config/                    # Cấu hình ứng dụng
│   ├── CognitoConfig.java     # AWS Cognito configuration
│   ├── DynamoConfig.java      # DynamoDB configuration
│   ├── S3Config.java          # S3 configuration
│   ├── SecurityConfig.java    # Spring Security + OAuth2
│   ├── WebConfig.java         # CORS configuration
│   └── OpenApiConfig.java     # Swagger/OpenAPI configuration
│
├── controller/                # REST API Controllers
│   ├── AuthController.java    # Đăng nhập, đăng ký, đổi mật khẩu
│   ├── AdminController.java   # Quản lý users, subjects, classes
│   ├── LecturerController.java# Quản lý lớp học, bài tập, điểm
│   ├── StudentController.java # Đăng ký khóa học, nộp bài
│   ├── UserController.java    # Profile, thông tin cá nhân
│   ├── SearchController.java  # Tìm kiếm
│   ├── NotificationController.java # Thông báo
│   └── UploadController.java  # Upload file lên S3
│
├── service/                   # Business Logic
│   ├── AuthService.java       # Xử lý authentication với Cognito
│   ├── AdminService.java      # Logic quản trị
│   ├── LecturerService.java   # Logic giảng viên
│   ├── StudentService.java    # Logic sinh viên
│   ├── SchoolService.java     # Logic chung
│   ├── UserService.java       # Quản lý user
│   ├── S3Service.java         # Upload/download file
│   └── EmailService.java      # Gửi email
│
├── dto/                       # Data Transfer Objects
│   ├── Auth/                  # Login, Register DTOs
│   ├── Admin/                 # Admin DTOs
│   ├── Lecturer/              # Lecturer DTOs
│   ├── Student/               # Student DTOs
│   ├── Class/                 # Class DTOs
│   ├── Grade/                 # Grade DTOs
│   ├── Post/                  # Post & Comment DTOs
│   └── ...                    # Các DTOs khác
│
├── entity/                    # DynamoDB Entities
│   └── SchoolItem.java        # Entity chính
│
├── search/                    # Search functionality
│   ├── ISearchService.java    # Search interface
│   ├── SearchService.java     # Search implementation
│   └── SearchParam/           # Search strategies
│
└── SchoolApplication.java     # Main application
```

## 🔐 Authentication & Authorization

### Roles
- **ADMIN** - Quản trị viên hệ thống
- **LECTURER** - Giảng viên
- **STUDENT** - Sinh viên

### Security Flow
```
Client → JWT Token → Spring Security → Cognito Validation → API Access
```

## 🚀 Chạy ứng dụng

### Yêu cầu
- Java 17+
- Maven 3.x
- AWS Account với các services đã cấu hình

### Cấu hình
Tạo file `application.properties` hoặc set environment variables:

```properties
# AWS Configuration
aws.region=ap-southeast-1
aws.cognito.userPoolId=your-user-pool-id
aws.cognito.clientId=your-client-id

# DynamoDB
aws.dynamodb.tableName=your-table-name

# S3
aws.s3.bucketName=your-bucket-name

# Spring Security OAuth2
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://cognito-idp.{region}.amazonaws.com/{userPoolId}
```

### Chạy development
```bash
# Sử dụng Maven Wrapper
./mvnw spring-boot:run

# Hoặc Maven
mvn spring-boot:run
```

### Build production
```bash
./mvnw clean package -DskipTests
java -jar target/demo-0.0.1-SNAPSHOT.jar
```

## 📖 API Documentation

Sau khi chạy ứng dụng, truy cập Swagger UI:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

## 🐳 Docker

### Build image
```bash
docker build -t student-management-backend .
```

### Run container
```bash
docker run -p 8080:8080 \
  -e AWS_REGION=ap-southeast-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  student-management-backend
```

## 🗄️ Database Schema

Sử dụng DynamoDB với Single Table Design:

| PK | SK | Attributes |
|----|----|----|
| USER#\<id\> | PROFILE | name, email, role, avatar... |
| CLASS#\<id\> | INFO | name, subject, lecturer... |
| CLASS#\<id\> | STUDENT#\<id\> | enrollment info |
| CLASS#\<id\> | ASSIGNMENT#\<id\> | title, deadline, files... |
| ... | ... | ... |

### Seed Data
```bash
cd Database
npm install
node seed.js
```

## 🧪 Testing

```bash
# Run all tests
./mvnw test

# Run specific test
./mvnw test -Dtest=AuthServiceTest
```

## 📝 License

[MIT License](LICENSE)
