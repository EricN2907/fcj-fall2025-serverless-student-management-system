// ============================================
// COMMON/SHARED TYPES
// ============================================

// Calendar Day (used in multiple calendar components)
export interface CalendarDay {
    date: Date
    isCurrentMonth: boolean
    isToday?: boolean
    hasEvents?: boolean
}

// Pagination
export interface PaginatedResponse<T> {
    results: T[]
    count: number
    page?: number
    pageSize?: number
    totalPages?: number
}

// API Response wrapper
export interface APIResponse<T> {
    data: T
    message?: string
    success?: boolean
}

// Generic list response
export interface ListResponse<T> {
    results: T[]
    count?: number
}

// Dashboard Stats (Student)
export interface StudentDashboardStats {
    enrolledClasses: number
    upcomingDeadlines: number
    completedAssignments: number
    averageScore: number
}

// Recent Notification (for dashboard)
export interface RecentNotification {
    id: string
    type: 'admin' | 'lecturer'
    title: string
    content: string
    createdAt: string
    isRead: boolean
}

// Class Info (simplified for dropdowns/selects)
export interface ClassInfo {
    id: number
    name: string
    subject_name?: string
    teacher_name?: string
}

// Class Option (for select components)
export interface ClassOption {
    id: number
    name: string
    subject_name?: string
}

// Subject Info (simplified)
export interface SubjectInfo {
    id: string
    name: string
    code?: string
}

// Subject with Classes (for course listing)
export interface SubjectWithClasses {
    id: string
    name: string
    code?: string
    classes: ClassInfo[]
    isLoading?: boolean
}

// File upload types
export interface FileUploadResult {
    url: string
    fileName: string
    fileType: string
    fileSize: number
}

// Error response
export interface ErrorResponse {
    message: string
    code?: string
    details?: Record<string, string[]>
}
