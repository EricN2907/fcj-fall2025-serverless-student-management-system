'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, Trash2, Loader2 } from 'lucide-react'
import api from '../../utils/axios'

// API response format from BE
interface NotificationFromAPI {
  id: string
  title: string
  content: string
  type: string // "SYSTEM_ALERT", "INFO", "CLASS", etc.
  isRead: boolean
  createdAt: string
  className?: string
  classId?: string
}

interface Notification {
  id: string
  title: string
  content: string
  type: 'system' | 'class'
  class_id?: string
  className?: string
  sent_at: string
  read: boolean
}

// Map BE type to UI type
const mapNotificationType = (type?: string): 'system' | 'class' => {
  switch (type?.toUpperCase()) {
    case 'SYSTEM_ALERT':
    case 'SYSTEM':
      return 'system'
    case 'CLASS':
    case 'INFO':
    default:
      return 'class'
  }
}

export default function NotificationsReceiveRoute() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'system' | 'class'>('all')

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      // Gọi cả 2 API: system và class notifications
      const [systemResponse, classResponse] = await Promise.all([
        api.get('/api/student/notifications', { params: { type: 'system' } }),
        api.get('/api/student/notifications', { params: { type: 'class' } })
      ])

      console.log('System notifications:', systemResponse.data)
      console.log('Class notifications:', classResponse.data)

      // BE trả về { data: [...], count, message, status }
      const systemNotis = (systemResponse.data as any)?.data || systemResponse.data?.results || []
      const classNotis = (classResponse.data as any)?.data || classResponse.data?.results || []

      // Combine and transform
      const allNotifications = [...systemNotis, ...classNotis]

      const mappedNotifications: Notification[] = allNotifications.map((n: NotificationFromAPI) => ({
        id: String(n.id),
        title: n.title || 'Thông báo',
        content: n.content || '',
        type: mapNotificationType(n.type),
        class_id: n.classId,
        className: n.className,
        sent_at: n.createdAt || new Date().toISOString(),
        read: n.isRead ?? false
      }))

      setNotifications(mappedNotifications)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleDelete = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(notifications.filter((n) => n.id !== id))
      // API call (if exists)
      await api.delete(`/api/notifications/${id}`).catch(() => {})
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
      // API: PATCH /api/notifications/:id/read
      await api.patch(`/api/notifications/${id}/read`).catch(() => {})
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const getFilteredNotifications = () => {
    let filtered = notifications

    if (filter !== 'all') {
      filtered = notifications.filter((n) => n.type === filter)
    }

    return filtered.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system':
        return '⚙️'
      case 'class':
        return '📚'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'system':
        return 'border-l-slate-400 bg-slate-50'
      case 'class':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-slate-400 bg-slate-50'
    }
  }

  const filteredNotifications = getFilteredNotifications()
  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 size={40} className='text-[#dd7323] animate-spin mx-auto mb-3' />
          <p className='text-slate-600'>Đang tải thông báo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full py-8 px-4 sm:px-6 lg:px-8 bg-slate-50'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900'>Thông báo</h1>
          <p className='text-slate-600 mt-1'>
            {unreadCount} thông báo chưa đọc {unreadCount > 0 && `(${unreadCount})`}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className='flex gap-2 mb-6 overflow-x-auto pb-2'>
          {(['all', 'system', 'class'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === type
                  ? 'bg-[#dd7323] text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {type === 'all' ? 'Tất cả' : type === 'system' ? 'Hệ thống' : 'Lớp học'}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className='space-y-3'>
          {filteredNotifications.length === 0 ? (
            <div className='bg-white rounded-xl border border-slate-200 p-12 text-center'>
              <Bell size={48} className='mx-auto text-slate-300 mb-4' />
              <p className='text-slate-500'>Không có thông báo nào</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                className={`border-l-4 rounded-r-lg p-4 cursor-pointer transition-all hover:shadow-md ${getNotificationColor(notification.type)} ${
                  !notification.read ? 'shadow-sm' : ''
                }`}
              >
                <div className='flex items-start gap-4'>
                  <span className='text-3xl flex-shrink-0'>{getNotificationIcon(notification.type)}</span>

                  <div className='flex-1'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2'>
                          <h3 className={`font-semibold ${!notification.read ? 'text-slate-900' : 'text-slate-800'}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className='inline-block w-2 h-2 bg-[#dd7323] rounded-full'></span>
                          )}
                        </div>
                        <p className='text-slate-600 text-sm mt-1'>{notification.content}</p>

                        <div className='flex items-center justify-between mt-2'>
                          <div className='flex gap-2'>
                            {notification.className && (
                              <span className='text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded'>
                                {notification.className}
                              </span>
                            )}
                            <span className='text-xs text-slate-400'>
                              {new Date(notification.sent_at).toLocaleDateString('vi-VN')}{' '}
                              {new Date(notification.sent_at).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(notification.id)
                    }}
                    className='p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0'
                    title='Xóa thông báo'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
