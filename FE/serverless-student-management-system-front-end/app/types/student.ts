// ============================================
// STUDENT API TYPES
// ============================================

import type { AssignmentType, SubmissionStatus } from './assignment'

// Student enrolled class
export interface StudentEnrolledClassDTO {
    class_id: string
    name: string
    student_count: number
    status: number
    subjectName: string
    lecturerName: string
    semester?: string
    academic_year?: string
    description?: string
    enrolled_at?: string
}

export interface EnrolledClassesResponse {
    results: StudentEnrolledClassDTO[]
}

export interface EnrollUnenrollRequest {
    class_id: string
    action: 'enroll' | 'unenroll'
    studentId: string
    password?: string // Required only for enroll action
}

export interface EnrollUnenrollResponse {
    message: string
}

// Student Assignment Submission
export interface StudentSubmitAssignmentRequest {
    assignment_id: number
    file?: File
}

export interface StudentSubmissionDTO {
    id: number
    assignment_id: number
    student_id: number
    file_url?: string
    file_name?: string
    submitted_at: string
    score?: number
    feedback?: string
    status: SubmissionStatus
    graded_at?: string
}

// Student Assignment (for viewing)
export interface StudentAssignmentDTO {
    id: number
    class_id: number
    class_name?: string
    title: string
    description: string
    type: AssignmentType
    weight: number
    deadline: string
    max_score: number
    is_published: boolean
    submission?: StudentSubmissionDTO // Student's own submission
    created_at: string
    updated_at: string
}
