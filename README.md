# 🎓 Serverless Student Management System

Hệ thống quản lý sinh viên serverless được xây dựng trên nền tảng AWS, bao gồm Backend (Spring Boot) và Frontend (React).

## 🔗 Repository

**GitLab**: [https://gitlab.com/fcj-groups](https://gitlab.com/fcj-groups)

## 📦 Cấu trúc dự án

```
├── BE/                                    # Backend
│   └── serverless-student-manager-system/ # Spring Boot Application
│       ├── src/                           # Source code
│       ├── Database/                      # Database scripts & seeds
│       ├── pom.xml                        # Maven dependencies
│       └── Dockerfile                     # Docker configuration
│
├── FE/                                    # Frontend
│   └── serverless-student-management-system-front-end/
│       ├── app/                           # React application
│       ├── package.json                   # NPM dependencies
│       └── Dockerfile                     # Docker configuration
│
└── README.md                              # File này
```

## 🛠 Công nghệ sử dụng

### Backend
- **Java 17** + **Spring Boot 2.7.18**
- **AWS DynamoDB** - Cơ sở dữ liệu NoSQL
- **AWS Cognito** - Xác thực người dùng
- **AWS S3** - Lưu trữ file
- **AWS EventBridge** - Xử lý sự kiện
- **Spring Security** + **OAuth2** - Bảo mật

### Frontend
- **React** + **TypeScript**
- **React Router** - Điều hướng
- **Zustand** - State management
- **Axios** - HTTP client
- **AWS Amplify** - Tích hợp AWS

## 🚀 Bắt đầu

### Backend
```bash
cd BE/serverless-student-manager-system
./mvnw spring-boot:run
```

### Frontend
```bash
cd FE/serverless-student-management-system-front-end
npm install
npm run dev
```

## 📖 Tài liệu chi tiết

- [Backend README](BE/serverless-student-manager-system/README.md)
- [Frontend README](FE/serverless-student-management-system-front-end/README.md)

## 👥 Đội ngũ phát triển

**FCJ Groups** - [https://gitlab.com/fcj-groups](https://gitlab.com/fcj-groups)

## 📝 License

[MIT License](LICENSE)
