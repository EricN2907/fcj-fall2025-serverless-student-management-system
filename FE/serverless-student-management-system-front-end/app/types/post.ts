// ============================================
// POST & COMMENT TYPES
// ============================================

// Post Types (Discussion posts - only lecturer creates)
export interface PostDTO {
    id: number
    class_id: number
    lecturer_id: number
    lecturer_name?: string
    lecturer_avatar?: string
    title: string
    content: string // supports markdown
    attachment_url?: string
    attachment_name?: string
    is_pinned: boolean
    like_count: number
    comment_count: number
    is_liked?: boolean // for current user
    created_at: string
    updated_at: string
}

export interface CreatePostRequest {
    class_id: number
    title: string
    content: string // markdown
    attachment?: File
    is_pinned?: boolean
}

export interface UpdatePostRequest {
    title?: string
    content?: string
    is_pinned?: boolean
}

// Post Comments (nested comments/replies)
export interface PostCommentDTO {
    id: number
    post_id: number
    sender_id: number
    sender_name?: string
    sender_avatar?: string
    sender_role?: string
    parent_id?: number
    content: string
    attachment_url?: string
    like_count: number
    is_liked?: boolean
    created_at: string
    replies?: PostCommentDTO[]
}

export interface CreateCommentRequest {
    post_id: number
    content: string
    parent_id?: number
    attachment?: File
}

// Post form data (used in CreatePostModal)
export interface PostFormData {
    title: string
    content: string
    is_pinned: boolean
    attachment?: File
}

export interface CreateClassPostRequest {
    class_id: number
    title: string
    content: string
    attachment?: File
    is_pinned?: boolean
}

export interface CreatePostCommentRequest {
    post_id: number
    content: string
    parent_id?: number
    attachment?: File
}
