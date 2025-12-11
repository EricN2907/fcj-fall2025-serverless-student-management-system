# 🎓 Serverless Student Management System - Frontend

Modern Learning Management System built with React Router and AWS Serverless.

## 🌐 Live Demo

**Website**: [https://serverlessstudent.cloud](https://serverlessstudent.cloud)

## 🛠 Tech Stack

| Category | Technologies |
|----------|-------------|
| Framework | React 19, React Router 7, TypeScript |
| Styling | TailwindCSS 4 |
| State | Zustand |
| HTTP | Axios |
| Build | React Router CLI + Vite |

## ☁️ AWS Services

| Service | Purpose |
|---------|---------|
| Amplify | Hosting & CI/CD |
| Cognito | Authentication |
| Route 53 | DNS Management |
| CloudFront + WAF | CDN & Security |
| ACM | SSL/TLS Certificates |
| API Gateway | REST API |
| CloudWatch | Monitoring |

## 🎯 Features

- 🔐 AWS Cognito Authentication with auto token refresh
- 👥 Role-based Access Control (Admin, Lecturer, Student)
- 📚 Course & Class Management (CRUD)
- 📝 Assignment Management with Grading
- 🔔 Notifications
- 📁 File Upload/Download (S3)
- 📊 Analytics & Rankings *(in development)*
- � RealS-time Chat *(in development)*

## 📁 Project Structure

```
app/
├── components/           # Reusable UI components
│   ├── calendar/         # Assignment calendar modal
│   ├── chat/             # Chat sidebar, messages
│   ├── common/           # TableList, RankingChart, GoogleSignIn
│   ├── course/           # Assignment, Post, Submission tabs
│   ├── forms/            # FormInput
│   ├── layout/           # Navbar, Footer, AdminLayout, UserLayout
│   ├── lecturer/         # Lecturer-specific components
│   ├── notifications/    # NotificationBell
│   └── ui/               # Cards, Modals, Dialogs, Select, etc.
├── config/               # AWS Amplify configuration
├── lib/                  # Shared types
├── pages/                # Route pages by role
│   ├── auth/             # Login, Reset password
│   ├── admin/            # Dashboard, Users/Subjects/Classes management
│   ├── common/           # Profile (shared)
│   ├── lecturer/         # Dashboard, My courses, Classes, Notifications
│   └── student/          # My courses, All courses, Calendar, Ranking
├── services/             # API services (auth, chat, student, lecturer, upload)
├── store/                # Zustand stores (auth, notification)
├── style/                # CSS modules
├── types/                # TypeScript type definitions
├── utils/                # Axios instance with interceptors
├── root.tsx              # App root - initializes Amplify
└── routes.ts             # Route definitions
```

## � Gettting Started

### Prerequisites
- Node.js 18+
- AWS Account with Cognito configured

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your AWS credentials

# Start development server
npm run dev
```

### Environment Variables

See [.env.example](.env.example) for all required environment variables.

## 🏗️ Architecture

```
React App → Amplify → Cognito → API Gateway → Lambda → DynamoDB/S3
                         ↓
              CloudFront + WAF (CDN & Security)
                         ↓
                    Route 53 (DNS)
```

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |

## 🚀 Deployment

Project is deployed via AWS Amplify with automatic CI/CD from Git repository.

```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: build/client
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## 🔐 Security

- Environment variables for all credentials
- Automatic token refresh
- API Gateway with Cognito Authorizer
- CloudFront + WAF protection
- HTTPS only

## 📚 References

- [AWS Amplify Docs](https://docs.amplify.aws/)
- [AWS Cognito](https://docs.aws.amazon.com/cognito/)
- [React Router](https://reactrouter.com/)

## 📄 License

MIT License
