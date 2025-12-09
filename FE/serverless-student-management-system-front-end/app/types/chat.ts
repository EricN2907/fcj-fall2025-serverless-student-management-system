// ============================================
// CHAT & MESSAGE TYPES
// ============================================

// Chat Message (Legacy)
export interface MessageDTO {
    id: number
    class_id: number
    sender_id: number
    sender_name?: string
    sender_avatar?: string
    sender_role?: string
    parent_id: number | null
    content: string
    type: 'text' | 'attachment'
    attachment_url?: string
    reactions: Record<string, string> // { user_id: 'like' | 'tim' }
    timestamp: string
    replies?: MessageDTO[]
}

export interface CreateMessageRequest {
    class_id: number
    content?: string
    parent_id?: number | null
    type: 'text' | 'attachment'
    attachment?: File
}

export interface UpdateReactionRequest {
    action: 'add' | 'remove'
    type: 'like' | 'tim'
}

// Chat Messages (quick chat in class)
export interface ChatMessageDTO {
    id: number
    class_id: number
    sender_id: number
    sender_name?: string
    sender_avatar?: string
    sender_role?: string
    content: string
    attachment_url?: string
    created_at: string
}

export interface CreateChatMessageRequest {
    class_id: number
    content: string
    attachment?: File
}

// Chat Class
export interface ChatClass {
    id: number
    class_name: string
    subject_name: string
    unread_count: number
    last_message?: {
        content: string
        sender_name: string
        created_at: string
    }
}

export interface ChatMessage {
    id: number
    class_id: number
    sender_id: string
    sender_name: string
    sender_avatar?: string
    content: string
    created_at: string
}

export interface SendMessagePayload {
    class_id: number
    content: string
}
