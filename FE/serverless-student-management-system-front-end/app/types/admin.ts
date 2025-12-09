// ============================================
// ADMIN API TYPES
// ============================================

// User Management (Admin)
export interface AdminUserDTO {
    id: string
    name: string
    email: string
    codeUser: string
    role_id: number
    status: number
    date_of_birth?: string
    createdAt?: string
    updatedAt?: string
}

export interface CreateUserRequest {
    email: string
    password: string
    name: string
    codeUser: string
    role_id: number
    date_of_birth?: string
    status?: number
}

export interface UpdateUserRequest {
    name?: string
    email?: string
    codeUser?: string
    role_id?: number
    date_of_birth?: string
    status?: number
}

// Class Management (Admin)
export interface AdminClassDTO {
    id: string
    name: string
    subject_id: string
    teacher_id: string
    semester: string
    academic_year: string
    description?: string
    password?: string
    status: number
    student_count?: number
    subject_name?: string
    teacher_name?: string
    created_at?: string
    updated_at?: string
}

export interface AdminClassDisplay {
    id: string
    classCode: string
    name: string
    subjectName: string
    lecturerName: string
    semester: string
    academicYear: string
    studentCount: number
    status: number
}

export interface AdminLecturerDTO {
    id: string
    name?: string
    email?: string
    codeUser?: string
}

export interface AdminSubjectDTO {
    id: string
    name: string
    codeSubject: string
    credits?: number
}

// Audit Logs
export interface AuditLogDTO {
    id: string
    userId: string
    action: string
    details: string
    timestamp: string
}

export interface ActivityLog {
    id: string
    userId: string
    action: string
    details: string
    timestamp: string
}

// Analytics
export interface AnalyticsRankingDTO {
    student_id: number
    rank: number
    score: number
    student_name?: string
    student_code?: string
}

export interface AnalyticsClassInfo {
    id: number
    name: string
    subject_name?: string
}

// Dashboard Stats
export interface AdminDashboardStats {
    totalUsers: number
    totalStudents: number
    totalLecturers: number
    totalClasses: number
    totalSubjects: number
    activeClasses: number
}

export interface StatCardProps {
    title: string
    value: string | number
    icon?: React.ComponentType
    color?: string
}
