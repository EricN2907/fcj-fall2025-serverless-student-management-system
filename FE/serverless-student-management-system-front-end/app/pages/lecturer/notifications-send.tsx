'use client'

import { useState, useEffect, useCallback } from 'react'
import { Send, Loader2, BookOpen, Users } from 'lucide-react'
import { Box, VStack, HStack, Text, Card, Spinner } from '@chakra-ui/react'
import PageHeader from '../../components/ui/PageHeader'
import { toaster } from '../../components/ui/toaster'
import { lecturerClassApi } from '../../services/lecturerApi'
import { fetchAuthSession } from '@aws-amplify/auth'

interface ClassDTO {
  id: string
  name: string
  subjectName?: string
  studentCount?: number
}

export default function LecturerNotificationsSendPage() {
  const [classes, setClasses] = useState<ClassDTO[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  // Lecturer chỉ gửi được thông báo lớp (type: "class"), Admin mới gửi được system
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch lecturer's classes - sử dụng lecturerClassApi với header đặc biệt
  const fetchClasses = useCallback(async () => {
    try {
      setLoadingClasses(true)
      // API này cần header đặc biệt (cả Authorization và user-idToken đều dùng idToken)
      const response = await lecturerClassApi.getClasses()
      console.log('Lecturer classes response:', response)

      // BE trả về { data: [...], count, message, status }
      let classData: any[] = []
      if (Array.isArray(response)) {
        classData = response
      } else if ((response as any)?.data) {
        classData = (response as any).data
      } else if ((response as any)?.results) {
        classData = (response as any).results
      }

      const transformedClasses: ClassDTO[] = classData.map((c: any) => ({
        id: c.id || c.classId || c.class_id,
        name: c.name || c.className || c.title,
        subjectName: c.subjectName || c.subject_name || '',
        studentCount: c.studentCount || c.student_count || 0
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
  }, [])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClassId) {
      toaster.create({
        title: 'Lỗi',
        description: 'Vui lòng chọn lớp học!',
        type: 'error'
      })
      return
    }

    if (!title.trim() || !content.trim()) {
      toaster.create({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ tiêu đề và nội dung!',
        type: 'error'
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Lấy idToken từ Cognito session
      const session = await fetchAuthSession()
      const idToken = session.tokens?.idToken?.toString()

      if (!idToken) {
        throw new Error('Không tìm thấy token xác thực')
      }

      // API: POST /api/lecturer/notifications/email
      // Body theo Swagger: { classId, title, content, type: "class" }
      // Lecturer chỉ gửi được type "class", Admin mới gửi được "system"
      const payload = {
        classId: selectedClassId,
        title: title.trim(),
        content: content.trim(),
        type: 'class' // Lecturer luôn gửi thông báo lớp
      }

      console.log('Sending notification:', payload)

      const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
      const response = await fetch(`${baseUrl}/api/lecturer/notifications/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
          'user-idToken': idToken
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Không thể gửi thông báo')
      }

      toaster.create({
        title: 'Thành công',
        description: 'Đã gửi thông báo đến sinh viên trong lớp!',
        type: 'success'
      })

      // Reset form
      setTitle('')
      setContent('')
      setSelectedClassId('')
    } catch (error: any) {
      console.error('Error sending notification:', error)
      toaster.create({
        title: 'Lỗi',
        description: error.message || 'Không thể gửi thông báo. Vui lòng thử lại!',
        type: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId)

  if (loadingClasses) {
    return (
      <Box minH='60vh' display='flex' alignItems='center' justifyContent='center'>
        <VStack gap={3}>
          <Spinner size='xl' color='#dd7323' />
          <Text color='gray.600'>Đang tải danh sách lớp...</Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box w='full' py={8} px={{ base: 4, sm: 6, lg: 8 }} bg='white' minH='100vh'>
      <Box maxW='4xl' mx='auto'>
        <PageHeader
          icon={Send}
          title='Gửi thông báo'
          subtitle='Gửi thông báo đến toàn bộ sinh viên trong lớp (App + Email)'
        />

        <Box px={6}>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* Form */}
            <div className='lg:col-span-2'>
              <form
                onSubmit={handleSubmit}
                className='bg-white rounded-2xl shadow-sm border border-orange-100 p-6 space-y-6'
              >
                {/* Class Selection */}
                <div>
                  <label className='block text-sm font-bold text-slate-700 mb-2'>
                    Chọn lớp học <span className='text-red-500'>*</span>
                  </label>
                  <select
                    required
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className='w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all'
                  >
                    <option value=''>-- Chọn lớp học --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.subjectName ? `- ${cls.subjectName}` : ''}
                      </option>
                    ))}
                  </select>
                  {classes.length === 0 && (
                    <p className='text-xs text-slate-500 mt-1'>Bạn chưa được phân công lớp nào</p>
                  )}
                </div>

                {/* Notification Type Info - Lecturer chỉ gửi được thông báo lớp */}
                <div className='p-3 bg-blue-50 rounded-xl border border-blue-100'>
                  <div className='flex items-center gap-2 text-blue-700'>
                    <BookOpen size={18} />
                    <span className='text-sm font-semibold'>Thông báo lớp học</span>
                  </div>
                  <p className='text-xs text-blue-600 mt-1'>
                    Thông báo sẽ được gửi đến tất cả sinh viên trong lớp đã chọn
                  </p>
                </div>

                {/* Title */}
                <div>
                  <label className='block text-sm font-bold text-slate-700 mb-2'>
                    Tiêu đề <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='Ví dụ: Thông báo lịch thi giữa kỳ...'
                    className='w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all'
                    required
                  />
                </div>

                {/* Content */}
                <div>
                  <label className='block text-sm font-bold text-slate-700 mb-2'>
                    Nội dung <span className='text-red-500'>*</span>
                  </label>
                  <textarea
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder='Nhập nội dung thông báo...'
                    className='w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all resize-none'
                    required
                  />
                </div>

                {/* Actions */}
                <div className='pt-4 flex items-center justify-end gap-3 border-t border-slate-100'>
                  <button
                    type='button'
                    onClick={() => {
                      setTitle('')
                      setContent('')
                      setSelectedClassId('')
                    }}
                    className='px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors'
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type='submit'
                    disabled={isSubmitting}
                    className='flex items-center gap-2 px-6 py-2.5 bg-[#dd7323] text-white font-bold rounded-xl hover:bg-[#c2621a] transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className='animate-spin' />
                        <span>Đang gửi...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Gửi thông báo</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Preview */}
            <div>
              <h3 className='text-sm font-bold text-slate-500 uppercase tracking-wider mb-4'>Xem trước</h3>
              <div className='bg-white rounded-2xl shadow-sm border border-slate-100 p-5 relative overflow-hidden'>
                <div className='absolute top-0 left-0 w-1 h-full bg-blue-500'></div>
                <div className='flex justify-between items-start mb-2'>
                  <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-500'>
                    <BookOpen size={14} />
                    <span>Thông báo lớp</span>
                  </div>
                  <span className='text-xs text-slate-400'>Vừa xong</span>
                </div>
                <h4 className='font-bold text-slate-800 text-lg mb-2'>{title || 'Tiêu đề thông báo...'}</h4>
                <p className='text-sm text-slate-600 leading-relaxed whitespace-pre-wrap'>
                  {content || 'Nội dung thông báo sẽ hiển thị ở đây...'}
                </p>

                {selectedClass && (
                  <div className='mt-3 px-3 py-2 bg-blue-50 rounded-lg'>
                    <span className='text-xs text-blue-600 font-medium flex items-center gap-1'>
                      <Users size={12} />
                      Gửi đến: {selectedClass.name}
                    </span>
                  </div>
                )}
              </div>

              <div className='mt-6 bg-orange-50 p-4 rounded-xl border border-orange-100'>
                <h4 className='flex items-center gap-2 text-sm font-bold text-orange-700 mb-2'>
                  <Send size={16} />
                  Lưu ý
                </h4>
                <p className='text-xs text-orange-600/80 leading-relaxed'>
                  Thông báo sẽ được gửi qua App và Email đến tất cả sinh viên trong lớp.
                </p>
              </div>
            </div>
          </div>
        </Box>
      </Box>
    </Box>
  )
}
