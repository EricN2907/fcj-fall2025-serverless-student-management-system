// ============================================
// NOTIFICATION TYPES
// ============================================

export interface SendNotificationRequest {
    class_id: number
    title: string
    content: string
}

export interface NotificationDTO {
    id: number
    class_id?: number
    class_name?: string
    title: string
    content: string
    sender_id: number
    sender_name?: string
    created_at: string
    type: 'sent' | 'received'
    is_read?: boolean
}

export interface NotificationHistory { }
export interface NotificationRequest { }
