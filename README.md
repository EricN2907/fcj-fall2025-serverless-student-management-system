# 🎓 Serverless Student Management System

Hệ thống quản lý sinh viên serverless được xây dựng trên nền tảng AWS, bao gồm Backend (Spring Boot) và Frontend (React).

## 🌐 Live Demo

**Website**: [https://serverlessstudent.cloud](https://serverlessstudent.cloud)

## 🔗 Repository

**GitLab**: [https://gitlab.com/fcj-groups](https://gitlab.com/fcj-groups)

## 📦 Cấu trúc dự án

```
├── BE/                                          # Backend
│   └── serverless-student-manager-system/
│       └── serverless-student-manager-system/
│           ├── src/main/java/com/example/demo/
│           │   ├── config/                      # AWS & Security configs
│           │   ├── controller/                  # REST API endpoints
│           │   ├── service/                     # Business logic
│           │   ├── dto/                         # Data Transfer Objects
│           │   ├── entity/                      # DynamoDB entities
│           │   └── search/                      # Search functionality
│           ├── Database/                        # Seed scripts
│           ├── pom.xml                          # Maven dependencies
│           └── Dockerfile
│
├── FE/                                          # Frontend
│   └── serverless-student-management-system-front-end/
│       ├── app/
│       │   ├── components/                      # Reusable components
│       │   ├── pages/                           # Page components
│       │   ├── services/                        # API services
│       │   ├── store/                           # State management
│       │   ├── types/                           # TypeScript types
│       │   └── utils/                           # Utilities
│       ├── package.json
│       └── Dockerfile
│
└── README.md
```

## 🛠 Tech Stack

### Backend
| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| Java | 17 | Ngôn ngữ lập trình |
| Spring Boot | 2.7.18 | Framework chính |
| Spring Security | - | Authentication & Authorization |
| AWS SDK | 2.25.11 | Tích hợp AWS services |
| Lombok | - | Giảm boilerplate code |
| Swagger/OpenAPI | 1.7.0 | API documentation |

### Frontend
| Công nghệ | Mô tả |
|-----------|-------|
| React 19 | UI Library |
| React Router 7 | Routing |
| TypeScript | Type safety |
| TailwindCSS 4 | Styling |
| Zustand | State management |
| Axios | HTTP client |
| AWS Amplify | Hosting & CI/CD |
| Vite | Build tool |

## ☁️ AWS Services

| Service | Mục đích |
|---------|----------|
| **DynamoDB** | Cơ sở dữ liệu NoSQL |
| **Cognito** | Xác thực người dùng |
| **S3** | Lưu trữ file (avatar, bài tập) |
| **EventBridge** | Xử lý sự kiện |
| **SES** | Gửi email thông báo |
| **API Gateway** | REST API endpoint |
| **Lambda** | Serverless compute |
| **Route 53** | DNS management |
| **CloudFront + WAF** | CDN & Web Application Firewall |
| **ACM** | SSL/TLS certificates |
| **CloudWatch** | Giám sát API Gateway và Lambda metrics |

## Roles & Permissions

| Role | Quyền hạn |
|------|-----------|
| **Admin** | Quản lý users, subjects, classes, system settings |
| **Lecturer** | Quản lý lớp học, bài tập, chấm điểm, gửi thông báo |
| **Student** | Đăng ký khóa học, nộp bài, xem điểm, nhận thông báo |

## Kiến trúc hệ thống

### Tổng quan Architecture

<img width="1261" height="871" alt="Solution drawio" src="https://github.com/user-attachments/assets/08469eae-8911-435b-ab92-ad9fba379247" />

### Chi tiết các thành phần

| Layer | Component | Mô tả |
|-------|-----------|-------|
| **Frontend** | React + TypeScript | Single Page Application với React Router |
| **CDN** | CloudFront + WAF | Phân phối nội dung và bảo vệ ứng dụng |
| **DNS** | Route 53 | Quản lý domain và routing |
| **Auth** | Cognito | Xác thực JWT, quản lý user pools |
| **API** | API Gateway | REST API với Cognito Authorizer |
| **Compute** | Lambda | Serverless compute chạy Spring Boot |
| **Database** | DynamoDB | NoSQL database với Single Table Design |
| **Storage** | S3 | Lưu trữ file (avatar, assignments) |
| **Events** | EventBridge | Xử lý sự kiện và scheduled tasks |
| **Email** | SES | Gửi email thông báo |

## 🚀 Hướng dẫn cài đặt và chạy

### Yêu cầu hệ thống

| Yêu cầu | Phiên bản |
|---------|-----------|
| Java | 17+ |
| Node.js | 18+ |
| Maven | 3.x |
| Docker | 20+ (optional) |
| AWS CLI | 2.x (optional) |

### Bước 1: Clone repository

```bash
git clone https://gitlab.com/fcj-groups/serverless-student-management-system.git
cd serverless-student-management-system
```

### Bước 2: Cấu hình AWS Services

#### 2.1 Tạo Cognito User Pool
1. Truy cập AWS Console → Cognito
2. Tạo User Pool với các settings:
   - Sign-in: Email
   - Password policy: Minimum 8 characters
   - MFA: Optional
3. Tạo App Client (không có client secret)
4. Lưu lại `User Pool ID` và `Client ID`

#### 2.2 Tạo DynamoDB Table
```bash
aws dynamodb create-table \
  --table-name StudentManagement \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region ap-southeast-1
```

#### 2.3 Tạo S3 Bucket
```bash
aws s3 mb s3://student-management-files --region ap-southeast-1
```

### Bước 3: Chạy Backend

```bash
# Di chuyển vào thư mục backend
cd BE/serverless-student-manager-system/serverless-student-manager-system

# Tạo file cấu hình
cp src/main/resources/application.properties.example src/main/resources/application.properties

# Chỉnh sửa application.properties với thông tin AWS của bạn
# aws.region=ap-southeast-1
# aws.cognito.userPoolId=your-user-pool-id
# aws.cognito.clientId=your-client-id
# aws.dynamodb.tableName=StudentManagement
# aws.s3.bucketName=student-management-files

# Chạy ứng dụng
./mvnw spring-boot:run
```

Backend sẽ chạy tại: http://localhost:8080

Swagger UI: http://localhost:8080/swagger-ui.html

### Bước 4: Chạy Frontend

```bash
# Di chuyển vào thư mục frontend
cd FE/serverless-student-management-system-front-end

# Cài đặt dependencies
npm install

# Tạo file cấu hình
cp .env.example .env

# Chỉnh sửa .env với thông tin của bạn
# VITE_COGNITO_USER_POOL_ID=your-user-pool-id
# VITE_COGNITO_CLIENT_ID=your-client-id
# VITE_COGNITO_REGION=ap-southeast-1
# VITE_API_BASE_URL=http://localhost:8080

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173

### Bước 5: Seed dữ liệu mẫu (Optional)

```bash
cd BE/serverless-student-manager-system/serverless-student-manager-system/Database
npm install
node seed.js
```

## 🐳 Chạy với Docker

### Docker Compose (Recommended)

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./BE/serverless-student-manager-system/serverless-student-manager-system
    ports:
      - "8080:8080"
    environment:
      - AWS_REGION=ap-southeast-1
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    
  frontend:
    build: ./FE/serverless-student-management-system-front-end
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

```bash
# Chạy tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

### Chạy riêng từng service

#### Backend
```bash
cd BE/serverless-student-manager-system/serverless-student-manager-system

# Build image
docker build -t student-management-backend .

# Run container
docker run -p 8080:8080 \
  -e AWS_REGION=ap-southeast-1 \
  -e AWS_ACCESS_KEY_ID=your-access-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret-key \
  student-management-backend
```

#### Frontend
```bash
cd FE/serverless-student-management-system-front-end

# Build image
docker build -t student-management-frontend .

# Run container
docker run -p 3000:3000 student-management-frontend
```

## 🧪 Testing

### Backend Tests
```bash
cd BE/serverless-student-manager-system/serverless-student-manager-system
./mvnw test
```

### Frontend Tests
```bash
cd FE/serverless-student-management-system-front-end
npm run test
```

## 📖 Tài liệu chi tiết

- [📘 Backend README](BE/serverless-student-manager-system/serverless-student-manager-system/README.md)
- [📗 Frontend README](FE/serverless-student-management-system-front-end/README.md)

## 👥 Đội ngũ phát triển

**FCJ Groups** - [https://gitlab.com/fcj-groups](https://gitlab.com/fcj-groups)

## 📝 License

[MIT License](LICENSE)
