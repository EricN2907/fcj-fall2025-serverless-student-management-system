import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Save, ArrowLeft, BookOpen, Calendar, Loader2, AlertCircle } from 'lucide-react'
import api from '../../../utils/axios'
import { toaster } from '../../../components/ui/toaster'

// Interface for class data passed from list page
interface ClassDataFromList {
  id: string
  classCode: string
  name: string
  subjectId: string
  teacherId: string
  room: string
  semester: string
  studentCount: number
  status: number
  description?: string
}

// Lecturer interface (passed from list page)
interface LecturerDTO {
  id: string
  name?: string
  fullName?: string
}

// Form data interface - chỉ các trường API hỗ trợ update (không có password)
interface ClassFormData {
  id: string
  name: string
  semester: string
  academicYear: string
  description: string
  teacherId: string
  status: number
  // Readonly fields (hiển thị nhưng không edit)
  subjectId: string
  room: string
}

const EditClass: React.FC = () => {
  const { classId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [lecturers, setLecturers] = useState<LecturerDTO[]>([])
  const [originalData, setOriginalData] = useState<ClassFormData>({
    id: '',
    name: '',
    semester: '1',
    academicYear: '2025-2026',
    description: '',
    teacherId: '',
    status: 1,
    subjectId: '',
    room: ''
  })
  const [formData, setFormData] = useState<ClassFormData>({
    id: '',
    name: '',
    semester: '1',
    academicYear: '2025-2026',
    description: '',
    teacherId: '',
    status: 1,
    subjectId: '',
    room: ''
  })

  useEffect(() => {
    if (classId) {
      loadClassData()
    }
  }, [classId])

  const loadClassData = () => {
    setIsFetching(true)
    setNotFound(false)

    // Lấy data từ location.state (được truyền từ list page)
    const classData = location.state?.classData as ClassDataFromList | undefined
    const lecturersFromList = location.state?.lecturers as LecturerDTO[] | undefined

    // Set lecturers từ state
    if (lecturersFromList && lecturersFromList.length > 0) {
      setLecturers(lecturersFromList)
    }

    if (classData) {
      // Sử dụng data từ state - chỉ các trường API hỗ trợ update
      const data: ClassFormData = {
        id: classData.id,
        name: classData.name,
        semester: classData.semester || '1',
        academicYear: '2025-2026',
        description: classData.description || '',
        teacherId: classData.teacherId,
        status: classData.status,
        // Readonly fields
        subjectId: classData.subjectId,
        room: classData.room
      }

      setFormData(data)
      setOriginalData(data)
      setIsFetching(false)
    } else {
      // Không có data từ state -> hiển thị not found
      setNotFound(true)
      setIsFetching(false)
      toaster.create({
        title: 'Không tìm thấy',
        description: 'Vui lòng chọn lớp học từ danh sách để chỉnh sửa!',
        type: 'error'
      })
    }
  }

  // Check if form has changes
  const hasChanges = (): boolean => {
    return JSON.stringify(formData) !== JSON.stringify(originalData)
  }

  // Get only changed fields for update (theo API spec - không có password)
  const getChangedFields = (): Partial<ClassFormData> => {
    const changes: Partial<ClassFormData> = {}

    if (formData.name !== originalData.name) changes.name = formData.name
    if (formData.semester !== originalData.semester) changes.semester = formData.semester
    if (formData.academicYear !== originalData.academicYear) changes.academicYear = formData.academicYear
    if (formData.description !== originalData.description) changes.description = formData.description
    if (formData.teacherId !== originalData.teacherId) changes.teacherId = formData.teacherId
    if (formData.status !== originalData.status) changes.status = formData.status

    return changes
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if there are any changes
    if (!hasChanges()) {
      toaster.create({
        title: 'Không có thay đổi',
        description: 'Bạn chưa thay đổi thông tin nào!',
        type: 'info'
      })
      return
    }

    // Validation
    if (!formData.name) {
      toaster.create({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên lớp!',
        type: 'error'
      })
      return
    }

    setIsLoading(true)
    try {
      // Get only changed fields for atomic update
      const payload = getChangedFields()

      // API payload - theo đúng format API yêu cầu (không có password)
      const apiPayload: Record<string, any> = {}
      if (payload.name) apiPayload.name = payload.name
      if (payload.semester) apiPayload.semester = payload.semester
      if (payload.academicYear) apiPayload.academicYear = payload.academicYear
      if (payload.description !== undefined) apiPayload.description = payload.description
      if (payload.teacherId) apiPayload.teacherId = payload.teacherId
      if (payload.status !== undefined) apiPayload.status = payload.status

      console.log('Updating class with payload:', apiPayload)

      // === GỌI API PATCH /api/admin/classes/update/{id} ===
      const response = await api.patch(`/api/admin/classes/update/${classId}`, apiPayload)

      console.log('Update response:', response.data)

      toaster.create({
        title: 'Thành công',
        description: 'Cập nhật lớp học thành công!',
        type: 'success'
      })

      setTimeout(() => {
        navigate('/admin/classes-management/list')
      }, 1500)
    } catch (error: any) {
      console.error('Error updating class:', error)

      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message

      if (error.response?.status === 404) {
        toaster.create({
          title: 'Lỗi',
          description: 'Lớp học không tồn tại!',
          type: 'error'
        })
      } else if (error.response?.status === 403) {
        toaster.create({
          title: 'Lỗi',
          description: 'Bạn không có quyền chỉnh sửa lớp học này!',
          type: 'error'
        })
      } else {
        toaster.create({
          title: 'Lỗi',
          description: errorMessage || 'Không thể cập nhật lớp học. Vui lòng thử lại!',
          type: 'error'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle cancel with unsaved changes warning
  const handleCancel = () => {
    if (hasChanges()) {
      const confirm = window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn hủy?')
      if (!confirm) return
    }
    navigate('/admin/classes-management/list')
  }

  // Loading state
  if (isFetching) {
    return (
      <div className='max-w-2xl mx-auto pb-10'>
        <div className='bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center'>
          <Loader2 size={40} className='text-[#dd7323] animate-spin mb-3' />
          <p className='text-slate-600'>Đang tải thông tin lớp học...</p>
        </div>
      </div>
    )
  }

  // Not found state
  if (notFound) {
    return (
      <div className='max-w-2xl mx-auto pb-10'>
        <div className='bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center'>
          <AlertCircle size={48} className='text-red-500 mb-3' />
          <h2 className='text-xl font-bold text-slate-800 mb-2'>Không tìm thấy lớp học</h2>
          <p className='text-slate-600 mb-4'>Lớp học không tồn tại hoặc đã bị xóa.</p>
          <button
            onClick={() => navigate('/admin/classes-management/list')}
            className='px-6 py-2.5 bg-[#dd7323] text-white font-bold rounded-xl hover:bg-[#c2621a] transition-all'
          >
            Quay về danh sách
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-2xl mx-auto pb-10'>
      <button
        onClick={() => navigate(-1)}
        className='flex items-center gap-1 text-slate-500 hover:text-[#dd7323] mb-4 transition-colors'
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      <div className='bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden'>
        <div className='p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3'>
          <div className='bg-[#dd7323]/10 p-2 rounded-lg text-[#dd7323]'>
            <BookOpen size={24} />
          </div>
          <div className='flex-1'>
            <h1 className='text-xl font-bold text-slate-800'>Chỉnh sửa Lớp học</h1>
            <p className='text-slate-500 text-sm'>
              Lớp: <span className='font-medium'>{originalData.name}</span>
            </p>
          </div>
          {hasChanges() && (
            <div className='px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full'>
              Có thay đổi chưa lưu
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className='p-8 space-y-6'>
          {/* Thông tin readonly */}
          <div className='bg-slate-50 p-4 rounded-xl border border-slate-200'>
            <p className='text-sm text-slate-600'>
              <span className='font-medium'>Mã lớp:</span> {formData.id} |{' '}
              <span className='font-medium'>Học phần:</span> {formData.subjectId} |{' '}
              <span className='font-medium'>Phòng:</span> {formData.room || 'N/A'}
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='md:col-span-2'>
              <label className='block text-sm font-bold text-slate-700 mb-2'>
                Tên lớp <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                required
                className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all uppercase'
                value={formData.name}
                placeholder='VD: LỚP 01, CLC-02'
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
              />
            </div>

            <div>
              <label className='block text-sm font-bold text-slate-700 mb-2'>Học kỳ</label>
              <select
                className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all'
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              >
                <option value='1'>Học kỳ 1</option>
                <option value='2'>Học kỳ 2</option>
                <option value='Hè'>Học kỳ Hè</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-bold text-slate-700 mb-2'>Năm học</label>
              <div className='relative'>
                <input
                  type='text'
                  className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all'
                  value={formData.academicYear}
                  placeholder='2025-2026'
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                />
                <Calendar
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
                  size={16}
                />
              </div>
            </div>

            <div className='md:col-span-2'>
              <label className='block text-sm font-bold text-slate-700 mb-2'>Giảng viên phụ trách</label>
              <select
                className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all'
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              >
                <option value=''>-- Chọn giảng viên --</option>
                {lecturers.map((lecturer) => (
                  <option key={lecturer.id} value={lecturer.id}>
                    {lecturer.id} - {lecturer.name || lecturer.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className='md:col-span-2'>
              <label className='block text-sm font-bold text-slate-700 mb-2'>Trạng thái</label>
              <select
                className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all'
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
              >
                <option value={1}>Đang mở</option>
                <option value={0}>Đóng</option>
              </select>
            </div>

            <div className='md:col-span-2'>
              <label className='block text-sm font-bold text-slate-700 mb-2'>Mô tả lớp học</label>
              <textarea
                rows={3}
                className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all resize-none'
                value={formData.description}
                placeholder='Mô tả về lớp học, lịch học, yêu cầu...'
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className='pt-6 border-t border-slate-100 flex justify-end gap-3'>
            <button
              type='button'
              onClick={handleCancel}
              className='px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors'
            >
              Hủy bỏ
            </button>
            <button
              type='submit'
              disabled={isLoading || !hasChanges()}
              className='flex items-center gap-2 px-6 py-2.5 bg-[#dd7323] text-white font-bold rounded-xl hover:bg-[#c2621a] transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditClass
