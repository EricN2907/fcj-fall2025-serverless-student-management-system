// ============================================
// CLASS MANAGEMENT TYPES
// ============================================

// Class Management
export interface ClassDTO {
    id: number
    subject_id: number
    name: string
    password?: string
    semester: string
    academic_year: string
    description?: string
    teacher_id: number
    student_count: number
    created_at: string
    updated_at: string
    status: number // 0: Inactive, 1: Active
    subject_name?: string
    teacher_name?: string
}

export interface CreateClassRequest {
    subject_id: number
    name: string
    password?: string
    semester: string
    academic_year: string
    description?: string
}

export interface UpdateClassRequest {
    name?: string
    password?: string
    semester?: string
    academic_year?: string
    description?: string
}

// Student in Class
export interface StudentDTO {
    id: number
    name: string
    email: string
    codeUser: string
    status: string // 'enrolled' | 'waitlist'
    avatar?: string
    date_of_birth?: string
    enrolled_at?: string
}

// Extended ClassDTO with subject info
export interface ClassDetailDTO extends ClassDTO {
    subject?: {
        id: number
        codeSubject: string
        name: string
        credits: number
        department?: string
    }
}

// Subject Assignment (for lecturer)
export interface SubjectAssignment {
    id: number
    subject_id: number
    lecturer_id: number
    subject_name: string
    subject_code: string
    assigned_at: string
}

export interface ClassReport { }
export interface LecturerClass { }
export interface ClassStudent { }
