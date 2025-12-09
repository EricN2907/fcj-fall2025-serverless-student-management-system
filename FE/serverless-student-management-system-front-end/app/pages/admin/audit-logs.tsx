import { useEffect, useState, useMemo, useRef } from 'react'
import { FileDown, Search, X, Loader2, Activity, Calendar, Filter, Shield } from 'lucide-react'
import { createListCollection, Portal, Box, IconButton, Input, Group } from '@chakra-ui/react'
import { Calendar as DatePicker } from 'react-date-range'
import { vi } from 'date-fns/locale'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import api from '../../utils/axios'
import { toaster } from '../../components/ui/toaster'
import {
  SelectRoot,
  SelectLabel,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem
} from '../../components/ui/select'

// LogDTO from backend - theo API response thực tế
interface LogDTO {
  id: string
  userId: string
  classId: string | null
  actionType: string
  details: string
  timestamp: string
}

interface ActivityLog {
  id: string
  userId: string
  classId: string | null
  actionType: string
  details: string
  timestamp: string
}

export default function AuditLogsRoute() {
  // All logs from API (raw data)
  const [allLogs, setAllLogs] = useState<ActivityLog[]>([])
  // Filtered logs for display
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchUserId, setSearchUserId] = useState('')
  const [searchClassId, setSearchClassId] = useState('')
  const [actionType, setActionType] = useState<string[]>([])
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const startDateRef = useRef<HTMLDivElement>(null)
  const endDateRef = useRef<HTMLDivElement>(null)

  // Create collection for action types - theo API response
  const actionTypeCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: 'Tạo môn học', value: 'CREATE_SUBJECT' },
          { label: 'Cập nhật lớp', value: 'UPDATE_CLASS' },
          { label: 'Tạo lớp', value: 'CREATE_CLASS' },
          { label: 'Khóa lớp', value: 'DEACTIVATE_CLASS' },
          { label: 'Xóa lớp', value: 'DELETE_CLASS' },
          { label: 'Tạo người dùng', value: 'CREATE_USER' },
          { label: 'Cập nhật người dùng', value: 'UPDATE_USER' },
          { label: 'Khóa tài khoản', value: 'BAN_USER' }
        ]
      }),
    []
  )

  // Fetch ALL logs from API once on mount
  const fetchLogs = async () => {
    try {
      setLoading(true)

      // === GỌI API GET /api/admin/audit-logs (không có params - lấy tất cả) ===
      const response = await api.get<{ results: LogDTO[] }>('/api/admin/audit-logs')

      console.log('=== AUDIT LOGS API RESPONSE ===', response.data)

      // Transform LogDTO to ActivityLog format
      const transformedLogs: ActivityLog[] = (response.data.results || []).map((dto) => ({
        id: dto.id,
        userId: dto.userId,
        classId: dto.classId,
        actionType: dto.actionType,
        details: dto.details,
        timestamp: dto.timestamp
      }))

      setAllLogs(transformedLogs)
      setFilteredLogs(transformedLogs)
    } catch (error: any) {
      console.error('Error fetching audit logs:', error)
      toaster.create({
        title: 'Lỗi tải dữ liệu',
        description: error.response?.data?.message || 'Không thể tải nhật ký hoạt động',
        type: 'error'
      })
      setAllLogs([])
      setFilteredLogs([])
    } finally {
      setLoading(false)
    }
  }

  // Load data once on mount
  useEffect(() => {
    fetchLogs()
  }, [])

  // Filter logs on client side when filters change
  useEffect(() => {
    let result = [...allLogs]

    // Filter by User ID
    if (searchUserId.trim()) {
      const searchTerm = searchUserId.trim().toUpperCase()
      result = result.filter((log) => log.userId.toUpperCase().includes(searchTerm))
    }

    // Filter by Class ID
    if (searchClassId.trim()) {
      const searchTerm = searchClassId.trim().toUpperCase()
      result = result.filter((log) => log.classId && log.classId.toUpperCase().includes(searchTerm))
    }

    // Filter by action type
    if (actionType.length > 0) {
      result = result.filter((log) => actionType.includes(log.actionType))
    }

    // Filter by date range
    if (startDate) {
      const startOfDay = new Date(startDate)
      startOfDay.setHours(0, 0, 0, 0)
      result = result.filter((log) => new Date(log.timestamp) >= startOfDay)
    }

    if (endDate) {
      const endOfDay = new Date(endDate)
      endOfDay.setHours(23, 59, 59, 999)
      result = result.filter((log) => new Date(log.timestamp) <= endOfDay)
    }

    setFilteredLogs(result)
  }, [allLogs, searchUserId, searchClassId, actionType, startDate, endDate])

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchUserId('')
    setSearchClassId('')
    setActionType([])
    setStartDate(undefined)
    setEndDate(undefined)
  }

  // Check if any filter is active
  const hasActiveFilters = searchUserId || searchClassId || actionType.length > 0 || startDate || endDate

  // Export logs to CSV
  const exportLogs = () => {
    try {
      const headers = ['Thời gian', 'User ID', 'Class ID', 'Hành động', 'Chi tiết']
      const csvContent = [
        headers.join(','),
        ...filteredLogs.map((log) =>
          [
            new Date(log.timestamp).toLocaleString('vi-VN'),
            log.userId,
            log.classId || 'N/A',
            log.actionType,
            `"${log.details.replace(/"/g, '""')}"`
          ].join(',')
        )
      ].join('\n')

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      toaster.create({
        title: 'Thành công',
        description: 'Đã xuất file CSV thành công!',
        type: 'success'
      })
    } catch (error) {
      toaster.create({
        title: 'Lỗi',
        description: 'Không thể xuất file CSV',
        type: 'error'
      })
    }
  }

  // Get action badge color and label
  const getActionInfo = (actionType: string) => {
    const actionMap: Record<string, { color: string; label: string }> = {
      CREATE_SUBJECT: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Tạo môn học' },
      UPDATE_CLASS: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Cập nhật lớp' },
      CREATE_CLASS: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Tạo lớp' },
      DEACTIVATE_CLASS: { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Khóa lớp' },
      DELETE_CLASS: { color: 'bg-red-50 text-red-700 border-red-200', label: 'Xóa lớp' },
      CREATE_USER: { color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Tạo người dùng' },
      UPDATE_USER: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Cập nhật người dùng' },
      BAN_USER: { color: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Khóa tài khoản' }
    }
    return actionMap[actionType] || { color: 'bg-slate-50 text-slate-700 border-slate-200', label: actionType }
  }

  // Format timestamp to show date and time separately
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
  }

  return (
    <div className='max-w-7xl mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='bg-[#dd7323]/10 p-3 rounded-lg'>
            <Shield size={28} className='text-[#dd7323]' />
          </div>
          <div>
            <h1 className='text-2xl font-bold text-slate-800'>Nhật ký Hoạt động</h1>
            <p className='text-slate-600 text-sm'>Theo dõi tất cả hoạt động trong hệ thống</p>
          </div>
        </div>
        <button
          onClick={exportLogs}
          disabled={filteredLogs.length === 0}
          className='flex items-center gap-2 px-4 py-2 bg-[#dd7323] text-white font-medium rounded-lg hover:bg-[#c2621a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <FileDown size={18} />
          Xuất CSV
        </button>
      </div>

      {/* Filters Section */}
      <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-4'>
        <div className='flex items-center gap-2 mb-3'>
          <Filter size={16} className='text-slate-600' />
          <h3 className='font-semibold text-slate-700'>Bộ lọc</h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3'>
          {/* Search User ID */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              <Search size={14} className='inline mr-1' />
              User ID
            </label>
            <input
              type='text'
              placeholder='VD: ADMIN, GV01...'
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value.toUpperCase())}
              className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dd7323] focus:border-transparent text-sm uppercase'
            />
          </div>

          {/* Search Class ID */}
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              <Search size={14} className='inline mr-1' />
              Class ID
            </label>
            <input
              type='text'
              placeholder='VD: SE1700...'
              value={searchClassId}
              onChange={(e) => setSearchClassId(e.target.value.toUpperCase())}
              className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dd7323] focus:border-transparent text-sm uppercase'
            />
          </div>

          {/* Action Type Filter */}
          <div>
            <SelectRoot
              collection={actionTypeCollection}
              value={actionType}
              onValueChange={(e) => setActionType(e.value)}
              size='sm'
            >
              <SelectLabel fontSize='sm' fontWeight='medium' color='slate.700' mb='1'>
                <Activity size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Hành động
              </SelectLabel>
              <SelectTrigger>
                <SelectValueText placeholder='Tất cả' />
              </SelectTrigger>
              <SelectContent>
                {actionTypeCollection.items.map((action) => (
                  <SelectItem key={action.value} item={action}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>

          {/* Start Date Filter */}
          <div ref={startDateRef} style={{ position: 'relative' }}>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              <Calendar size={14} className='inline mr-1' />
              Từ ngày
            </label>
            <Group attached w='full'>
              <Input
                placeholder='Chọn ngày...'
                value={startDate ? startDate.toLocaleDateString('vi-VN') : ''}
                readOnly
                onClick={() => setShowStartDatePicker(true)}
                cursor='pointer'
                size='sm'
                borderColor='slate.300'
                _hover={{ borderColor: 'slate.400' }}
                _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
              />
              {startDate ? (
                <IconButton
                  aria-label='Clear start date'
                  size='sm'
                  variant='ghost'
                  onClick={(e) => {
                    e.stopPropagation()
                    setStartDate(undefined)
                  }}
                >
                  <X size={14} />
                </IconButton>
              ) : (
                <Box
                  px='3'
                  display='flex'
                  alignItems='center'
                  cursor='pointer'
                  onClick={() => setShowStartDatePicker(true)}
                >
                  <Calendar size={14} className='text-slate-400' />
                </Box>
              )}
            </Group>
            {showStartDatePicker && (
              <Portal>
                <Box
                  position='fixed'
                  zIndex={9999}
                  bg='white'
                  borderRadius='md'
                  boxShadow='lg'
                  border='1px solid'
                  borderColor='slate.200'
                  p={3}
                  style={{
                    top: startDateRef.current ? startDateRef.current.getBoundingClientRect().bottom + 5 : 0,
                    left: startDateRef.current ? startDateRef.current.getBoundingClientRect().left : 0
                  }}
                >
                  <DatePicker
                    date={startDate || new Date()}
                    onChange={(date) => {
                      setStartDate(date)
                      setShowStartDatePicker(false)
                    }}
                    maxDate={endDate || new Date()}
                    locale={vi}
                    color='#dd7323'
                  />
                  <Box display='flex' justifyContent='flex-end' mt={2} gap={2}>
                    <IconButton
                      aria-label='Close'
                      size='xs'
                      variant='ghost'
                      onClick={() => setShowStartDatePicker(false)}
                    >
                      <X size={14} />
                    </IconButton>
                  </Box>
                </Box>
              </Portal>
            )}
          </div>

          {/* End Date Filter */}
          <div ref={endDateRef} style={{ position: 'relative' }}>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              <Calendar size={14} className='inline mr-1' />
              Đến ngày
            </label>
            <Group attached w='full'>
              <Input
                placeholder='Chọn ngày...'
                value={endDate ? endDate.toLocaleDateString('vi-VN') : ''}
                readOnly
                onClick={() => setShowEndDatePicker(true)}
                cursor='pointer'
                size='sm'
                borderColor='slate.300'
                _hover={{ borderColor: 'slate.400' }}
                _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
              />
              {endDate ? (
                <IconButton
                  aria-label='Clear end date'
                  size='sm'
                  variant='ghost'
                  onClick={(e) => {
                    e.stopPropagation()
                    setEndDate(undefined)
                  }}
                >
                  <X size={14} />
                </IconButton>
              ) : (
                <Box
                  px='3'
                  display='flex'
                  alignItems='center'
                  cursor='pointer'
                  onClick={() => setShowEndDatePicker(true)}
                >
                  <Calendar size={14} className='text-slate-400' />
                </Box>
              )}
            </Group>
            {showEndDatePicker && (
              <Portal>
                <Box
                  position='fixed'
                  zIndex={9999}
                  bg='white'
                  borderRadius='md'
                  boxShadow='lg'
                  border='1px solid'
                  borderColor='slate.200'
                  p={3}
                  style={{
                    top: endDateRef.current ? endDateRef.current.getBoundingClientRect().bottom + 5 : 0,
                    left: endDateRef.current ? endDateRef.current.getBoundingClientRect().left : 0
                  }}
                >
                  <DatePicker
                    date={endDate || new Date()}
                    onChange={(date) => {
                      setEndDate(date)
                      setShowEndDatePicker(false)
                    }}
                    minDate={startDate}
                    maxDate={new Date()}
                    locale={vi}
                    color='#dd7323'
                  />
                  <Box display='flex' justifyContent='flex-end' mt={2} gap={2}>
                    <IconButton
                      aria-label='Close'
                      size='xs'
                      variant='ghost'
                      onClick={() => setShowEndDatePicker(false)}
                    >
                      <X size={14} />
                    </IconButton>
                  </Box>
                </Box>
              </Portal>
            )}
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className='mt-3 flex justify-end'>
            <button
              onClick={handleClearFilters}
              className='flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm'
            >
              <X size={14} />
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className='bg-white rounded-lg shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center'>
          <Loader2 size={40} className='text-[#dd7323] animate-spin mb-3' />
          <p className='text-slate-600'>Đang tải nhật ký hoạt động...</p>
        </div>
      ) : (
        <div className='bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-slate-50 border-b border-slate-200'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider'>
                    Ngày
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider'>
                    Giờ
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider'>
                    User ID
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider'>
                    Class ID
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider'>
                    Hành động
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider'>
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-200'>
                {filteredLogs.map((log) => {
                  const actionInfo = getActionInfo(log.actionType)
                  const { date, time } = formatTimestamp(log.timestamp)
                  return (
                    <tr key={log.id} className='hover:bg-slate-50 transition-colors'>
                      <td className='px-4 py-3 text-sm text-slate-900 whitespace-nowrap font-medium'>{date}</td>
                      <td className='px-4 py-3 text-sm text-slate-600 whitespace-nowrap'>{time}</td>
                      <td className='px-4 py-3'>
                        <span className='text-sm font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded'>
                          {log.userId}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-sm text-slate-700'>
                        {log.classId ? (
                          <span className='bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium'>
                            {log.classId}
                          </span>
                        ) : (
                          <span className='text-slate-400'>-</span>
                        )}
                      </td>
                      <td className='px-4 py-3'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${actionInfo.color}`}
                        >
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-sm text-slate-600 max-w-md'>
                        <div className='truncate' title={log.details}>
                          {log.details}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className='text-center py-12'>
              <Activity size={48} className='mx-auto text-slate-300 mb-3' />
              <p className='text-slate-500 font-medium'>Không có nhật ký hoạt động</p>
              <p className='text-slate-400 text-sm mt-1'>Thử thay đổi bộ lọc để xem kết quả khác</p>
            </div>
          )}

          {/* Info footer */}
          {filteredLogs.length > 0 && (
            <div className='px-4 py-3 bg-slate-50 border-t border-slate-200 text-sm text-slate-600'>
              Hiển thị <span className='font-semibold text-slate-900'>{filteredLogs.length}</span>
              {filteredLogs.length !== allLogs.length && <span> / {allLogs.length}</span>} nhật ký hoạt động
            </div>
          )}
        </div>
      )}
    </div>
  )
}
