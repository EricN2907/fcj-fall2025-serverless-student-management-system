import api from '../utils/axios'
import type { ChatClass, ChatMessage, SendMessagePayload } from '../types'

// Re-export types for convenience
export type { ChatClass, ChatMessage, SendMessagePayload }

// ============================================
// API FUNCTIONS
// ============================================

/**
 * GET /chat/my-classes
 * Lấy danh sách lớp + unread_count + last_message preview
 */
export const fetchMyClasses = async (): Promise<ChatClass[]> => {
  const { data } = await api.get('/chat/my-classes')
  return data.classes || data || []
}

/**
 * GET /chat/messages/{class_id}?limit=30&before_id=xxx
 * Lấy tin nhắn với pagination
 */
export const fetchMessages = async (
  classId: number,
  beforeId?: number
): Promise<ChatMessage[]> => {
  const params = new URLSearchParams({ limit: '30' })
  if (beforeId) params.append('before_id', String(beforeId))
  const { data } = await api.get(`/chat/messages/${classId}?${params}`)
  return data.messages || data || []
}

/**
 * POST /chat/messages
 * Gửi tin nhắn mới
 */
export const sendMessage = async (payload: SendMessagePayload): Promise<ChatMessage> => {
  const { data } = await api.post('/chat/messages', payload)
  return data
}
