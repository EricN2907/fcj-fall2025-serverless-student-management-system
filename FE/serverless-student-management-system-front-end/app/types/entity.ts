// ============================================
// DATABASE ENTITY TYPES
// ============================================

// User Management (Admin CRUD)
export interface UserEntity {
    id: number
    codeUser: string
    name: string
    email: string
    role_id: number
    date_of_birth?: string
    status: number // 0: Inactive, 1: Active
    createdAt?: string
    updatedAt?: string
}

export interface Subject {
    id: number
    codeSubject: string
    name: string
    credits: number
    department: string
    description?: string
    status: number // 0: Đóng, 1: Đang mở
    created_at?: string
    updated_at?: string
}

// Subject API types
export interface CreateSubjectRequest {
    codeSubject: string // required, unique
    name: string // required
    credits: number // required
    description?: string // optional
    department?: string // optional
    status?: number // default 1
}

export interface SubjectDTO {
    id: number
    codeSubject: string
    name: string
    credits: number
    description?: string
    department?: string
    status: number
    created_at: string
    updated_at: string
}

export interface Class {
    id: number
    classCode: string
    subjectId: number
    subject_id?: number
    subjectName?: string
    lecturerId?: number
    teacher_id?: number
    lecturerName?: string
    semester: string
    year?: number
    academic_year?: string
    name?: string
    password?: string
    student_count?: number
    schedule?: string
    room?: string
    capacity?: number
    enrolled?: number
    description?: string
    status: number // 0: Đóng, 1: Đang mở
}

export interface Assignment {
    id: number
    classId: number
    title: string
    description?: string
    dueDate: string
    totalPoints: number
    status: number // 0: Draft, 1: Published
}

export interface Grade {
    id: number
    studentId: number
    assignmentId: number
    score: number
    feedback?: string
    gradedAt?: string
}

export interface Notification {
    id: number
    title: string
    content: string
    type: 'info' | 'warning' | 'success' | 'error'
    senderId: number
    recipientType: 'all' | 'student' | 'lecturer' | 'admin'
    recipientIds?: number[]
    createdAt: string
    isRead?: boolean
}
