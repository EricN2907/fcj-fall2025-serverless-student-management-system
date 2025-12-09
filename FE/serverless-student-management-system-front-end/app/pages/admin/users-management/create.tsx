import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, UserPlus, Calendar, Eye, EyeOff, ChevronDown } from 'lucide-react'
import { Calendar as DateCalendar } from 'react-date-range'
import { format } from 'date-fns'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import type { UserEntity, RegisterResponse } from '../../../types'
import api from '../../../utils/axios'
import { toaster } from '../../../components/ui/toaster'
import { Portal, Box } from '@chakra-ui/react'

// Danh sách chuyên ngành (majors)
const MAJORS = [
  { code: 'SE', name: 'Software Engineering' },
  { code: 'AI', name: 'Artificial Intelligence' },
  { code: 'IS', name: 'Information Systems' },
  { code: 'IA', name: 'Information Assurance' },
  { code: 'IoT', name: 'Internet of Things' },
  { code: 'GD', name: 'Graphic Design' },
  { code: 'MC', name: 'Multimedia Communication' },
  { code: 'BA', name: 'Business Administration' },
  { code: 'IB', name: 'International Business' },
  { code: 'MKT', name: 'Marketing' },
  { code: 'FIN', name: 'Finance' },
  { code: 'ACC', name: 'Accounting' },
  { code: 'HM', name: 'Hotel Management' },
  { code: 'EN', name: 'English' },
  { code: 'JP', name: 'Japanese' },
  { code: 'KR', name: 'Korean' },
  { code: 'CN', name: 'Chinese' }
]

const UserCreate: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<Partial<UserEntity>>({
    name: '',
    email: '',
    role_id: 3, // Default Student
    codeUser: '',
    date_of_birth: ''
  })
  const [selectedMajor, setSelectedMajor] = useState<string>('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const datePickerRef = useRef<HTMLDivElement>(null)

  // Generate codeUser when major changes
  useEffect(() => {
    if (selectedMajor && formData.role_id === 3) {
      // Student: MajorCode + timestamp (yyMMddHHmm)
      const timestamp = format(new Date(), 'yyMMddHHmm')
      setFormData((prev) => ({ ...prev, codeUser: `${selectedMajor}${timestamp}` }))
    } else if (formData.role_id === 2) {
      // Lecturer: GV + timestamp
      const timestamp = format(new Date(), 'yyMMddHHmm')
      setFormData((prev) => ({ ...prev, codeUser: `GV${timestamp}` }))
    } else if (formData.role_id === 1) {
      // Admin: AD + timestamp
      const timestamp = format(new Date(), 'yyMMddHHmm')
      setFormData((prev) => ({ ...prev, codeUser: `AD${timestamp}` }))
    }
  }, [selectedMajor, formData.role_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.email || !formData.codeUser || !dateOfBirth) {
      toaster.create({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin bắt buộc!',
        type: 'error',
        duration: 3000
      })
      return
    }

    if (formData.role_id === 3 && !selectedMajor) {
      toaster.create({
        title: 'Lỗi',
        description: 'Vui lòng chọn chuyên ngành cho sinh viên!',
        type: 'error',
        duration: 3000
      })
      return
    }

    if (!password || password.length < 8) {
      toaster.create({
        title: 'Lỗi',
        description: 'Mật khẩu phải có ít nhất 8 ký tự!',
        type: 'error',
        duration: 3000
      })
      return
    }

    if (password !== confirmPassword) {
      toaster.create({
        title: 'Lỗi',
        description: 'Mật khẩu xác nhận không khớp!',
        type: 'error',
        duration: 3000
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toaster.create({
        title: 'Lỗi',
        description: 'Email không hợp lệ!',
        type: 'error',
        duration: 3000
      })
      return
    }

    setIsLoading(true)
    try {
      // Prepare payload theo API spec - định dạng dd-MM-yyyy
      const payload = {
        email: formData.email,
        password: password,
        name: formData.name,
        role_id: formData.role_id!,
        codeUser: formData.codeUser,
        dob: format(dateOfBirth, 'dd-MM-yyyy') // API yêu cầu định dạng dd-MM-yyyy
      }

      console.log('Creating user with payload:', payload)

      // === GỌI API POST /api/admin/create-users ===
      const response = await api.post<RegisterResponse>('/api/admin/create-users', payload)

      console.log('Register response:', response.data)

      if (response.data && (response.data.message || response.data.userId)) {
        toaster.create({
          title: 'Thành công',
          description: response.data.message || 'Tạo người dùng thành công!',
          type: 'success',
          duration: 2000
        })
        setTimeout(() => {
          navigate('/admin/users-management/list')
        }, 1500)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Error creating user:', error)
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Không thể tạo người dùng. Vui lòng thử lại!'
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
            <UserPlus size={24} />
          </div>
          <div>
            <h1 className='text-xl font-bold text-slate-800'>Thêm người dùng mới</h1>
            <p className='text-slate-500 text-sm'>Tạo profile và tài khoản đăng nhập (Cognito).</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='p-8 space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Role Selection */}
            <div className='md:col-span-2'>
              <label className='block text-sm font-bold text-slate-700 mb-2'>Vai trò (Role)</label>
              <div className='grid grid-cols-3 gap-4'>
                {[
                  { id: 3, label: 'Student' },
                  { id: 2, label: 'Lecturer' },
                  { id: 1, label: 'Admin' }
                ].map((role) => (
                  <label
                    key={role.id}
                    className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.role_id === role.id
                        ? 'border-[#dd7323] bg-orange-50 text-[#dd7323] font-bold shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type='radio'
                      name='role_id'
                      className='hidden'
                      checked={formData.role_id === role.id}
                      onChange={() => {
                        setFormData({ ...formData, role_id: role.id, codeUser: '' })
                        setSelectedMajor('')
                      }}
                    />
                    {role.label}
                  </label>
                ))}
              </div>
            </div>

            <div className='md:col-span-2'>
              <label className='block text-sm font-bold text-slate-700 mb-2'>Họ và Tên</label>
              <input
                type='text'
                required
                className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder='VD: Nguyễn Văn A'
              />
            </div>

            {/* Major Selection - Only for Student */}
            {formData.role_id === 3 && (
              <div>
                <label className='block text-sm font-bold text-slate-700 mb-2'>Chuyên ngành</label>
                <div className='relative'>
                  <select
                    required
                    className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all appearance-none bg-white'
                    value={selectedMajor}
                    onChange={(e) => setSelectedMajor(e.target.value)}
                  >
                    <option value=''>Chọn chuyên ngành</option>
                    {MAJORS.map((major) => (
                      <option key={major.code} value={major.code}>
                        {major.code} - {major.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
                    size={18}
                  />
                </div>
              </div>
            )}

            <div className={formData.role_id === 3 ? '' : 'md:col-span-1'}>
              <label className='block text-sm font-bold text-slate-700 mb-2'>Mã định danh (codeUser)</label>
              <input
                type='text'
                required
                readOnly
                className='w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 font-mono uppercase cursor-not-allowed'
                value={formData.codeUser}
                placeholder='Tự động tạo'
              />
              <p className='text-xs text-slate-400 mt-1'>Mã được tạo tự động</p>
            </div>

            <div>
              <label className='block text-sm font-bold text-slate-700 mb-2'>Ngày sinh</label>
              <div className='relative' ref={datePickerRef}>
                <input
                  type='text'
                  readOnly
                  required
                  className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all text-slate-700 cursor-pointer'
                  value={dateOfBirth ? format(dateOfBirth, 'dd/MM/yyyy') : ''}
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  placeholder='Chọn ngày sinh'
                />
                <Calendar
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
                  size={18}
                />

                {showDatePicker && (
                  <Portal>
                    <Box
                      position='fixed'
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      bg='blackAlpha.300'
                      zIndex={1000}
                      onClick={() => setShowDatePicker(false)}
                    />
                    <Box
                      position='absolute'
                      zIndex={1001}
                      bg='white'
                      borderRadius='xl'
                      boxShadow='xl'
                      border='1px solid'
                      borderColor='slate.200'
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        top: datePickerRef.current
                          ? datePickerRef.current.getBoundingClientRect().bottom + window.scrollY + 8
                          : 0,
                        left: datePickerRef.current
                          ? datePickerRef.current.getBoundingClientRect().left + window.scrollX
                          : 0
                      }}
                    >
                      <DateCalendar
                        date={dateOfBirth}
                        onChange={(date) => {
                          setDateOfBirth(date)
                          setShowDatePicker(false)
                        }}
                        maxDate={new Date()}
                        color='#dd7323'
                      />
                    </Box>
                  </Portal>
                )}
              </div>
            </div>

            <div className='md:col-span-2'>
              <label className='block text-sm font-bold text-slate-700 mb-2'>Email đăng nhập</label>
              <input
                type='email'
                required
                className='w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all'
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder='email@example.com'
              />
            </div>

            <div>
              <label className='block text-sm font-bold text-slate-700 mb-2'>Mật khẩu</label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className='w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Ít nhất 8 ký tự'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className='text-xs text-slate-400 mt-1'>Tối thiểu 8 ký tự</p>
            </div>

            <div>
              <label className='block text-sm font-bold text-slate-700 mb-2'>Xác nhận mật khẩu</label>
              <div className='relative'>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className='w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder='Nhập lại mật khẩu'
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className='text-xs text-red-500 mt-1'>Mật khẩu không khớp</p>
              )}
            </div>
          </div>

          <div className='pt-6 border-t border-slate-100 flex justify-end gap-3'>
            <button
              type='button'
              onClick={() => navigate('/admin/users-management/list')}
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
                  <span>Tạo người dùng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserCreate
