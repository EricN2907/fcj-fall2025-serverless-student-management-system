# 🎓 Student Management System - Frontend

Frontend cho hệ thống quản lý sinh viên serverless, xây dựng với React Router và AWS Amplify.

## 🎯 Tính năng chính

- 🔐 **AWS Cognito Authentication** - Đăng nhập/đăng xuất với auto token refresh
- 👥 **Role-based Access Control** - Admin, Lecturer, Student với quyền riêng biệt
- 💬 **Real-time Chat** - Chat sidebar với AppSync subscriptions
- 📊 **Analytics & Ranking** - Thống kê và xếp hạng sinh viên
- 📧 **Notifications** - Thông báo in-app và email
- 📁 **File Management** - Upload/download với S3
- ⚡️ **Hot Module Replacement** - Phát triển nhanh với HMR
- 🔒 **TypeScript** - Type safety hoàn toàn

## 🛠 Công nghệ sử dụng

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

## 📁 Cấu trúc dự án

```
app/
├── components/              # Reusable components
│   ├── chat/                # Chat components
│   ├── common/              # Shared components (TableList, RankingChart...)
│   ├── course/              # Course-related components
│   ├── forms/               # Form components
│   ├── layout/              # Layout components (Navbar, Footer...)
│   ├── lecturer/            # Lecturer-specific components
│   ├── notifications/       # Notification components
│   └── ui/                  # UI primitives
│
├── pages/                   # Page components
│   ├── auth/                # Login, Reset password
│   ├── admin/               # Admin pages
│   │   ├── users-management/
│   │   ├── subjects-management/
│   │   ├── classes-management/
│   │   └── dashboard.tsx
│   ├── lecturer/            # Lecturer pages
│   │   ├── classes/
│   │   ├── my-courses.tsx
│   │   └── dashboard.tsx
│   ├── student/             # Student pages
│   │   ├── my-courses.tsx
│   │   ├── all-courses.tsx
│   │   ├── calendar.tsx
│   │   └── ranking.tsx
│   └── common/              # Shared pages (Profile)
│
├── services/                # API services
│   ├── authApi.ts           # Authentication API
│   ├── lecturerApi.ts       # Lecturer API
│   ├── studentApi.ts        # Student API
│   └── uploadApi.ts         # File upload API
│
├── store/                   # State management
│   ├── authStore.ts         # Auth state (Zustand)
│   └── notificationUIStore.ts
│
├── config/                  # Configuration
│   └── amplify-config.ts    # AWS Amplify config
│
├── types/                   # TypeScript types
├── utils/                   # Utilities
│   └── axios.ts             # Axios instance with interceptors
│
├── routes.ts                # Route definitions
└── root.tsx                 # App root
```

## 🔑 Tính năng theo Role

### Admin
- ✅ CRUD users, subjects, classes
- ✅ Dashboard với metrics
- ✅ System settings
- ✅ Audit logs
- ✅ Assign lecturers to subjects

### Lecturer
- ✅ Quản lý lớp học (tối đa 40 sinh viên/lớp)
- ✅ CRUD assignments với S3 upload
- ✅ Chấm điểm với feedback
- ✅ Xem ranking và analytics
- ✅ Gửi thông báo cho sinh viên

### Student
- ✅ Dashboard cá nhân
- ✅ Đăng ký khóa học
- ✅ Xem ranking
- ✅ Nộp bài tập
- ✅ Nhận thông báo

## 🚀 Bắt đầu

### Yêu cầu
- Node.js 18+
- npm hoặc yarn
- AWS Account với Cognito User Pool

### Cài đặt

```bash
# Clone và cài đặt dependencies
npm install

# Copy file env mẫu
cp .env.example .env
```

### Cấu hình Environment Variables

Chỉnh sửa file `.env`:

```env
# AWS Cognito
VITE_COGNITO_USER_POOL_ID=ap-southeast-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=your-cognito-client-id
VITE_COGNITO_REGION=ap-southeast-1

# API Gateway
VITE_API_BASE_URL=https://your-api-gateway.execute-api.ap-southeast-1.amazonaws.com/prod
```

> ⚠️ **Quan trọng**: Không commit file `.env` lên Git (đã có trong `.gitignore`)

### Chạy Development

```bash
npm run dev
```

Truy cập: http://localhost:5173

### Build Production

```bash
npm run build
npm run start
```

## 🔐 Authentication Flow

```
1. User đăng nhập → Cognito xác thực
2. Cognito trả về tokens (Access, Refresh, ID)
3. Tokens lưu trong Zustand + localStorage
4. Axios interceptor tự động gắn token vào requests
5. Token hết hạn → Auto refresh với Refresh Token
```

## 🏗️ Architecture

```
Frontend (React)
    ↓
AWS Amplify → Cognito → Tokens
    ↓
API Gateway (Cognito Authorizer)
    ↓
Lambda Functions
    ↓
DynamoDB + S3 + Other AWS Services
```

## 🐳 Docker

```bash
# Build
docker build -t student-management-frontend .

# Run
docker run -p 3000:3000 student-management-frontend
```

## 🚢 Deployment

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod
```

### AWS Amplify
1. Connect Git repository
2. Add environment variables
3. Deploy

## 🔒 Security Checklist

- [ ] Credentials trong environment variables
- [ ] `.env` trong `.gitignore`
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] MFA cho admin users

## 📚 Tài liệu tham khảo

- [AWS Amplify Docs](https://docs.amplify.aws/)
- [AWS Cognito Docs](https://docs.aws.amazon.com/cognito/)
- [React Router Docs](https://reactrouter.com/)

## 📝 License

[MIT License](LICENSE)

---

Built with ❤️ using React, AWS Amplify & AWS Serverless Services.
