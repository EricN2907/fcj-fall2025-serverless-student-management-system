// ============================================
// GRADE TYPES
// ============================================

// Grade Column
export interface GradeColumnDTO {
    id: number
    class_id: number
    name: string
    percentage: number
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface CreateGradeColumnRequest {
    class_id: number
    name: string
    percentage: number
    is_active?: boolean
}

export interface UpdateGradeColumnRequest {
    name?: string
    percentage?: number
    is_active?: boolean
}

// Grade
export interface GradeDTO {
    id: number
    class_id: number
    student_id: number
    column_id: number
    value: number
    created_at: string
    updated_at: string
    student_name?: string
    column_name?: string
}

export interface CreateGradeRequest {
    class_id: number
    student_id: number
    column_id: number
    value: number
}

export interface UpdateGradeRequest {
    value: number
}

// Ranking
export interface RankingDTO {
    student_id: number
    student_name?: string
    student_code?: string
    avatar?: string
    rank: number
    score: number
    recommendations?: string
    grades?: GradeDTO[]
}
