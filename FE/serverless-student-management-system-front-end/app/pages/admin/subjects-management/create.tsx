import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Save, ArrowLeft, Library } from 'lucide-react'
import type { Subject, SubjectDTO } from '../../../types'
import api from '../../../utils/axios'
import { toaster } from '../../../components/ui/toaster'

const CreateSubject = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState<Partial<Subject>>({
    codeSubject: '',
    name: '',
    credits: 3,
    department: '',
    description: '',
    status: 1
  })

  // Mapping: label hiển thị UI -> value gửi lên DB
  const departments = [
    { label: 'CNTT', value: 'SE' },
    { label: 'Toán - Cơ', value: 'MATH' },
    { label: 'Lý luận chính trị', value: 'POL' },
    { label: 'NN & VH Anh Mỹ', value: 'ENG' },
    { label: 'Vật lý', value: 'PHY' },
    { label: 'Hóa học', value: 'CHEM' },
    { label: 'Sinh học', value: 'BIO' }
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'credits' || name === 'status' ? Number(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation - chỉ cần codeSubject và name
    if (!formData.codeSubject || !formData.name) {
      toaster.create({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ mã học phần và tên học phần!',
        type: 'error',
        duration: 3000
      })
      return
    }

    if (!formData.credits || formData.credits < 1 || formData.credits > 10) {
      toaster.create({
        title: 'Lỗi',
        description: 'Số tín chỉ phải từ 1 đến 10!',
        type: 'error',
        duration: 3000
      })
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        codeSubject: formData.codeSubject,
        name: formData.name,
        credits: formData.credits,
        department: formData.department,
        description: formData.description || '',
        status: formData.status || 1
      }

      // === GỌI API POST /api/admin/subjects ===
      const response = await api.post<{ result: SubjectDTO }>('/api/admin/subjects', payload)
      console.log('=== CREATE SUBJECT RESPONSE ===', response.data)

      if (response.data) {
        toaster.create({
          title: 'Thành công',
          description: 'Tạo học phần thành công!',
          type: 'success',
          duration: 2000
        })
        setTimeout(() => {
          navigate('/admin/subjects-management/list')
        }, 1500)
      }
    } catch (error: any) {
      console.error('Error creating subject:', error)
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Không thể tạo học phần. Vui lòng thử lại!'
      toaster.create({
        title: 'Lỗi',
        description: errorMessage,
        type: 'error',
        duration: 3000
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='max-w-3xl mx-auto'>
      <button
        onClick={() => navigate(-1)}
        className='flex items-center gap-2 text-slate-600 hover:text-[#dd7323] mb-6 transition-colors group'
      >
        <ArrowLeft size={20} className='group-hover:-translate-x-1 transition-transform' />
        <span className='font-medium'>Quay lại</span>
      </button>

      <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
        <div className='bg-gradient-to-r from-[#dd7323] to-orange-600 px-6 py-4 flex items-center gap-3'>
          <div className='w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center'>
            <Library className='text-white' size={22} />
          </div>
          <div>
            <h1 className='text-xl font-bold text-white'>Tạo Học phần mới</h1>
            <p className='text-orange-100 text-sm'>Nhập thông tin học phần để tạo mới</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='p-6 space-y-5'>
          {/* Mã học phần */}
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>
              Mã học phần <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              name='codeSubject'
              value={formData.codeSubject}
              onChange={handleChange}
              placeholder='Ví dụ: CS101'
              className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#dd7323] focus:border-[#dd7323] outline-none transition-all'
              required
            />
          </div>

          {/* Tên học phần */}
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>
              Tên học phần <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleChange}
              placeholder='Ví dụ: Lập trình căn bản'
              className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#dd7323] focus:border-[#dd7323] outline-none transition-all'
              required
            />
          </div>

          {/* Số tín chỉ */}
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>
              Số tín chỉ <span className='text-red-500'>*</span>
            </label>
            <input
              type='number'
              name='credits'
              value={formData.credits}
              onChange={handleChange}
              min='1'
              max='10'
              className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#dd7323] focus:border-[#dd7323] outline-none transition-all'
              required
            />
            <p className='text-xs text-slate-500 mt-1'>Số tín chỉ từ 1 đến 10</p>
          </div>

          {/* Khoa - không bắt buộc vì chưa làm DB chuyên ngành */}
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>Khoa</label>
            <select
              name='department'
              value={formData.department}
              onChange={handleChange}
              className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#dd7323] focus:border-[#dd7323] outline-none transition-all bg-white'
            >
              <option value=''>Chọn khoa (không bắt buộc)</option>
              {departments.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mô tả */}
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>Mô tả</label>
            <textarea
              name='description'
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder='Mô tả chi tiết về học phần...'
              className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#dd7323] focus:border-[#dd7323] outline-none transition-all resize-none'
            />
          </div>

          {/* Trạng thái */}
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>Trạng thái</label>
            <select
              name='status'
              value={formData.status}
              onChange={handleChange}
              className='w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#dd7323] focus:border-[#dd7323] outline-none transition-all bg-white'
            >
              <option value={1}>Đang hoạt động</option>
              <option value={0}>Ngừng hoạt động</option>
            </select>
          </div>

          {/* Buttons */}
          <div className='flex gap-3 pt-4'>
            <button
              type='submit'
              disabled={isLoading}
              className='flex-1 bg-gradient-to-r from-[#dd7323] to-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {isLoading ? (
                <>
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>Tạo học phần</span>
                </>
              )}
            </button>
            <button
              type='button'
              onClick={() => navigate(-1)}
              disabled={isLoading}
              className='px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateSubject
