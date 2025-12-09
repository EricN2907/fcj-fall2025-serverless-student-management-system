# Serverless Student Management System (LMS)

A modern, serverless Learning Management System built with React Router, AWS Amplify, and AWS Cognito for authentication. Features role-based access control for Admin, Lecturer, and Student users.

## 🎯 Features

- 🔐 **AWS Cognito Authentication** - Secure login/logout with automatic token refresh
- 👥 **Role-based Access Control** - Admin, Lecturer, Student with specific permissions
- 🚀 **Serverless Architecture** - API Gateway + Lambda functions
- 💬 **Real-time Chat** - Chat sidebar with AppSync subscriptions (like LMS FPT)
- 📊 **Analytics & Ranking** - AWS Personalize for personalized recommendations
- 📧 **Notifications** - In-app (AppSync) and email (SES) notifications
- 📁 **File Management** - S3 integration for avatars and assignments
- ⚡️ **Hot Module Replacement** - Fast development with HMR
- 🔒 **TypeScript** - Full type safety
- 🎨 **TailwindCSS** - Modern styling
- 📦 **Reusable Components** - TableList, FormInput, RankingChart, etc.

## 📁 Project Structure

### Pages Structure

```
pages/
┣ auth/                          # Authentication & Authorization
│ ┣ login.tsx                    # Login page with Cognito
│ ┗ reset-password.tsx           # Password reset (2-step flow)
│
┣ common/                        # Shared pages for all roles
│ ┗ profile/                     # Profile management
│   ├── index.tsx                # Main profile (conditional by role)
│   ├── studentInfo.tsx          # Student-specific info
│   ├── lecturerInfo.tsx         # Lecturer-specific info
│   └── adminInfo.tsx            # Admin-specific info
│
┣ admin/                         # Admin pages
│ ┣ users-management/            # User CRUD
│ ┣ subjects-management/         # Subject CRUD
│ ┣ classes-management/          # Class CRUD
│ ┣ dashboard.tsx                # Admin dashboard with charts
│ ┣ settings.tsx                 # System configuration
│ └── audit-logs.tsx             # Activity logs
│
┣ lecturer/                      # Lecturer pages
│ ┣ classes-management/          # Manage assigned classes (max 40 students)
│ ┣ assignments-management/      # Create/grade assignments (S3 upload)
│ ┣ students-management/         # Manage students per class
│ ┣ reports.tsx                  # Per-class reports + export
│ ┣ ranking-analyst.tsx          # Ranking analytics (Personalize)
│ ┣ chat-moderate.tsx            # Moderate chat
│ └── notifications-send.tsx     # Send notifications (SES)
│
┗ student/                       # Student pages
  ┣ dashboard.tsx                # Personal overview
  ┣ my-courses.tsx               # Enrolled courses
  ┣ all-courses.tsx              # Browse & enroll courses
  ┣ ranking.tsx                  # Personal ranking
  └── notifications-receive.tsx  # View notifications
```

### Components Structure

```
components/
┣ chat/
│ ┣ ChatSidebar.tsx              # Sidebar chat (toggle from header)
│ ┗ ChatMessage.tsx              # Message component
┣ TableList.tsx                  # Reusable table with search/filter
┣ FormInput.tsx                  # Reusable form fields
┣ NotificationBell.tsx           # Notification bell icon
┣ RankingChart.tsx               # Chart component (Chart.js)
┣ navbar.tsx                     # Role-based navigation
┣ footer.tsx                     # Footer
└── GoogleSignInButton.tsx       # Google OAuth (optional)
```

### Route Configuration

Routes are defined in `app/routes.ts`:

**Authentication**
- `/auth/login` - Login page
- `/auth/reset-password` - Password reset

**Common (All roles)**
- `/profile` - User profile (conditional render by role)

**Admin Routes**
- `/admin/dashboard` - Admin dashboard
- `/admin/users-management/*` - User management
- `/admin/subjects-management/*` - Subject management
- `/admin/classes-management/*` - Class management
- `/admin/settings` - System settings
- `/admin/audit-logs` - Activity logs

**Lecturer Routes**
- `/lecturer/classes-management/*` - Manage classes
- `/lecturer/assignments-management/*` - Manage assignments
- `/lecturer/students-management/*` - Manage students
- `/lecturer/reports` - Reports
- `/lecturer/ranking-analyst` - Analytics
- `/lecturer/chat-moderate` - Chat moderation
- `/lecturer/notifications-send` - Send notifications

**Student Routes**
- `/student/dashboard` - Student dashboard
- `/student/my-courses` - My courses
- `/student/all-courses` - Browse courses
- `/student/ranking` - My ranking
- `/student/notifications-receive` - Notifications

## 🏗️ Architecture

```
Frontend (React) → Amplify → Cognito → AccessToken + RefreshToken
                                              ↓
                                        API Gateway (Cognito Authorizer)
                                              ↓
                                           Lambda Functions
                                              ↓
                                    DynamoDB + S3 + Other AWS Services
```

## 🔑 Key Features by Role

### Admin Features
- ✅ Full CRUD for users, subjects, classes
- ✅ System-wide dashboard with metrics
- ✅ System settings & configuration
- ✅ Audit logs (view all activities)
- ✅ Assign lecturers to subjects
- ✅ Manage enrollments

### Lecturer Features
- ✅ Manage assigned classes (max 40 students per class)
- ✅ Create/edit classes (only for assigned subjects)
- ✅ CRUD assignments with S3 file upload
- ✅ Grade student submissions with feedback
- ✅ Manage students in classes (enroll/unenroll)
- ✅ View class rankings with analytics
- ✅ Moderate chat rooms
- ✅ Send notifications to students (email + in-app)
- ✅ Generate per-class reports

### Student Features
- ✅ Personal dashboard with overview
- ✅ View enrolled courses
- ✅ Browse and enroll in available courses
- ✅ View personal and class rankings
- ✅ Receive notifications (deadlines, updates)
- ✅ Submit assignments
- ✅ Participate in class chat

## 🚀 Getting Started

### AWS Cognito
The project uses AWS Cognito for authentication. All credentials are loaded from environment variables for security.

**Required environment variables** (in `.env` file):
- `VITE_COGNITO_USER_POOL_ID` - Your Cognito User Pool ID
- `VITE_COGNITO_CLIENT_ID` - Your Cognito App Client ID  
- `VITE_COGNITO_REGION` - Your AWS region (e.g., `ap-southeast-1`)
- `VITE_API_BASE_URL` - Your API Gateway endpoint URL

> ✅ **Security**: All sensitive credentials are stored in `.env` file which is gitignored and never committed to version control.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- AWS Account with Cognito User Pool configured
- AWS CLI (optional, for creating users)

### AWS Resources Configuration

The project uses AWS Cognito for authentication. All credentials are loaded from environment variables for security.

**Required environment variables** (in `.env` file):

1. Install the dependencies:

```bash
npm install
```

3. Configure environment variables:

3. Configure environment variables:

Create a `.env` file from the example:
```bash
cp .env.example .env
```

Edit `.env` and fill in your AWS credentials:
```env
# AWS Cognito Configuration
VITE_COGNITO_USER_POOL_ID=your-region_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=your-cognito-client-id
VITE_COGNITO_REGION=ap-southeast-1

# AWS API Gateway
VITE_API_BASE_URL=https://your-api-gateway-id.execute-api.ap-southeast-1.amazonaws.com/prod
```

> 🔒 **Important**: Never commit your `.env` file to version control. It's already in `.gitignore`.
```env
VITE_API_BASE_URL=https://your-api-gateway-id.execute-api.ap-southeast-1.amazonaws.com/prod
```

### Creating Users in Cognito

Before you can login, you need to create users in AWS Cognito User Pool.

#### Method 1: AWS Console
1. Go to AWS Console → Cognito → User Pools
2. Select your User Pool
3. Go to **Users** tab → Click **Create user**
4. Fill in:
   - Username: `test@example.com`
   - Email: `test@example.com`
   - Temporary password: `TempPassword123!`
   - ✓ Mark email as verified
5. Click **Create user**

#### Method 2: AWS CLI

```bash
# Create user
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username test@example.com \
  --user-attributes Name=email,Value=test@example.com Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --region YOUR_REGION

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR_USER_POOL_ID \
  --username test@example.com \
  --password YourSecurePassword123! \
  --permanent \
  --region YOUR_REGION
```

#### Add Custom Role Attribute (Optional)

```bash
aws cognito-idp admin-update-user-attributes \
  --user-pool-id YOUR_USER_POOL_ID \
  --username test@example.com \
  --user-attributes Name=custom:role,Value=Student \
  --region YOUR_REGION
```

**Available roles**: `Student`, `Lecturer`, `Admin`

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Authentication Flow

### Login Process
1. User enters email and password in login form
2. App calls `loginWithCognito()` from auth store
3. Amplify communicates with AWS Cognito
4. Cognito returns tokens:
   - **AccessToken**: Used for API Gateway authorization (expires in 1 hour)
   - **RefreshToken**: Used to get new access tokens (expires in 30 days)
   - **IdToken**: Contains user information
5. Tokens are stored in Zustand state + localStorage
6. User is redirected to dashboard

### API Request Flow
1. User makes an API call via axios
2. Axios interceptor automatically adds AccessToken to request header:
   ```
   Authorization: Bearer <AccessToken>
   ```
3. API Gateway validates token with Cognito Authorizer
4. If valid, request is forwarded to Lambda function
5. Lambda processes and returns response

### Token Refresh Flow
1. When API returns 401 (token expired)
2. Axios interceptor automatically:
   - Calls Cognito to refresh the token
   - Gets new AccessToken
   - Retries the original request with new token
3. If refresh fails → redirects to login page

### Logout Process
1. User clicks "Logout" button
2. App calls `logoutFromCognito()`
3. Amplify invalidates tokens with Cognito
4. Local state is cleared
5. User is redirected to login page

## Project Structure

```
app/
├── config/
│   └── amplify-config.ts       # AWS Amplify & Cognito configuration
├── store/
│   └── authStore.ts            # Authentication state management (Zustand)
├── utils/
│   └── axios.ts                # Axios instance with token interceptors
├── pages/
│   ├── login.tsx               # Login page with Cognito integration
│   ├── dashboard.tsx           # Dashboard with logout functionality
│   ├── students.tsx            # Student management
│   └── courses.tsx             # Course management
├── components/
│   ├── navbar.tsx              # Navigation bar
│   └── footer.tsx              # Footer
└── root.tsx                    # App root - initializes Amplify
```

## API Gateway Setup

### Configure Cognito Authorizer

1. Open AWS API Gateway Console
2. Select or create your API
3. Create a **Cognito User Pool Authorizer**:
   - **Name**: `CognitoAuthorizer`
   - **Type**: `COGNITO_USER_POOLS`
   - **Provider**: Select your Cognito User Pool
   - **Token Source**: `Authorization`
   - **Token Validation**: ✓ Enabled

4. Attach authorizer to your API routes/methods

### Lambda Function Example

Your Lambda functions will receive user info from Cognito in the event context:

```javascript
exports.handler = async (event) => {
  // Get user info from Cognito claims
  const userEmail = event.requestContext.authorizer.claims.email;
  const userId = event.requestContext.authorizer.claims.sub;
  const userRole = event.requestContext.authorizer.claims['custom:role'];
  
  console.log(`Request from user: ${userEmail} (${userRole})`);
  
  // Your Lambda logic here
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      message: 'Success', 
      user: userEmail 
    })
  };
};
```

## Usage Examples

### Login in Component
```tsx
import { useAuthStore } from '../store/authStore'

function LoginComponent() {
  const { loginWithCognito, isLoading, error } = useAuthStore()
  
  const handleLogin = async (email: string, password: string) => {
    try {
      await loginWithCognito(email, password)
      // Success - automatically redirects to dashboard
    } catch (error) {
      console.error('Login failed:', error)
    }
  }
}
```

### Logout
```tsx
import { useAuthStore } from '../store/authStore'

function LogoutButton() {
  const { logoutFromCognito, isLoading } = useAuthStore()
  
  const handleLogout = async () => {
    await logoutFromCognito()
    // Automatically redirects to /login
  }
}
```

### Protected API Call
```tsx
import api from '../utils/axios'

// Token is automatically added to request header
const fetchStudents = async () => {
  const response = await api.get('/students')
  return response.data
}

// Token automatically refreshes if expired
const createStudent = async (data: StudentData) => {
  const response = await api.post('/students', data)
  return response.data
}
```

### Get Current User
```tsx
import { useAuthStore } from '../store/authStore'

function UserProfile() {
  const { user, isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) return <div>Please login</div>
  
  return (
    <div>
      <h2>{user.fullName}</h2>
      <p>{user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  )
}
```

## Troubleshooting

### Issue: "User not found" error
**Solution**: 
- Create user in Cognito User Pool (see "Creating Users in Cognito" section)
- Verify email is confirmed

### Issue: "Invalid credentials" error
**Solution**:
- Check password meets requirements (8+ chars, uppercase, lowercase, number, special character)
- Verify username/email is correct
- If using temporary password, complete password reset flow

### Issue: Token not added to requests
**Solution**:
- Check if user is logged in: `useAuthStore.getState().isAuthenticated`
- Verify Amplify is initialized in `root.tsx`
- Check browser console for errors

### Issue: 401 Unauthorized from API Gateway
**Solution**:
- Verify API Gateway has Cognito Authorizer configured
- Check token format in request: `Authorization: Bearer <token>`
- Verify User Pool ID matches in authorizer configuration
- Check authorizer token source is set to `Authorization`

### Issue: Token refresh not working
**Solution**:
- Verify refresh token is stored: `useAuthStore.getState().refreshToken`
- Check Cognito User Pool Client settings:
  - "Enable token revocation" is enabled
  - Refresh token expiration is properly set (default 30 days)

## Password Requirements

Default Cognito password policy requires:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

Example valid password: `MyPassword123!`

## Building for Production

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## 🚢 Deployment

### Platform-Specific Deployment

#### Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project in Vercel
3. Go to **Project Settings** → **Environment Variables**
4. Add all required variables
5. Deploy

```bash
# Or use Vercel CLI
npm install -g vercel
vercel env add VITE_COGNITO_USER_POOL_ID production
vercel env add VITE_COGNITO_CLIENT_ID production
vercel env add VITE_COGNITO_REGION production
vercel env add VITE_API_BASE_URL production
vercel --prod
```

#### Netlify

1. Push your code to Git repository
2. Import project in Netlify
3. Go to **Site Settings** → **Build & Deploy** → **Environment**
4. Add environment variables
5. Deploy

```bash
# Or use Netlify CLI
npm install -g netlify-cli
netlify env:set VITE_COGNITO_USER_POOL_ID your-value
netlify env:set VITE_COGNITO_CLIENT_ID your-value
netlify env:set VITE_COGNITO_REGION your-value
netlify env:set VITE_API_BASE_URL your-value
netlify deploy --prod
```

#### AWS Amplify Hosting

1. Connect your Git repository
2. Go to **App Settings** → **Environment Variables**
3. Add all required variables
4. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
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
5. Deploy

#### Docker Production

Create `.env.production` (DO NOT commit):
```env
VITE_COGNITO_USER_POOL_ID=your-production-user-pool-id
VITE_COGNITO_CLIENT_ID=your-production-client-id
VITE_COGNITO_REGION=your-aws-region
VITE_API_BASE_URL=https://your-api-gateway.amazonaws.com/prod
```

Build and run:
```bash
# Build with production env
docker build \
  --build-arg VITE_COGNITO_USER_POOL_ID=${VITE_COGNITO_USER_POOL_ID} \
  --build-arg VITE_COGNITO_CLIENT_ID=${VITE_COGNITO_CLIENT_ID} \
  --build-arg VITE_COGNITO_REGION=${VITE_COGNITO_REGION} \
  --build-arg VITE_API_BASE_URL=${VITE_API_BASE_URL} \
  -t student-management-system:prod .

# Run container
docker run -p 3000:3000 student-management-system:prod
```

#### AWS ECS/Fargate

1. Store secrets in **AWS Secrets Manager**:
```bash
aws secretsmanager create-secret \
  --name student-management-system/cognito \
  --secret-string '{
    "userPoolId":"your-user-pool-id",
    "clientId":"your-client-id",
    "region":"your-region",
    "apiBaseUrl":"https://your-api-gateway.amazonaws.com/prod"
  }'
```

2. Reference in ECS task definition:
```json
{
  "containerDefinitions": [{
    "name": "app",
    "image": "your-image:latest",
    "secrets": [
      {
        "name": "VITE_COGNITO_USER_POOL_ID",
        "valueFrom": "arn:aws:secretsmanager:region:account:secret:student-management-system/cognito:userPoolId::"
      },
      {
        "name": "VITE_COGNITO_CLIENT_ID",
        "valueFrom": "arn:aws:secretsmanager:region:account:secret:student-management-system/cognito:clientId::"
      }
    ]
  }]
}
```

### Security Checklist for Production

Before deploying to production:

- [ ] All credentials stored as environment variables (not hardcoded)
- [ ] `.env` file is in `.gitignore`
- [ ] No secrets committed to Git history
- [ ] HTTPS enabled on hosting platform
- [ ] CORS configured properly in API Gateway
- [ ] Cognito User Pool has proper password policy
- [ ] MFA enabled for admin users
- [ ] CloudWatch logs enabled for monitoring
- [ ] Rate limiting configured in API Gateway
- [ ] Error messages don't expose sensitive information

## 📊 AWS Services Integration

### Currently Implemented
- ✅ **Cognito** - User authentication
- ✅ **Amplify** - Frontend hosting & authentication

### To Be Implemented
- ⏳ **S3** - File storage (avatars, assignments, submissions)
- ⏳ **Lambda** - Backend API functions
- ⏳ **DynamoDB** - Database tables
- ⏳ **AppSync** - Real-time chat & notifications
- ⏳ **SES** - Email notifications
- ⏳ **EventBridge** - Scheduled reminders
- ⏳ **Personalize** - Ranking recommendations
- ⏳ **CloudWatch** - Monitoring & logs

## Environment Variables

All sensitive configuration is managed through environment variables in `.env` file:

```env
# AWS Cognito Authentication
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_REGION=your-region

# AWS API Gateway
VITE_API_BASE_URL=https://your-api-gateway-url.execute-api.your-region.amazonaws.com/prod

# Google OAuth (Optional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Security Recommendations

For production deployment:

1. **Never commit `.env` file** to version control (already in `.gitignore`)
2. **Set environment variables** in your hosting platform:
   - **Vercel**: Project Settings → Environment Variables
   - **Netlify**: Site Settings → Build & Deploy → Environment
   - **AWS Amplify**: App Settings → Environment Variables
   - **Docker**: Use `--env-file` or pass via `-e` flags
3. **Use secure secret management** for production:
   - AWS Secrets Manager
   - AWS Systems Manager Parameter Store
   - HashiCorp Vault
4. **Rotate credentials** regularly
5. **Enable MFA** for Cognito users in production
6. **Use HTTPS only** for all communications

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router 7, TypeScript
- **Styling**: TailwindCSS 4
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Authentication**: AWS Amplify, AWS Cognito
- **Backend**: AWS API Gateway, AWS Lambda
- **Database**: AWS DynamoDB
- **Storage**: AWS S3
- **Real-time**: AWS AppSync
- **Email**: AWS SES
- **Build Tool**: Vite

## 📂 Key Files

- `app/config/amplify-config.ts` - Amplify and Cognito configuration
- `app/store/authStore.ts` - Authentication state management
- `app/utils/axios.ts` - Axios with automatic token handling
- `app/routes.ts` - Route definitions with role-based access
- `app/components/` - Reusable components (Chat, TableList, etc.)
- `.env.example` - Environment variables template

## 🔒 Security Best Practices

- ✅ Tokens stored securely in Zustand + localStorage (browser encrypted)
- ✅ Automatic token refresh before expiration
- ✅ Secure HTTPS communication with AWS services
- ✅ Cognito handles password hashing and security
- ✅ API Gateway validates every request with Cognito Authorizer
- ✅ No sensitive data in frontend code
- ✅ Environment variables for all credentials
- ✅ Role-based access control

## 📚 References

- [AWS Amplify Documentation](https://docs.amplify.aws/lib/auth/getting-started/q/platform/js/)
- [AWS Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [API Gateway Cognito Authorizer](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-integrate-with-cognito.html)
- [React Router Documentation](https://reactrouter.com/)
- [AWS AppSync](https://docs.aws.amazon.com/appsync/)
- [AWS S3](https://docs.aws.amazon.com/s3/)

## 📄 License

This project is licensed under the MIT License.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using React Router, AWS Amplify, AWS Cognito, and AWS Serverless Services.
