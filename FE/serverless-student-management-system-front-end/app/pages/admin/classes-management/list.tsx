import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import TableList, { type Column } from '../../../components/common/TableList'
import { User, CheckCircle, Clock, Search, X, Loader2 } from 'lucide-react'
import api from '../../../utils/axios'
import { toaster } from '../../../components/ui/toaster'
import { createListCollection } from '@chakra-ui/react'
import { SelectRoot, SelectTrigger, SelectValueText, SelectContent, SelectItem } from '../../../components/ui/select'

// ClassDTO from backend - matches actual API response
interface ClassDTO {
  id: string
  name: string
  subjectId: string
  teacherId: string
  room: string
  semester: string
  studentCount: number
  status: number
  description?: string | null
}

// Display type for table
interface ClassDisplay {
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

// Lecturer interface from API
interface LecturerDTO {
  id: string
  name?: string
  fullName?: string
}

const ClassesList: React.FC = () => {
  const navigate = useNavigate()

  // States for data and loading
  const [classes, setClasses] = useState<ClassDisplay[]>([])
  const [lecturers, setLecturers] = useState<LecturerDTO[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // States for filters
  const [keyword, setKeyword] = useState<string>('') // Filter client-side
  const [teacherId, setTeacherId] = useState<string>('') // Filter client-side
  const [status, setStatus] = useState<string>('') // Filter gọi API

  // Fetch lecturers for filter dropdown
  useEffect(() => {
    const fetchLecturers = async () => {
      try {
        const response = await api.get('/api/admin/users', {
          params: { role_id: 2 }
        })
        console.log('=== LECTURERS API RESPONSE ===', response.data)

        // Handle different response formats
        let lecturerData: any[] = []
        if (Array.isArray(response.data)) {
          lecturerData = response.data
        } else if (response.data?.results) {
          lecturerData = response.data.results
        } else if (response.data?.data) {
          lecturerData = response.data.data
        }

        // Transform to LecturerDTO format
        const transformedLecturers: LecturerDTO[] = lecturerData.map((l: any) => ({
          id: l.id || l.codeUser,
          name: l.name || l.fullName || 'Unknown',
          fullName: l.fullName || l.name || 'Unknown'
        }))

        console.log('=== TRANSFORMED LECTURERS ===', transformedLecturers)
        setLecturers(transformedLecturers)
      } catch (error) {
        console.error('Error fetching lecturers:', error)
      }
    }
    fetchLecturers()
  }, [])

  // Store all classes from API (before client-side filtering)
  const [allClasses, setAllClasses] = useState<ClassDisplay[]>([])

  // Fetch classes from API - chỉ gọi khi status thay đổi
  const fetchClasses = async () => {
    try {
      setLoading(true)

      // Build query params - CHỈ status (keyword và teacherId filter client-side)
      const params: Record<string, string> = {}
      if (status !== '') params.status = status

      // === GỌI API GET /api/admin/classes ===
      const response = await api.get<{ results: ClassDTO[] }>('/api/admin/classes', { params })

      console.log('=== CLASSES API RESPONSE ===', response.data)

      // Transform ClassDTO to ClassDisplay format
      const transformedClasses: ClassDisplay[] = (response.data.results || []).map((dto) => ({
        id: dto.id,
        classCode: dto.id,
        name: dto.name,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        room: dto.room,
        semester: dto.semester,
        studentCount: dto.studentCount || 0,
        status: dto.status,
        description: dto.description || ''
      }))

      setAllClasses(transformedClasses)
    } catch (error: any) {
      console.error('Error fetching classes:', error)
      toaster.create({
        title: 'Lỗi tải dữ liệu',
        description: error.response?.data?.message || 'Không thể tải danh sách lớp học',
        type: 'error'
      })
      setAllClasses([])
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount và khi status thay đổi (keyword, teacherId filter client-side)
  useEffect(() => {
    fetchClasses()
  }, [status])

  // Client-side filter by keyword và teacherId
  useEffect(() => {
    let filtered = [...allClasses]

    // Filter by keyword (tên lớp, mã lớp, học phần)
    if (keyword.trim()) {
      const searchTerm = keyword.trim().toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm) ||
          c.classCode.toLowerCase().includes(searchTerm) ||
          c.subjectId.toLowerCase().includes(searchTerm)
      )
    }

    // Filter by teacherId
    if (teacherId) {
      filtered = filtered.filter((c) => c.teacherId === teacherId)
    }

    setClasses(filtered)
  }, [keyword, teacherId, allClasses])

  // Handle clear filters
  const handleClearFilters = () => {
    setKeyword('')
    setTeacherId('')
    setStatus('')
  }

  // Check if any filter is active
  const hasActiveFilters = keyword || teacherId || status !== ''

  // Handle edit class - navigate to edit page với classData và lecturers
  const handleEditClass = (classItem: ClassDisplay) => {
    navigate(`/admin/classes-management/edit/${classItem.id}`, {
      state: { classData: classItem, lecturers }
    })
  }

  // Handle deactivate class (ban)
  const handleDeactivateClass = async (classItem: ClassDisplay) => {
    if (classItem.status === 0) {
      toaster.create({
        title: 'Thông báo',
        description: 'Lớp học này đã được đóng trước đó.',
        type: 'info'
      })
      return
    }

    if (!confirm(`Bạn có chắc muốn đóng lớp học "${classItem.name}"?`)) {
      return
    }

    try {
      // === GỌI API PATCH /api/admin/classes/deactivate/{id} ===
      await api.patch(`/api/admin/classes/deactivate/${classItem.id}`)

      toaster.create({
        title: 'Thành công',
        description: `Đã đóng lớp học "${classItem.name}"`,
        type: 'success'
      })

      // Refresh list
      fetchClasses()
    } catch (error: any) {
      console.error('Error deactivating class:', error)
      toaster.create({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể đóng lớp học',
        type: 'error'
      })
    }
  }

  const columns: Column<ClassDisplay>[] = [
    {
      header: 'Mã lớp',
      accessor: 'classCode',
      render: (row) => <div className='font-mono text-sm font-bold text-[#293548]'>{row.classCode}</div>
    },
    {
      header: 'Tên lớp',
      accessor: 'name',
      render: (row) => <div className='font-bold text-[#293548]'>{row.name}</div>
    },
    {
      header: 'Học phần',
      accessor: 'subjectId',
      render: (row) => (
        <span className='text-sm text-slate-700 font-medium bg-blue-50 px-2 py-1 rounded'>{row.subjectId}</span>
      )
    },
    {
      header: 'Giảng viên',
      accessor: 'teacherId',
      render: (row) => (
        <div className='flex items-center gap-2'>
          <div className='w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600'>
            <User size={12} />
          </div>
          <span className='text-slate-700 text-sm'>{row.teacherId}</span>
        </div>
      )
    },
    {
      header: 'Phòng',
      accessor: 'room',
      render: (row) => <span className='text-sm text-slate-600'>{row.room || 'N/A'}</span>
    },
    {
      header: 'Sĩ số',
      accessor: 'studentCount',
      render: (row) => (
        <span
          className={`px-2.5 py-1 rounded-md text-xs font-semibold ${row.studentCount >= 40 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}
        >
          {row.studentCount}
        </span>
      )
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (row) =>
        row.status === 1 ? (
          <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-600 bg-emerald-50'>
            <Clock size={12} /> Hoạt động
          </span>
        ) : (
          <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-slate-500 bg-slate-100'>
            <CheckCircle size={12} /> Đã đóng
          </span>
        )
    }
  ]

  return (
    <div className='space-y-4'>
      {/* Filter Section */}
      <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-4'>
        <div className='flex flex-wrap gap-3 items-end'>
          {/* Search Keyword */}
          <div className='flex-1 min-w-[250px]'>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              <Search size={14} className='inline mr-1' />
              Tìm kiếm
            </label>
            <input
              type='text'
              placeholder='Nhập tên lớp học...'
              value={keyword}
              onChange={(e) => setKeyword(e.target.value.toUpperCase())}
              className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dd7323] focus:border-transparent uppercase'
            />
          </div>

          {/* Teacher Filter - load từ API */}
          <div className='w-64'>
            <label className='block text-sm font-medium text-slate-700 mb-1'>Giảng viên</label>
            <SelectRoot
              collection={createListCollection({
                items: [
                  { label: 'Tất cả giảng viên', value: '' },
                  ...lecturers.map((l) => ({ label: `${l.id} - ${l.name || l.fullName}`, value: l.id }))
                ]
              })}
              value={teacherId ? [teacherId] : []}
              onValueChange={(e: any) => setTeacherId(e.value[0] || '')}
              size='sm'
              variant='outline'
              positioning={{ sameWidth: true }}
            >
              <SelectTrigger clearable>
                <SelectValueText placeholder='Tất cả giảng viên' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem item={{ label: 'Tất cả giảng viên', value: '' }}>Tất cả giảng viên</SelectItem>
                {lecturers.map((lecturer) => (
                  <SelectItem
                    key={lecturer.id}
                    item={{ label: `${lecturer.id} - ${lecturer.name || lecturer.fullName}`, value: lecturer.id }}
                  >
                    {lecturer.id} - {lecturer.name || lecturer.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>

          {/* Status Filter */}
          <div className='w-40'>
            <label className='block text-sm font-medium text-slate-700 mb-1'>Trạng thái</label>
            <SelectRoot
              collection={createListCollection({
                items: [
                  { label: 'Tất cả', value: '' },
                  { label: 'Đang hoạt động', value: '1' },
                  { label: 'Đã đóng', value: '0' }
                ]
              })}
              value={status ? [status] : []}
              onValueChange={(e: any) => setStatus(e.value[0] || '')}
              size='sm'
              variant='outline'
              positioning={{ sameWidth: true }}
            >
              <SelectTrigger clearable>
                <SelectValueText placeholder='Tất cả' />
              </SelectTrigger>
              <SelectContent>
                {[
                  { label: 'Tất cả', value: '' },
                  { label: 'Đang hoạt động', value: '1' },
                  { label: 'Đã đóng', value: '0' }
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
          <p className='text-slate-600'>Đang tải danh sách lớp học...</p>
        </div>
      ) : (
        <TableList
          title='Quản lý Lớp học'
          subtitle='Danh sách và thông tin các lớp học.'
          data={classes}
          columns={columns}
          onAdd={() => navigate('/admin/classes-management/create', { state: { lecturers } })}
          onEdit={handleEditClass}
          onDelete={handleDeactivateClass}
          deleteLabel='Đóng lớp'
        />
      )}
    </div>
  )
}

export default ClassesList
