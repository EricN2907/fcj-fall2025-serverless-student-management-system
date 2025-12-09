// ============================================
// STUDENT CALENDAR TYPES
// ============================================

export type CalendarAssignmentType = 'homework' | 'project' | 'midterm' | 'final'

export interface CalendarAssignment {
    id: number
    title: string
    class_id: number
    class_name: string
    subject_name: string
    type: CalendarAssignmentType
    weight: number
    deadline: string // ISO datetime
    description?: string
    is_submitted: boolean
    is_overdue?: boolean
}
