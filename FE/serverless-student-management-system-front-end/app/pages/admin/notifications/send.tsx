import React, { useState, useEffect } from 'react'
import { Send, Clock, AlertCircle, Loader2, BookOpen, Building } from 'lucide-react'
import api from '../../../utils/axios'
import { toaster } from '../../../components/ui/toaster'

// Class interface
interface ClassDTO {
  id: string
  name: string
  status?: number
}

// User/Lecturer interface
interface UserDTO {
  id: string
  name?: string
  fullName?: string
}

const SendNotificationPage: React.FC = () => {
  // Type: 'system' hoặc 'class'
  const [notificationType, setNotificationType] = useState<'system' | 'class'>('system')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // For class type
  const [classId, setClassId] = useState('')
  const [userId, setUserId] = useState('')
  const [classes, setClasses] = useState<ClassDTO[]>([])
  const [lecturers, setLecturers] = useState<UserDTO[]>([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingLecturers, setLoadingLecturers] = useState(false)

  // Load classes khi chọn type = class
  useEffect(() => {
    if (notificationType === 'class') {
      fetchClasses()
      fetchLecturers()
    }
  }, [notificationType])

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true)
      const response = await api.get('/api/admin/classes')
      console.log('=== CLASSES API RESPONSE ===', response.data)

      let classData: any[] = []
      if (Array.isArray(response.data)) {
        classData = response.data
      } else if (response.data?.results) {
        classData = response.data.results
      } else if (response.data?.data) {
        classData = response.data.data
      }

      // Chỉ lấy classes đang active
      const transformedClasses: ClassDTO[] = classData
        .filter((c: any) => c.status === 1 || c.status === undefined)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          status: c.status
        }))

      setClasses(transformedClasses)
    } catch (error) {
      console.error('Error fetching classes:', error)
      toaster.create({
        title: 'Lỗi',
        description: 'Không thể tải danh sách lớp học',
        type: 'error'
      })
    } finally {
      setLoadingClasses(false)
    }
  }

  const fetchLecturers = async () => {
    try {
      setLoadingLecturers(true)
      const response = await api.get('/api/admin/users', { params: { role_id: 2 } })
      console.log('=== LECTURERS API RESPONSE ===', response.data)

      let lecturerData: any[] = []
      if (Array.isArray(response.data)) {
        lecturerData = response.data
      } else if (response.data?.results) {
        lecturerData = response.data.results
      } else if (response.data?.data) {
        lecturerData = response.data.data
      }

      const transformedLecturers: UserDTO[] = lecturerData.map((l: any) => ({
        id: l.id || l.codeUser,
        name: l.name || l.fullName || 'Unknown',
        fullName: l.fullName || l.name || 'Unknown'
      }))

      setLecturers(transformedLecturers)
    } catch (error) {
      console.error('Error fetching lecturers:', error)
    } finally {
      setLoadingLecturers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!title.trim() || !content.trim()) {
      toaster.create({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ tiêu đề và nội dung!',
        type: 'error'
      })
      return
    }

    // Validation cho type class
    if (notificationType === 'class') {
      if (!classId) {
        toaster.create({
          title: 'Lỗi',
          description: 'Vui lòng chọn lớp học!',
          type: 'error'
        })
        return
      }
      if (!userId) {
        toaster.create({
          title: 'Lỗi',
          description: 'Vui lòng chọn giảng viên gửi thông báo!',
          type: 'error'
        })
        return
      }
    }

    setIsLoading(true)
    try {
      // Prepare payload theo API spec
      // API yêu cầu: { userId, title, content, type, classId }
      const payload: {
        userId: string
        title: string
        content: string
        type: string
        classId?: string
      } = {
        userId: notificationType === 'class' ? userId : 'ADMIN', // System notification dùng userId = 'ADMIN'
        title: title.trim(),
        content: content.trim(),
        type: notificationType
      }

      // Chỉ gửi classId khi type = class
      if (notificationType === 'class') {
        payload.classId = classId
      }

      console.log('=== SENDING NOTIFICATION ===')
      console.log('Payload:', JSON.stringify(payload, null, 2))

      // === GỌI API POST /api/admin/notifications ===
      const response = await api.post('/api/admin/notifications', payload)

      console.log('Notification response:', response.data)

      toaster.create({
        title: 'Thành công',
        description: 'Đã gửi thông báo thành công!',
        type: 'success'
      })

      // Reset form
      setTitle('')
      setContent('')
      setClassId('')
      setUserId('')
    } catch (error: any) {
      console.error('Error sending notification:', error)
      toaster.create({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể gửi thông báo. Vui lòng thử lại!',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get selected class name for preview
  const selectedClassName = classes.find((c) => c.id === classId)?.name || ''
  const selectedLecturerName = lecturers.find((l) => l.id === userId)?.name || ''

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-slate-800'>Gửi thông báo</h1>
        <p className='text-slate-500 mt-1'>Tạo và gửi thông báo đến sinh viên, giảng viên hoặc lớp học.</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Form Section */}
        <div className='lg:col-span-2'>
          <form
            onSubmit={handleSubmit}
            className='bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6'
          >
            {/* Notification Type Selection */}
            <div>
              <label className='block text-sm font-bold text-slate-700 mb-2'>Loại thông báo</label>
              <div className='grid grid-cols-2 gap-3'>
                <button
                  type='button'
                  onClick={() => {
                    setNotificationType('system')
                    setClassId('')
                    setUserId('')
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                    notificationType === 'system'
                      ? 'border-[#dd7323] bg-orange-50 text-[#dd7323]'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Building size={24} className='mb-2' />
                  <span className='text-sm font-semibold'>Hệ thống</span>
                  <span className='text-xs text-slate-400 mt-1'>Gửi toàn trường</span>
                </button>
                <button
                  type='button'
                  onClick={() => setNotificationType('class')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                    notificationType === 'class'
                      ? 'border-[#dd7323] bg-orange-50 text-[#dd7323]'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen size={24} className='mb-2' />
                  <span className='text-sm font-semibold'>Lớp học</span>
                  <span className='text-xs text-slate-400 mt-1'>Gửi theo lớp</span>
                </button>
              </div>
            </div>

            {/* Class Type - Class & User Selection */}
            {notificationType === 'class' && (
              <>
                {/* Class Selection */}
                <div>
                  <label className='block text-sm font-bold text-slate-700 mb-2'>
                    Chọn lớp học <span className='text-red-500'>*</span>
                  </label>
                  <select
                    required
                    disabled={loadingClasses}
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className='w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <option value=''>-- Chọn lớp học --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.id} - {cls.name}
                      </option>
                    ))}
                  </select>
                  {loadingClasses && (
                    <p className='text-xs text-slate-500 mt-1 flex items-center gap-1'>
                      <Loader2 size={12} className='animate-spin' />
                      Đang tải lớp học...
                    </p>
                  )}
                </div>

                {/* User (Lecturer) Selection */}
                <div>
                  <label className='block text-sm font-bold text-slate-700 mb-2'>
                    Giảng viên gửi thông báo <span className='text-red-500'>*</span>
                  </label>
                  <select
                    required
                    disabled={loadingLecturers}
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className='w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <option value=''>-- Chọn giảng viên --</option>
                    {lecturers.map((lecturer) => (
                      <option key={lecturer.id} value={lecturer.id}>
                        {lecturer.id} - {lecturer.name || lecturer.fullName}
                      </option>
                    ))}
                  </select>
                  {loadingLecturers && (
                    <p className='text-xs text-slate-500 mt-1 flex items-center gap-1'>
                      <Loader2 size={12} className='animate-spin' />
                      Đang tải giảng viên...
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Title */}
            <div>
              <label className='block text-sm font-bold text-slate-700 mb-2'>Tiêu đề thông báo</label>
              <input
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Ví dụ: Lịch nghỉ lễ...'
                className='w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all text-slate-700'
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className='block text-sm font-bold text-slate-700 mb-2'>Nội dung chi tiết</label>
              <textarea
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder='Nhập nội dung thông báo...'
                className='w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all text-slate-700 resize-none'
                required
              />
            </div>

            {/* Action Buttons */}
            <div className='pt-4 flex items-center justify-end gap-3 border-t border-slate-100'>
              <button
                type='button'
                onClick={() => {
                  setTitle('')
                  setContent('')
                  setClassId('')
                  setUserId('')
                }}
                className='px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors'
              >
                Hủy bỏ
              </button>
              <button
                type='submit'
                disabled={isLoading}
                className='flex items-center gap-2 px-6 py-2.5 bg-[#dd7323] text-white font-bold rounded-xl hover:bg-[#c2621a] transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className='animate-spin' />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Gửi ngay</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <div>
          <h3 className='text-sm font-bold text-slate-500 uppercase tracking-wider mb-4'>Xem trước</h3>
          <div className='bg-white rounded-2xl shadow-sm border border-slate-100 p-5 relative overflow-hidden'>
            <div
              className={`absolute top-0 left-0 w-1 h-full ${notificationType === 'class' ? 'bg-blue-500' : 'bg-[#dd7323]'}`}
            ></div>
            <div className='flex justify-between items-start mb-2'>
              <div
                className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${notificationType === 'class' ? 'text-blue-500' : 'text-[#dd7323]'}`}
              >
                <AlertCircle size={14} />
                <span>{notificationType === 'class' ? 'Thông báo lớp học' : 'Thông báo hệ thống'}</span>
              </div>
              <span className='text-xs text-slate-400'>Vừa xong</span>
            </div>
            <h4 className='font-bold text-slate-800 text-lg mb-2'>{title || 'Tiêu đề thông báo...'}</h4>
            <p className='text-sm text-slate-600 leading-relaxed whitespace-pre-wrap'>
              {content || 'Nội dung thông báo sẽ hiển thị ở đây...'}
            </p>

            {/* Show class info if type is class */}
            {notificationType === 'class' && selectedClassName && (
              <div className='mt-3 px-3 py-2 bg-blue-50 rounded-lg'>
                <span className='text-xs text-blue-600 font-medium'>Lớp: {selectedClassName}</span>
              </div>
            )}

            <div className='mt-4 pt-4 border-t border-slate-100 flex items-center gap-2'>
              <div className='w-6 h-6 rounded-full bg-[#293548] flex items-center justify-center text-white text-[10px] font-bold'>
                {notificationType === 'class' && selectedLecturerName ? selectedLecturerName.charAt(0) : 'A'}
              </div>
              <span className='text-xs text-slate-500 font-medium'>
                Gửi bởi {notificationType === 'class' && selectedLecturerName ? selectedLecturerName : 'Ban Đào tạo'}
              </span>
            </div>
          </div>

          <div className='mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100'>
            <h4 className='flex items-center gap-2 text-sm font-bold text-blue-700 mb-2'>
              <Clock size={16} />
              Lưu ý
            </h4>
            <p className='text-xs text-blue-600/80 leading-relaxed'>
              Hệ thống sẽ gửi thông báo đẩy (push notification) đến thiết bị di động của người dùng ngay lập tức.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SendNotificationPage
