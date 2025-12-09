// ============================================
// ASSIGNMENT TYPES
// ============================================

export type AssignmentType = 'homework' | 'project' | 'midterm' | 'final'
export type SubmissionStatus = 'on_time' | 'late' | 'missing'

export interface AssignmentDTO {
  id: number
  class_id: number
  title: string
  description: string
  type: AssignmentType
  weight: number // decimal: homework=0.20, project=0.30, midterm=0.25, final=0.25
  deadline: string // datetime
  max_score: number // default 10.00
  is_published: boolean
  submission_count?: number // computed from assignment_submissions
  created_at: string
  updated_at: string
}

export interface CreateAssignmentRequest {
  class_id: string | number
  title: string
  description?: string
  type: AssignmentType
  deadline: string
  max_score?: number // default 10
  weight?: number // Trọng số (0-1), VD: 0.3 = 30%
  is_published?: boolean
  files?: File[] // for assignment_materials (optional)
}

export interface UpdateAssignmentRequest {
  title?: string
  description?: string
  type?: AssignmentType
  deadline?: string
  max_score?: number
  is_published?: boolean
}

// Assignment Materials
export interface AssignmentMaterialDTO {
  id: number
  assignment_id: number
  file_url: string
  file_name: string
  file_type: string
  uploaded_by: number
  uploaded_at: string
}

// Assignment Submissions (Student grades)
export interface AssignmentSubmissionDTO {
  id: number
  assignment_id: number
  student_id: number
  student_name?: string
  student_code?: string
  file_url?: string
  file_name?: string
  submitted_at: string
  score?: number
  feedback?: string
  status: SubmissionStatus
  graded_at?: string
  created_at: string
  updated_at: string
}

export interface GradeSubmissionRequest {
  score: number
  feedback?: string
}

// Weight constants for auto-calculation
export const ASSIGNMENT_WEIGHTS: Record<AssignmentType, number> = {
  homework: 0.2,
  project: 0.3,
  midterm: 0.25,
  final: 0.25
}

// Assignment form data (used in CreateAssignmentModal)
export interface AssignmentFormData {
  title: string
  description: string
  type: AssignmentType
  deadline: string
  max_score: number
  weight?: number // Trọng số (0-1), VD: 0.3 = 30%
  is_published: boolean
  files: File[]
}

// Bulk grade update request
export interface BulkGradeUpdateRequest {
  assignment_id: number
  grades: Array<{
    submission_id: number
    score: number
    feedback?: string
  }>
}
