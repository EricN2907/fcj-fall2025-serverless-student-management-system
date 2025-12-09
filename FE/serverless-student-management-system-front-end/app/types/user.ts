// ============================================
// USER & AUTHENTICATION TYPES
// ============================================

export type UserRole = 'Student' | 'Lecturer' | 'Admin'

export interface User {
    id: string
    username: string
    email: string
    fullName: string
    role: UserRole
    token: string
    avatar?: string
    phone?: string
    isEmailVerified: boolean
    lastLogin: string
    loginMethod: 'normal' | 'google' | 'cognito'
    createdAt: string
    updatedAt: string
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface LoginResponse {
    id?: string
    userId?: string
    username?: string
    email?: string
    fullName?: string
    fullname?: string
    role?: UserRole | string
    token?: string
    accessToken?: string
    avatar?: string
    phone?: string
    enabled?: boolean
    isEmailVerified?: boolean
    createAt?: string
    createdAt?: string
    updatedAt?: string
}

// Register API types
export interface RegisterRequest {
    email: string
    password: string
    role_id: number // 1=Admin, 2=Lecturer, 3=Student
    codeUser: string // Mã giáo viên hoặc sinh viên
    date_of_birth: string // Format: YYYY-MM-DD
    name?: string // Họ tên (optional)
    status?: number // 0=Inactive, 1=Active (optional)
}

export interface RegisterResponse {
    message: string
    userId: number
}

// Profile
export interface ProfileDTO {
    id: string
    name: string
    email: string
    dateOfBirth?: string
    role: string
    codeUser: string
    avatar?: string
    phone?: string
    address?: string
}

export interface UpdateProfileRequest {
    name?: string
    dateOfBirth?: string
    avatarFile?: File
}

export interface ChangePasswordRequest {
    old_password: string
    new_password: string
    confirm_password: string
}
