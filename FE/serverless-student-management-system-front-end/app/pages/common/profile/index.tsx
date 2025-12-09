'use client'

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import {
  User,
  Mail,
  Calendar,
  Save,
  Lock,
  Eye,
  EyeOff,
  Hash,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { profileApi } from '../../../services/lecturerApi'
import { toaster } from '../../../components/ui/toaster'
import type { ProfileDTO } from '../../../types'

export default function ProfileRoute() {
  const navigate = useNavigate()
  const { user, updateUser, logoutFromCognito } = useAuthStore()

  // Profile state
  const [profile, setProfile] = useState<ProfileDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info')

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: ''
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Password state
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  })
  const [changingPassword, setChangingPassword] = useState(false)

  // Fetch profile
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await profileApi.getProfile()
      console.log('Profile data:', data) // Debug
      setProfile(data)
      setFormData({
        name: data.name || '',
        dateOfBirth: data.dateOfBirth || ''
      })
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      // Use user data from auth store as fallback
      if (user) {
        setProfile({
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          codeUser: user.username,
          avatar: user.avatar,
          phone: user.phone
        })
        setFormData({
          name: user.fullName || '',
          dateOfBirth: ''
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      await profileApi.updateProfile({
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        avatarFile: avatarFile || undefined
      })

      // Reload profile data from API to get updated info
      const updatedProfile = await profileApi.getProfile()
      setProfile(updatedProfile)
      setFormData({
        name: updatedProfile.name || '',
        dateOfBirth: updatedProfile.dateOfBirth || ''
      })

      setIsEditing(false)
      setAvatarFile(null)
      setAvatarPreview(null)

      // Update auth store
      updateUser({
        fullName: updatedProfile.name,
        avatar: updatedProfile.avatar
      })

      toaster.create({
        title: 'Cập nhật thành công',
        description: 'Thông tin cá nhân đã được cập nhật',
        type: 'success'
      })
    } catch (error: any) {
      console.error('Update profile error:', error)
      toaster.create({
        title: 'Cập nhật thất bại',
        description: error.response?.data?.message || 'Có lỗi xảy ra',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleChangePassword = async () => {
    // Validation - mật khẩu mới không được giống mật khẩu cũ
    if (passwordData.new_password === passwordData.old_password) {
      toaster.create({
        title: 'Mật khẩu không hợp lệ',
        description: 'Mật khẩu mới không được giống mật khẩu cũ',
        type: 'error'
      })
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toaster.create({
        title: 'Mật khẩu không khớp',
        description: 'Mật khẩu mới và xác nhận mật khẩu phải giống nhau',
        type: 'error'
      })
      return
    }

    if (passwordData.new_password.length < 8) {
      toaster.create({
        title: 'Mật khẩu quá ngắn',
        description: 'Mật khẩu mới phải có ít nhất 8 ký tự',
        type: 'error'
      })
      return
    }

    try {
      setChangingPassword(true)
      await profileApi.changePassword(passwordData)

      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: ''
      })

      toaster.create({
        title: 'Đổi mật khẩu thành công',
        description: 'Vui lòng đăng nhập lại với mật khẩu mới',
        type: 'success'
      })

      // Logout và redirect về trang đăng nhập sau 2 giây
      setTimeout(async () => {
        try {
          await logoutFromCognito()
        } catch (e) {
          console.error('Logout error:', e)
        }
        // Use window.location.href for full page reload to clear all state
        window.location.href = '/login'
      }, 2000)
    } catch (error: any) {
      toaster.create({
        title: 'Đổi mật khẩu thất bại',
        description: error.response?.data?.message || 'Mật khẩu cũ không đúng',
        type: 'error'
      })
    } finally {
      setChangingPassword(false)
    }
  }

  const getRoleName = (role?: string | null) => {
    // Use provided role or fallback to user role from auth store
    const effectiveRole = role || user?.role
    switch (effectiveRole) {
      case 'Admin':
        return 'Quản trị viên'
      case 'Lecturer':
        return 'Giảng viên'
      case 'Student':
        return 'Sinh viên'
      default:
        return 'Người dùng'
    }
  }

  const getRoleColor = (role?: string | null) => {
    // Use user role from auth store as fallback if role is null
    const effectiveRole = role || user?.role
    switch (effectiveRole) {
      case 'Admin':
        return 'bg-red-50 text-red-600 border-red-200'
      case 'Lecturer':
        return 'bg-purple-50 text-purple-600 border-purple-200'
      case 'Student':
        return 'bg-blue-50 text-blue-600 border-blue-200'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 size={40} className='text-[#dd7323] animate-spin mx-auto mb-3' />
          <p className='text-slate-600'>Đang tải thông tin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-5xl mx-auto py-8 px-4'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-slate-900'>Thông tin cá nhân</h1>
        <p className='text-slate-500 mt-1'>Quản lý thông tin tài khoản và cài đặt bảo mật</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column - Avatar & Basic Info Card */}
        <div className='lg:col-span-1'>
          <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-6'>
            {/* Avatar */}
            <div className='flex flex-col items-center'>
              <div className='relative group'>
                <div className='w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg'>
                  <img
                    src={
                      avatarPreview ||
                      profile?.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=dd7323&color=fff&size=128`
                    }
                    alt={profile?.name}
                    className='w-full h-full object-cover'
                    onError={(e) => {
                      // Fallback nếu ảnh không load được
                      const target = e.target as HTMLImageElement
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=dd7323&color=fff&size=128`
                    }}
                  />
                </div>
                {isEditing && (
                  <label className='absolute bottom-0 right-0 p-2 bg-[#dd7323] rounded-full cursor-pointer hover:bg-[#c2621a] transition-colors'>
                    <User size={16} className='text-white' />
                    <input type='file' accept='image/*' onChange={handleAvatarChange} className='hidden' />
                  </label>
                )}
              </div>

              <h2 className='mt-4 text-xl font-bold text-slate-800'>{profile?.name}</h2>
              <p className='text-slate-500 text-sm'>{profile?.email}</p>

              <span
                className={`mt-3 px-3 py-1 rounded-full text-xs font-bold uppercase border ${getRoleColor(profile?.role)}`}
              >
                {getRoleName(profile?.role)}
              </span>
            </div>

            {/* Quick Info */}
            <div className='mt-6 space-y-3 pt-6 border-t border-slate-100'>
              {profile?.codeUser && (
                <div className='flex items-center gap-3 text-sm'>
                  <div className='p-2 bg-slate-50 rounded-lg'>
                    <Hash size={16} className='text-slate-400' />
                  </div>
                  <div>
                    <p className='text-slate-400 text-xs'>Mã định danh</p>
                    <p className='font-semibold text-slate-700'>{profile.codeUser}</p>
                  </div>
                </div>
              )}

              <div className='flex items-center gap-3 text-sm'>
                <div className='p-2 bg-slate-50 rounded-lg'>
                  <Shield size={16} className='text-slate-400' />
                </div>
                <div>
                  <p className='text-slate-400 text-xs'>Trạng thái</p>
                  <p className='font-semibold text-emerald-600 flex items-center gap-1'>
                    <CheckCircle size={14} /> Đang hoạt động
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Tabs & Forms */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Tab Navigation */}
          <div className='bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden'>
            <div className='flex border-b border-slate-100'>
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'info'
                    ? 'text-[#dd7323] border-b-2 border-[#dd7323] bg-orange-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <User size={18} className='inline mr-2' />
                Thông tin cá nhân
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'password'
                    ? 'text-[#dd7323] border-b-2 border-[#dd7323] bg-orange-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Lock size={18} className='inline mr-2' />
                Đổi mật khẩu
              </button>
            </div>

            <div className='p-6'>
              {activeTab === 'info' ? (
                <div className='space-y-5'>
                  {/* Name */}
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                      <User size={14} className='inline mr-1' /> Họ và tên
                    </label>
                    {isEditing ? (
                      <input
                        type='text'
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className='w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all'
                        placeholder='Nhập họ và tên'
                      />
                    ) : (
                      <p className='px-4 py-3 bg-slate-50 rounded-xl text-slate-700'>
                        {profile?.name || 'Chưa cập nhật'}
                      </p>
                    )}
                  </div>

                  {/* Email - Read only */}
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                      <Mail size={14} className='inline mr-1' /> Email
                    </label>
                    <p className='px-4 py-3 bg-slate-50 rounded-xl text-slate-500 flex items-center gap-2'>
                      {profile?.email}
                      <span className='text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded'>
                        Không thể thay đổi
                      </span>
                    </p>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                      <Calendar size={14} className='inline mr-1' /> Ngày sinh
                    </label>
                    {isEditing ? (
                      <input
                        type='date'
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className='w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all'
                      />
                    ) : (
                      <p className='px-4 py-3 bg-slate-50 rounded-xl text-slate-700'>
                        {profile?.dateOfBirth || 'Chưa cập nhật'}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className='flex gap-3 pt-4'>
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(false)
                            setFormData({
                              name: profile?.name || '',
                              dateOfBirth: profile?.dateOfBirth || ''
                            })
                            setAvatarFile(null)
                            setAvatarPreview(null)
                          }}
                          className='flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors'
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className='flex-1 px-4 py-3 bg-[#dd7323] text-white rounded-xl hover:bg-[#c2621a] font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50'
                        >
                          {saving ? <Loader2 size={18} className='animate-spin' /> : <Save size={18} />}
                          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className='px-6 py-3 bg-[#dd7323] text-white rounded-xl hover:bg-[#c2621a] font-medium transition-colors'
                      >
                        Chỉnh sửa thông tin
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className='space-y-5'>
                  {/* Old Password */}
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>Mật khẩu hiện tại</label>
                    <div className='relative'>
                      <input
                        type={showPasswords.old ? 'text' : 'password'}
                        value={passwordData.old_password}
                        onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                        className='w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all'
                        placeholder='Nhập mật khẩu hiện tại'
                      />
                      <button
                        type='button'
                        onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                        className='absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                      >
                        {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>Mật khẩu mới</label>
                    <div className='relative'>
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                        className='w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all'
                        placeholder='Nhập mật khẩu mới (ít nhất 8 ký tự)'
                      />
                      <button
                        type='button'
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className='absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                      >
                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>Xác nhận mật khẩu mới</label>
                    <div className='relative'>
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                        className='w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#dd7323]/20 focus:border-[#dd7323] outline-none transition-all'
                        placeholder='Nhập lại mật khẩu mới'
                      />
                      <button
                        type='button'
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className='absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
                      >
                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordData.confirm_password && passwordData.new_password !== passwordData.confirm_password && (
                      <p className='mt-2 text-sm text-red-500 flex items-center gap-1'>
                        <AlertCircle size={14} /> Mật khẩu không khớp
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleChangePassword}
                    disabled={
                      changingPassword ||
                      !passwordData.old_password ||
                      !passwordData.new_password ||
                      !passwordData.confirm_password
                    }
                    className='w-full px-4 py-3 bg-[#dd7323] text-white rounded-xl hover:bg-[#c2621a] font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {changingPassword ? <Loader2 size={18} className='animate-spin' /> : <Lock size={18} />}
                    {changingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
