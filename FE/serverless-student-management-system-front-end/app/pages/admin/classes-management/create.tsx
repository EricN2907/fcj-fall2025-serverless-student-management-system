import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { Save, ArrowLeft, BookOpen, Key, Calendar, Loader2 } from 'lucide-react'
import api from '../../../utils/axios'
import { toaster } from '../../../components/ui/toaster'

// Lecturer interface from API
interface LecturerDTO {
  id: string
  name?: string
  fullName?: string
}

// Subject interface from API
interface SubjectDTO {
  id: string
  displayId?: string
  name: string
  status?: number
}

const CreateClass: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  // Nhận lecturers từ list page (không cần call API)
  const lecturersFromState = location.state?.lecturers as LecturerDTO[] | undefined
  const [lecturers] = useState<LecturerDTO[]>(lecturersFromState || [])
  const [subjects, setSubjects] = useState<SubjectDTO[]>([])

  // Form data theo API spec
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    semester: '1',
    academicYear: '2025-2026',
    description: '',
    teacherId: '',
    subjectId: '',
    status: 1
  })

  // Load subjects từ API
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true)
        const response = await api.get('/api/admin/subjects')
        console.log('=== SUBJECTS API RESPONSE ===', response.data)

        // Handle different response formats
        let subjectData: any[] = []
        if (Array.isArray(response.data)) {
          subjectData = response.data
        } else if (response.data?.results) {
          subjectData = response.data.results
        } else if (response.data?.data) {
          subjectData = response.data.data
        }

        // Transform và chỉ lấy subjects đang active (status = 1)
        const transformedSubjects: SubjectDTO[] = subjectData
          .filter((s: any) => s.status === 1 || s.status === undefined)
          .map((s: any) => ({
            id: s.id,
            // Remove SUBJECT# prefix for display, keep original id for value
            displayId: s.id?.replace('SUBJECT#', '') || s.id,
            name: s.name,
            status: s.status
          }))

        console.log('=== TRANSFORMED SUBJECTS ===', transformedSubjects)
        setSubjects(transformedSubjects)
      } catch (error: any) {
        console.error('Error fetching subjects:', error)
        toaster.create({
          title: 'Lỗi',
          description: 'Không thể tải danh sách học phần',
          type: 'error'
        })
      } finally {
        setLoadingSubjects(false)
      }
    }

    fetchSubjects()
  }, [])

  // Nếu không có lecturers từ state, hiển thị thông báo
  useEffect(() => {
    if (!lecturersFromState || lecturersFromState.length === 0) {
      toaster.create({
        title: 'Thông báo',
        description: 'Vui lòng truy cập từ trang danh sách lớp học để có dữ liệu giảng viên.',
        type: 'warning'
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toaster.create({
        title: 'Lỗi',
        description: 'Vui lòng nhập tên lớp!',
        type: 'error'
      })
      return
    }

    if (!formData.subjectId) {
      toaster.create({
        title: 'Lỗi',
        description: 'Vui lòng chọn học phần!',
        type: 'error'
      })
      return
    }

    if (!formData.teacherId) {
      toaster.create({
        title: 'Lỗi',
        description: 'Vui lòng chọn giảng viên phụ trách!',
        type: 'error'
      })
      return
    }

    if (!formData.password || formData.password.length < 4) {
      toaster.create({
        title: 'Lỗi',
        description: 'Mã tham gia phải có ít nhất 4 ký tự!',
        type: 'error'
      })
      return
    }

    setIsLoading(true)
    try {
      // Prepare payload theo API spec
      const payload = {
        name: formData.name.trim().toUpperCase(),
        password: formData.password.trim(),
        semester: formData.semester,
        academic_year: formData.academicYear.trim(),
        description: formData.description.trim(),
        teacherId: formData.teacherId,
        subject_id: formData.subjectId,
        status: formData.status
      }

      console.log('Creating class with payload:', payload)

      // === GỌI API POST /api/admin/createClass ===
      const response = await api.post('/api/admin/createClass', payload)

      console.log('Create response:', response.data)

      toaster.create({
        title: 'Thành công',
        description: 'Đã tạo lớp học mới!',
        type: 'success'
      })

      setTimeout(() => {
        navigate('/admin/classes-management/list')
      }, 1500)
    } catch (error: any) {
      console.error('Error creating class:', error)

      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message

      toaster.create({
        title: 'Lỗi tạo lớp',
        description: errorMessage || 'Không thể tạo lớp học. Vui lòng thử lại!',
        type: 'error'
      })
    } finally {
      setIsLoading(false)
    }
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
          <div>
            <h1 className='text-xl font-bold text-slate-800'>Tạo Lớp học mới</h1>
            <p className='text-slate-500 text-sm'>Điền thông tin để tạo lớp học.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='p-8 space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Tên lớp */}
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

            {/* Học phần (Subject) */}
            <div className='md:col-span-2'>
              <label className='block text-sm font-bold text-slate-700 mb-2'>
                Học phần <span className='text-red-500'>*</span>
              </label>
              <select
                required
                disabled={loadingSubjects}
                className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              >
                <option value=''>-- Chọn học phần --</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.displayId || subject.id} - {subject.name}
                  </option>
                ))}
              </select>
              {loadingSubjects && (
                <p className='text-xs text-slate-500 mt-1 flex items-center gap-1'>
                  <Loader2 size={12} className='animate-spin' />
                  Đang tải học phần...
                </p>
              )}
            </div>

            {/* Học kỳ */}
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

            {/* Năm học */}
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

            {/* Giảng viên phụ trách */}
            <div className='md:col-span-2'>
              <label className='block text-sm font-bold text-slate-700 mb-2'>
                Giảng viên phụ trách <span className='text-red-500'>*</span>
              </label>
              <select
                required
                disabled={lecturers.length === 0}
                className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed'
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
              {lecturers.length === 0 && (
                <p className='text-xs text-amber-600 mt-1'>
                  Không có dữ liệu giảng viên. Vui lòng quay lại danh sách lớp học.
                </p>
              )}
            </div>

            {/* Mã tham gia lớp */}
            <div className='md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200'>
              <label className='block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2'>
                <Key size={16} className='text-[#dd7323]' />
                Mã tham gia lớp (Passcode) <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                required
                minLength={4}
                className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all font-mono tracking-widest bg-white'
                value={formData.password}
                placeholder='VD: 123456'
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <p className='text-xs text-slate-500 mt-2'>
                Sinh viên cần nhập mã này để tham gia lớp. Tối thiểu 4 ký tự.
              </p>
            </div>

            {/* Trạng thái */}
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

            {/* Mô tả */}
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
              onClick={() => navigate('/admin/classes-management/list')}
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
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Tạo lớp</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateClass
