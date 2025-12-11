# 🎓 Serverless Student Management System

Hệ thống quản lý sinh viên serverless được xây dựng trên nền tảng AWS, bao gồm Backend (Spring Boot) và Frontend (React).

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
| AWS Amplify | AWS integration |
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

## 🔐 Roles & Permissions

| Role | Quyền hạn |
|------|-----------|
| **Admin** | Quản lý users, subjects, classes, system settings |
| **Lecturer** | Quản lý lớp học, bài tập, chấm điểm, gửi thông báo |
| **Student** | Đăng ký khóa học, nộp bài, xem điểm, nhận thông báo |

## 🚀 Quick Start

### Backend
```bash
cd BE/serverless-student-manager-system/serverless-student-manager-system
./mvnw spring-boot:run
```
API sẽ chạy tại: http://localhost:8080

Swagger UI: http://localhost:8080/swagger-ui.html

### Frontend
```bash
cd FE/serverless-student-management-system-front-end
npm install
npm run dev
```
App sẽ chạy tại: http://localhost:5173

## 🐳 Docker

### Build & Run Backend
```bash
cd BE/serverless-student-manager-system/serverless-student-manager-system
docker build -t student-management-backend .
docker run -p 8080:8080 student-management-backend
```

### Build & Run Frontend
```bash
cd FE/serverless-student-management-system-front-end
docker build -t student-management-frontend .
docker run -p 3000:3000 student-management-frontend
```

## 📖 Tài liệu chi tiết

- [📘 Backend README](BE/serverless-student-manager-system/serverless-student-manager-system/README.md)
- [📗 Frontend README](FE/serverless-student-management-system-front-end/README.md)

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│   API Gateway   │────▶│     Lambda      │
│  (React + TS)   │     │  (Cognito Auth) │     │  (Spring Boot)  │
└─────────────────┘     └─────────────────┘     └────────���────────┘
        │                                               │
        │                                               ▼
        │                                       ┌───────────────┐
        │                                       │   DynamoDB    │
        │                                       └───────────────┘
        │                                               │
        ▼                                               ▼
┌─────────────────┐                             ┌───────────────┐
│  AWS Cognito    │                             │      S3       │
│ (Auth + Users)  │                             │   (Storage)   │
└─────────────────┘                             └───────────────┘
```

## 👥 Đội ngũ phát triển

**FCJ Groups** - [https://gitlab.com/fcj-groups](https://gitlab.com/fcj-groups)

## 📝 License

[MIT License](LICENSE)
