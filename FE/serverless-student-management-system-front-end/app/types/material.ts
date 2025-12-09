// ============================================
// MATERIAL TYPES
// ============================================

export interface MaterialDTO {
    id: number
    class_id: number
    title: string
    file_url?: string
    file_type?: string
    uploaded_by: number
    uploaded_at: string
    description?: string
}

export interface CreateMaterialRequest {
    class_id: number
    title: string
    file?: File
    description?: string
}
