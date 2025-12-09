import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TableList from '../../../components/common/TableList'
import type { Column } from '../../../components/common/TableList'
import { Mail, UserCheck, UserX, Hash, Search, X, Loader2 } from 'lucide-react'
import type { UserEntity } from '../../../types'
import api from '../../../utils/axios'
import { toaster } from '../../../components/ui/toaster'
import { createListCollection } from '@chakra-ui/react'
import { SelectRoot, SelectTrigger, SelectValueText, SelectContent, SelectItem } from '../../../components/ui/select'

// Extended type for display with additional fields
type UserDisplay = Omit<UserEntity, 'id'> & {
  id: string // Keep as string to avoid duplicate IDs
  role_name: string
  created_at: string
  avatar?: string | null
}

// UserDTO from backend - matches actual API response
interface UserDTO {
  id: string
  name: string
  email: string
  dateOfBirth?: string
  role: string
  codeUser?: string | null
  avatar?: string | null
  status?: number // 1 = active, 0 = banned
}

const UsersList: React.FC = () => {
  const navigate = useNavigate()

  // States for data and loading
  const [users, setUsers] = useState<UserDisplay[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // States for filters
  const [keyword, setKeyword] = useState<string>('')
  const [roleId, setRoleId] = useState<string>('')

  // Debounced keyword for API calls
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>('')

  // Debounce keyword input (wait 500ms after user stops typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword)
    }, 500)

    return () => clearTimeout(timer)
  }, [keyword])

  // Transform UserDTO to UserDisplay format
  const transformUser = (dto: UserDTO): UserDisplay => {
    const roleToId: Record<string, number> = {
      admin: 1,
      lecturer: 2,
      student: 3
    }
    const role_id = roleToId[dto.role?.toLowerCase()] || 3

    return {
      id: dto.id, // Keep original string ID (e.g., "GV01", "SV001")
      codeUser: dto.codeUser || dto.id,
      name: dto.name,
      email: dto.email,
      role_id: role_id,
      role_name: dto.role?.toLowerCase() || 'student',
      date_of_birth: dto.dateOfBirth,
      status: dto.status ?? 1, // Lấy status từ API, mặc định 1 nếu không có
      created_at: new Date().toISOString(),
      avatar: dto.avatar
    }
  }

  // Helper to extract users from API response (handle different formats)
  const extractUsersFromResponse = (data: any): UserDTO[] => {
    // Try different response formats
    if (Array.isArray(data)) return data
    if (data?.results && Array.isArray(data.results)) return data.results
    if (data?.data && Array.isArray(data.data)) return data.data
    if (data?.users && Array.isArray(data.users)) return data.users
    return []
  }

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true)

      let allUsers: UserDisplay[] = []

      // Nếu có keyword search hoặc chọn role cụ thể
      if (debouncedKeyword.trim() || roleId) {
        const params: Record<string, string> = {}
        if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim()
        if (roleId) params.role_id = roleId

        const response = await api.get('/api/admin/users', { params })
        console.log('=== USERS API RESPONSE (filtered) ===', response.data)
        const usersData = extractUsersFromResponse(response.data)
        console.log('=== EXTRACTED USERS ===', usersData)
        allUsers = usersData.map(transformUser)
      } else {
        // Mặc định: Load cả Student (3) và Lecturer (2) song song
        const [studentsRes, lecturersRes] = await Promise.all([
          api.get('/api/admin/users', { params: { role_id: '3' } }),
          api.get('/api/admin/users', { params: { role_id: '2' } })
        ])

        console.log('=== STUDENTS API RESPONSE ===', studentsRes.data)
        console.log('=== LECTURERS API RESPONSE ===', lecturersRes.data)

        const studentsData = extractUsersFromResponse(studentsRes.data)
        const lecturersData = extractUsersFromResponse(lecturersRes.data)

        console.log('=== EXTRACTED STUDENTS ===', studentsData)
        console.log('=== EXTRACTED LECTURERS ===', lecturersData)

        const students = studentsData.map(transformUser)
        const lecturers = lecturersData.map(transformUser)
        allUsers = [...lecturers, ...students] // Lecturer trước, Student sau
      }

      console.log('=== FINAL USERS TO DISPLAY ===', allUsers)
      setUsers(allUsers)
    } catch (error: any) {
      console.error('Error fetching users:', error)
      console.error('Error details:', error.response?.data)
      toaster.create({
        title: 'Lỗi tải dữ liệu',
        description: error.response?.data?.message || 'Không thể tải danh sách người dùng',
        type: 'error'
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount and when filters change
  useEffect(() => {
    fetchUsers()
  }, [debouncedKeyword, roleId])

  // Handle clear filters
  const handleClearFilters = () => {
    setKeyword('')
    setRoleId('')
  }

  // Check if any filter is active
  const hasActiveFilters = keyword || roleId !== ''

  const columns: Column<UserDisplay>[] = [
    {
      header: 'Thông tin cá nhân',
      accessor: 'name',
      render: (row) => (
        <div className='flex items-center gap-3'>
          <img
            src={row.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=random`}
            alt={row.name}
            className='w-10 h-10 rounded-full object-cover border border-slate-200'
          />
          <div>
            <div className='font-bold text-slate-800 text-sm'>{row.name}</div>
            <div className='text-xs text-slate-500 flex items-center gap-1'>
              <Mail size={10} /> {row.email}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Mã định danh',
      accessor: 'codeUser',
      render: (row) => (
        <div className='flex items-center gap-1.5 text-slate-600 font-mono text-xs bg-slate-100 px-2 py-1 rounded w-fit'>
          <Hash size={10} />
          {row.codeUser}
        </div>
      )
    },
    {
      header: 'Vai trò',
      accessor: 'role_name',
      render: (row) => {
        const roles: Record<string, { label: string; bg: string; text: string }> = {
          student: { label: 'Sinh viên', bg: 'bg-blue-50', text: 'text-blue-600' },
          lecturer: { label: 'Giảng viên', bg: 'bg-purple-50', text: 'text-purple-600' },
          admin: { label: 'Quản trị', bg: 'bg-red-50', text: 'text-red-600' }
        }
        const conf = roles[row.role_name || 'student']
        return (
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${conf.bg} ${conf.text}`}>
            {conf.label}
          </span>
        )
      }
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (row) => (
        <div className='flex items-center gap-2'>
          {row.status === 1 ? (
            <span className='flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full'>
              <UserCheck size={12} /> Hoạt động
            </span>
          ) : (
            <span className='flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full'>
              <UserX size={12} /> Đã khóa (Ban)
            </span>
          )}
        </div>
      )
    }
  ]

  // Handle toggle user status (ban/unlock)
  // API: PATCH /api/admin/users/update-status/{id}?status=0 (khóa) hoặc status=1 (mở)
  const handleToggleUserStatus = async (user: UserDisplay) => {
    const isLocked = user.status === 0
    const action = isLocked ? 'mở khóa' : 'khóa'
    const newStatus = isLocked ? 1 : 0

    if (!confirm(`Bạn có chắc muốn ${action} tài khoản "${user.name}" (${user.codeUser})?`)) {
      return
    }

    try {
      // === GỌI API PATCH /api/admin/users/update-status/{id}?status={0|1} ===
      await api.patch(`/api/admin/users/update-status/${user.id}`, null, {
        params: { status: newStatus }
      })

      toaster.create({
        title: 'Thành công',
        description: isLocked ? `Đã mở khóa tài khoản "${user.name}"` : `Đã khóa tài khoản "${user.name}"`,
        type: 'success'
      })

      // Refresh list
      fetchUsers()
    } catch (error: any) {
      console.error('Error updating user status:', error)
      toaster.create({
        title: 'Lỗi',
        description: error.response?.data?.message || `Không thể ${action} tài khoản`,
        type: 'error'
      })
    }
  }

  // Get delete label based on user status
  const getDeleteLabel = (user: UserDisplay) => {
    return user.status === 0 ? 'Mở tài khoản' : 'Khóa tài khoản'
  }

  return (
    <div className='space-y-4'>
      {/* Filter Section */}
      <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-4'>
        <div className='flex flex-wrap gap-3 items-end'>
          {/* Search Keyword */}
          <div className='flex-1 min-w-[300px]'>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              <Search size={14} className='inline mr-1' />
              Tìm kiếm
            </label>
            <input
              type='text'
              placeholder='Nhập tên, email hoặc mã người dùng...'
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dd7323] focus:border-transparent'
            />
          </div>

          {/* Role Filter */}
          <div className='w-48'>
            <label className='block text-sm font-medium text-slate-700 mb-1'>Vai trò</label>
            <SelectRoot
              collection={createListCollection({
                items: [
                  { label: 'Tất cả (SV + GV)', value: '' },
                  { label: 'Quản trị viên', value: '1' },
                  { label: 'Giảng viên', value: '2' },
                  { label: 'Sinh viên', value: '3' }
                ]
              })}
              value={roleId ? [roleId] : []}
              onValueChange={(e: any) => setRoleId(e.value[0] || '')}
              size='sm'
              variant='outline'
              positioning={{ sameWidth: true }}
            >
              <SelectTrigger clearable>
                <SelectValueText placeholder='Tất cả (SV + GV)' />
              </SelectTrigger>
              <SelectContent>
                {[
                  { label: 'Tất cả (SV + GV)', value: '' },
                  { label: 'Quản trị viên', value: '1' },
                  { label: 'Giảng viên', value: '2' },
                  { label: 'Sinh viên', value: '3' }
                ].map((item) => (
                  <SelectItem key={item.value} item={item}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className='px-4 py-2 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2'
            >
              <X size={16} />
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table with Loading State */}
      {loading ? (
        <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center'>
          <Loader2 size={40} className='text-[#dd7323] animate-spin mb-3' />
          <p className='text-slate-600'>Đang tải danh sách người dùng...</p>
        </div>
      ) : (
        <TableList
          title='Quản lý Người dùng'
          subtitle='Danh sách tài khoản (Student, Lecturer) trong hệ thống.'
          data={users}
          columns={columns}
          onAdd={() => navigate('/admin/users-management/create')}
          onDelete={handleToggleUserStatus}
          deleteLabel={getDeleteLabel}
        />
      )}
    </div>
  )
}

export default UsersList
