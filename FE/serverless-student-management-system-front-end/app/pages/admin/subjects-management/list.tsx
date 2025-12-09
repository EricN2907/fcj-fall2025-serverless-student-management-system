import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import TableList, { type Column } from '../../../components/common/TableList'
import { Book, Search, X, Loader2, CheckCircle, BookOpen, Calendar } from 'lucide-react'
import type { Subject } from '../../../types'
import api from '../../../utils/axios'
import { toaster } from '../../../components/ui/toaster'
import { createListCollection } from '@chakra-ui/react'
import { SelectRoot, SelectTrigger, SelectValueText, SelectContent, SelectItem } from '../../../components/ui/select'

const SubjectsList: React.FC = () => {
  const navigate = useNavigate()

  // States for data and loading
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]) // Dữ liệu gốc từ API
  const [loading, setLoading] = useState<boolean>(true)

  // States for filters
  const [keyword, setKeyword] = useState<string>('') // Filter client-side
  const [status, setStatus] = useState<string>('') // Filter gọi API

  // Filter subjects client-side theo keyword
  const filteredSubjects = allSubjects.filter((subject) => {
    if (!keyword.trim()) return true
    const searchTerm = keyword.trim().toLowerCase()
    return subject.codeSubject.toLowerCase().includes(searchTerm) || subject.name.toLowerCase().includes(searchTerm)
  })

  // ============================================
  // API Response Type từ BE
  // Response: { data: [{ id, title, subtitle, type, avatar, extraInfo, status }] }
  // id: "SUBJECT#PRN211", title: "Cross-Platform", subtitle: "PRN211"
  // extraInfo: "Credits: 3 | Dept: SE | Status: 1"
  // ============================================
  interface SubjectFromAPI {
    id: string // "SUBJECT#PRN211"
    title: string // name trong DB -> "Cross-Platform"
    subtitle: string // codeSubject trong DB -> "PRN211"
    type: string
    avatar: string | null
    extraInfo: string // "Credits: X | Dept: Y | Status: 0/1"
    status?: number // có thể BE trả về trực tiếp
    created_at?: string // ngày tạo từ API
    createdAt?: string // ngày tạo (alternative field name)
  }

  // Transform API response item to Subject format
  const transformSubjectFromAPI = (item: SubjectFromAPI, index: number): Subject => {
    // Parse extraInfo: "Credits: 3 | Dept: SE | Status: 1"
    const creditsMatch = item.extraInfo?.match(/Credits:\s*(\d+)/)
    const deptMatch = item.extraInfo?.match(/Dept:\s*(\w+)/)
    const statusMatch = item.extraInfo?.match(/Status:\s*(\d+)/)

    // Extract codeSubject from subtitle (e.g., "PRN211")
    const codeSubject = item.subtitle || item.id.replace('SUBJECT#', '')

    // Parse status: từ field status hoặc từ extraInfo, mặc định là 1
    let subjectStatus = 1
    if (item.status !== undefined) {
      subjectStatus = item.status
    } else if (statusMatch) {
      subjectStatus = parseInt(statusMatch[1])
    }

    return {
      id: index + 1,
      codeSubject: codeSubject,
      name: item.title,
      credits: creditsMatch ? parseInt(creditsMatch[1]) : 0,
      department: deptMatch ? deptMatch[1] : '',
      description: '',
      status: subjectStatus,
      created_at: item.created_at || item.createdAt || '',
      updated_at: ''
    }
  }

  // Fetch subjects from API - chỉ gọi khi status thay đổi
  const fetchSubjects = async () => {
    try {
      setLoading(true)

      // === GỌI API GET /api/admin/subjects với params status ===
      const params: Record<string, string> = {}
      if (status !== '') params.status = status

      const response = await api.get<{ data: SubjectFromAPI[] }>('/api/admin/subjects', { params })
      console.log('=== SUBJECTS API RESPONSE ===', response.data)

      const transformedSubjects: Subject[] = (response.data.data || []).map(transformSubjectFromAPI)
      setAllSubjects(transformedSubjects)
    } catch (error: any) {
      console.error('Error fetching subjects:', error)
      toaster.create({
        title: 'Lỗi tải dữ liệu',
        description: error.response?.data?.message || 'Không thể tải danh sách môn học',
        type: 'error'
      })
      setAllSubjects([])
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount và khi status thay đổi (keyword filter client-side)
  useEffect(() => {
    fetchSubjects()
  }, [status])

  // Handle clear filters
  const handleClearFilters = () => {
    setKeyword('')
    setStatus('')
  }

  // Check if any filter is active
  const hasActiveFilters = keyword || status !== ''

  // Handle edit subject - navigate to edit page với data từ UI
  const handleEditSubject = (subject: Subject) => {
    navigate(`/admin/subjects-management/edit/${subject.codeSubject}`, {
      state: { subject }
    })
  }

  // Handle delete subject - PATCH /api/admin/subjects/{codeSubject}/delete
  const handleDeleteSubject = async (subject: Subject) => {
    const confirmMessage = `Bạn có chắc muốn xóa môn học "${subject.codeSubject} - ${subject.name}"?`

    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      // === GỌI API PATCH /api/admin/subjects/{codeSubject}/delete ===
      await api.patch(`/api/admin/subjects/${subject.codeSubject}/delete`)

      toaster.create({
        title: 'Thành công',
        description: `Đã xóa môn học "${subject.codeSubject}" thành công!`,
        type: 'success'
      })

      // Refresh the list
      fetchSubjects()
    } catch (error: any) {
      console.error('Error deleting subject:', error)
      toaster.create({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xóa môn học. Vui lòng thử lại!',
        type: 'error'
      })
    }
  }

  // Define table columns
  const columns: Column<Subject>[] = [
    {
      header: 'Mã môn học',
      accessor: 'codeSubject',
      render: (row) => (
        <span className='font-mono font-bold text-[#293548] px-2 py-1 bg-slate-100 rounded text-xs border border-slate-200'>
          {row.codeSubject}
        </span>
      )
    },
    {
      header: 'Tên môn học',
      accessor: 'name',
      render: (row) => (
        <div className='flex items-center gap-2'>
          <Book size={16} className='text-[#dd7323]' />
          <span className='font-medium text-slate-700'>{row.name}</span>
        </div>
      )
    },
    {
      header: 'Ngày tạo',
      accessor: 'created_at',
      render: (row) => {
        if (!row.created_at) return <span className='text-slate-400'>-</span>
        // Format date: 2024-01-15T10:30:00Z -> 15/01/2024
        const date = new Date(row.created_at)
        const formatted = date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
        return (
          <div className='flex items-center gap-1.5 text-slate-600'>
            <Calendar size={14} className='text-slate-400' />
            <span>{formatted}</span>
          </div>
        )
      }
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (row) =>
        row.status === 1 ? (
          <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-600 bg-emerald-50'>
            <BookOpen size={12} /> Đang giảng dạy
          </span>
        ) : (
          <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-slate-500 bg-slate-100'>
            <CheckCircle size={12} /> Ngừng giảng dạy
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
              placeholder='Nhập mã HP hoặc tên môn học...'
              value={keyword}
              onChange={(e) => setKeyword(e.target.value.toUpperCase())}
              className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dd7323] focus:border-transparent uppercase'
            />
          </div>

          {/* Status Filter */}
          <div className='w-40'>
            <label className='block text-sm font-medium text-slate-700 mb-1'>Trạng thái</label>
            <SelectRoot
              collection={createListCollection({
                items: [
                  { label: 'Tất cả', value: '' },
                  { label: 'Đang mở', value: '1' },
                  { label: 'Đóng', value: '0' }
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
                  { label: 'Đang mở', value: '1' },
                  { label: 'Đóng', value: '0' }
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
          <p className='text-slate-600'>Đang tải danh sách môn học...</p>
        </div>
      ) : (
        <TableList
          title='Quản lý Môn học'
          subtitle='Danh sách các môn học.'
          data={filteredSubjects}
          columns={columns}
          onAdd={() => navigate('/admin/subjects-management/create')}
          onEdit={handleEditSubject}
          onDelete={handleDeleteSubject}
          deleteLabel='Ngừng giảng dạy'
        />
      )}
    </div>
  )
}

export default SubjectsList
