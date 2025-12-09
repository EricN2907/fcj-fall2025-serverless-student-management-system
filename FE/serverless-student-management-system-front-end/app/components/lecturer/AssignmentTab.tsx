'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Spinner,
  Badge,
  Card,
  Table,
  Button,
  Input,
  createListCollection
} from '@chakra-ui/react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState
} from '@tanstack/react-table'
import { FileText, ArrowUpDown, Plus, Search, Edit, Lock, Unlock } from 'lucide-react'
import StatsCard from '../ui/StatsCard'
import EmptyState from '../ui/EmptyState'
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValueText } from '../ui/select'
import CreateAssignmentModal, { type AssignmentFormData } from './CreateAssignmentModal'
import EditAssignmentModal, { type EditAssignmentFormData } from './EditAssignmentModal'
import AssignmentDetailModal from './AssignmentDetailModal'
import { lecturerAssignmentApi } from '../../services/lecturerApi'
import { toaster } from '../ui/toaster'
import type { AssignmentDTO } from '../../types'

// Filter collections for Select components
const typeFilterCollection = createListCollection({
  items: [
    { value: '', label: 'Tất cả loại' },
    { value: 'homework', label: 'Bài tập' },
    { value: 'project', label: 'Dự án' },
    { value: 'midterm', label: 'Giữa kỳ' },
    { value: 'final', label: 'Cuối kỳ' }
  ]
})

const statusFilterCollection = createListCollection({
  items: [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'open', label: 'Đang mở' },
    { value: 'closed', label: 'Đã đóng' }
  ]
})

// Extended mock data with graded_count
interface ExtendedAssignmentDTO extends AssignmentDTO {
  graded_count?: number
}

interface AssignmentTabProps {
  classId: string
}

const TYPE_LABELS: Record<string, string> = {
  homework: 'Bài tập',
  project: 'Dự án',
  midterm: 'Giữa kỳ',
  final: 'Cuối kỳ'
}

const TYPE_COLORS: Record<string, string> = {
  homework: 'green',
  project: 'purple',
  midterm: 'orange',
  final: 'red'
}

export default function LecturerAssignmentTab({ classId }: AssignmentTabProps) {
  const [assignments, setAssignments] = useState<ExtendedAssignmentDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])

  // Filters
  const [searchKeyword, setSearchKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<ExtendedAssignmentDTO | null>(null)

  const fetchAssignments = useCallback(async () => {
    setLoading(true)
    try {
      const response = await lecturerAssignmentApi.getAssignments(classId)
      console.log('Assignments response:', response)
      // BE trả về { data: [...], count, message, status }
      const rawData = (response as any)?.data || response?.results || []
      // Transform camelCase từ API sang snake_case cho UI
      const data = rawData.map((item: any) => ({
        ...item,
        is_published: item.isPublished ?? item.is_published,
        max_score: item.maxScore ?? item.max_score,
        submission_count: item.submissionCount ?? item.submission_count ?? 0,
        created_at: item.createdAt ?? item.created_at,
        updated_at: item.updatedAt ?? item.updated_at
      }))
      setAssignments(data)
    } catch (err) {
      console.error('Failed to fetch assignments:', err)
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  // Filtered data
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      // Search filter
      const matchesSearch = !searchKeyword || a.title.toLowerCase().includes(searchKeyword.toLowerCase())

      // Type filter
      const matchesType = !typeFilter || a.type === typeFilter

      // Status filter (open/closed based on isPublished)
      let matchesStatus = true
      if (statusFilter === 'open') {
        matchesStatus = a.is_published === true
      } else if (statusFilter === 'closed') {
        matchesStatus = a.is_published === false
      }

      return matchesSearch && matchesType && matchesStatus
    })
  }, [assignments, searchKeyword, typeFilter, statusFilter])

  // Stats
  const stats = useMemo(() => {
    const total = assignments.length
    const openCount = assignments.filter((a) => a.is_published).length
    const closedCount = assignments.filter((a) => !a.is_published).length
    return { total, openCount, closedCount }
  }, [assignments])

  // Table columns
  const columns = useMemo<ColumnDef<ExtendedAssignmentDTO>[]>(
    () => [
      {
        accessorKey: 'index',
        header: 'STT',
        cell: ({ row }) => (
          <Text color='gray.600' fontSize='sm'>
            {row.index + 1}
          </Text>
        ),
        size: 50
      },
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <HStack gap={1} cursor='pointer' onClick={() => column.toggleSorting()}>
            <Text>Tiêu đề</Text>
            <ArrowUpDown size={14} />
          </HStack>
        ),
        cell: ({ row }) => (
          <Text fontWeight='medium' color='gray.800'>
            {row.original.title}
          </Text>
        )
      },
      {
        accessorKey: 'type',
        header: 'Loại',
        cell: ({ row }) => (
          <Badge colorPalette={TYPE_COLORS[row.original.type]} variant='subtle' borderRadius='full'>
            {TYPE_LABELS[row.original.type]}
          </Badge>
        ),
        size: 90
      },
      {
        accessorKey: 'deadline',
        header: 'Deadline',
        cell: ({ row }) => {
          const date = new Date(row.original.deadline)
          return (
            <Text color='gray.600' fontSize='sm'>
              {date.toLocaleDateString('vi-VN')}
            </Text>
          )
        },
        size: 100
      },
      {
        accessorKey: 'submission_count',
        header: 'Đã nộp',
        cell: ({ row }) => (
          <Text fontWeight='medium' color='#dd7323'>
            {row.original.submission_count || 0}
          </Text>
        ),
        size: 80
      },
      {
        accessorKey: 'is_published',
        header: 'Trạng thái',
        cell: ({ row }) => {
          const isOpen = row.original.is_published
          return (
            <Badge
              colorPalette={isOpen ? 'green' : 'red'}
              variant='solid'
              borderRadius='full'
              size='sm'
              cursor='pointer'
              _hover={{ opacity: 0.8 }}
              onClick={(e) => {
                e.stopPropagation()
                handleToggleStatus(row.original)
              }}
              title={isOpen ? 'Click để đóng bài tập' : 'Click để mở bài tập'}
            >
              {isOpen ? 'Đang mở' : 'Đã đóng'}
            </Badge>
          )
        },
        size: 100
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <HStack gap={1}>
            <Button
              size='xs'
              variant='ghost'
              color='blue.500'
              _hover={{ bg: 'blue.50' }}
              onClick={(e) => {
                e.stopPropagation()
                handleEditClick(row.original)
              }}
              title='Chỉnh sửa'
            >
              <Edit size={14} />
            </Button>
            {row.original.is_published ? (
              <Button
                size='xs'
                variant='ghost'
                color='green.500'
                _hover={{ bg: 'green.50' }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleCloseAssignment(row.original)
                }}
                title='Đóng bài tập'
              >
                <Unlock size={14} />
              </Button>
            ) : (
              <Button
                size='xs'
                variant='ghost'
                color='red.500'
                _hover={{ bg: 'red.50' }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleReopenAssignment(row.original)
                }}
                title='Mở lại bài tập'
              >
                <Lock size={14} />
              </Button>
            )}
          </HStack>
        ),
        size: 80
      }
    ],
    [classId]
  )

  const table = useReactTable({
    data: filteredAssignments,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  const handleRowClick = (assignment: ExtendedAssignmentDTO) => {
    // Mở modal hiển thị chi tiết assignment
    setSelectedAssignment(assignment)
    setIsDetailModalOpen(true)
  }

  const handleCreateAssignment = async (data: AssignmentFormData) => {
    // Use new API: POST /api/lecturer/assignments
    await lecturerAssignmentApi.createAssignment({
      class_id: classId, // Pass as string, API will handle
      title: data.title,
      description: data.description,
      type: data.type,
      deadline: data.deadline,
      max_score: data.max_score,
      weight: data.weight, // Trọng số từ form
      is_published: data.is_published
    })
    fetchAssignments()
  }

  const handleEditClick = (assignment: ExtendedAssignmentDTO) => {
    setSelectedAssignment(assignment)
    setIsEditModalOpen(true)
  }

  // Toggle status (open/close) directly from table
  const handleToggleStatus = async (assignment: ExtendedAssignmentDTO) => {
    const newStatus = !assignment.is_published
    const actionText = newStatus ? 'mở' : 'đóng'

    try {
      const assignmentId = assignment.id?.toString().replace('ASSIGNMENT#', '') || ''
      await lecturerAssignmentApi.updateAssignment(assignmentId, classId, {
        isPublished: newStatus
      })

      toaster.create({
        title: 'Thành công',
        description: `Đã ${actionText} bài tập "${assignment.title}"`,
        type: 'success'
      })

      fetchAssignments()
    } catch (err: any) {
      console.error('Failed to toggle assignment status:', err)
      toaster.create({
        title: 'Lỗi',
        description: err.response?.data?.message || `Không thể ${actionText} bài tập`,
        type: 'error'
      })
    }
  }

  const handleUpdateAssignment = async (data: EditAssignmentFormData) => {
    if (!selectedAssignment) return

    try {
      // Extract assignment ID (remove prefix if exists)
      const assignmentId = selectedAssignment.id?.toString().replace('ASSIGNMENT#', '') || ''

      await lecturerAssignmentApi.updateAssignment(assignmentId, classId, {
        title: data.title,
        description: data.description,
        type: data.type,
        maxScore: data.maxScore,
        weight: data.weight,
        deadline: data.deadline,
        isPublished: data.isPublished
      })

      toaster.create({
        title: 'Thành công',
        description: 'Đã cập nhật bài tập',
        type: 'success'
      })

      fetchAssignments()
    } catch (err: any) {
      console.error('Failed to update assignment:', err)
      toaster.create({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Không thể cập nhật bài tập',
        type: 'error'
      })
      throw err
    }
  }

  const handleCloseAssignment = async (assignment: ExtendedAssignmentDTO) => {
    if (!confirm(`Bạn có chắc muốn đóng bài tập "${assignment.title}"? Sinh viên sẽ không thể nộp bài nữa.`)) {
      return
    }

    try {
      const assignmentId = assignment.id?.toString().replace('ASSIGNMENT#', '') || ''
      // Đóng bài tập = set isPublished: false
      await lecturerAssignmentApi.updateAssignment(assignmentId, classId, {
        isPublished: false
      })

      toaster.create({
        title: 'Thành công',
        description: 'Đã đóng bài tập',
        type: 'success'
      })

      fetchAssignments()
    } catch (err: any) {
      console.error('Failed to close assignment:', err)
      toaster.create({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Không thể đóng bài tập',
        type: 'error'
      })
    }
  }

  const handleReopenAssignment = async (assignment: ExtendedAssignmentDTO) => {
    try {
      const assignmentId = assignment.id?.toString().replace('ASSIGNMENT#', '') || ''
      // Mở lại bài tập = set isPublished: true
      await lecturerAssignmentApi.updateAssignment(assignmentId, classId, {
        isPublished: true
      })

      toaster.create({
        title: 'Thành công',
        description: 'Đã mở lại bài tập',
        type: 'success'
      })

      fetchAssignments()
    } catch (err: any) {
      console.error('Failed to reopen assignment:', err)
      toaster.create({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Không thể mở lại bài tập',
        type: 'error'
      })
    }
  }

  if (loading) {
    return (
      <VStack gap={3} py={12}>
        <Spinner size='lg' color='#dd7323' />
        <Text color='gray.500'>Đang tải danh sách bài tập...</Text>
      </VStack>
    )
  }

  return (
    <VStack gap={6} align='stretch'>
      {/* Header with Stats and New Button */}
      <HStack justify='space-between' flexWrap='wrap' gap={4}>
        <HStack gap={4} flexWrap='wrap'>
          <Box minW='180px'>
            <StatsCard label='Tổng số bài tập' value={stats.total} icon={FileText} />
          </Box>
          <Box minW='180px'>
            <StatsCard label='Đang mở' value={stats.openCount} icon={Unlock} />
          </Box>
          <Box minW='180px'>
            <StatsCard label='Đang đóng' value={stats.closedCount} icon={Lock} />
          </Box>
        </HStack>
        <Button
          bg='#dd7323'
          color='white'
          borderRadius='xl'
          _hover={{ bg: '#c5651f' }}
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={18} />
          <Text ml={2}>Tạo bài tập mới</Text>
        </Button>
      </HStack>

      {/* Filters */}
      <Card.Root bg='white' borderRadius='xl' border='1px solid' borderColor='orange.200' shadow='sm'>
        <Card.Body p={4}>
          <HStack gap={4} flexWrap='wrap'>
            {/* Search */}
            <Box flex={1} minW='200px' position='relative'>
              <Box position='absolute' left={3} top='50%' transform='translateY(-50%)' color='gray.400'>
                <Search size={18} />
              </Box>
              <Input
                pl={10}
                placeholder='Tìm kiếm theo tiêu đề...'
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                borderColor='orange.200'
                borderRadius='xl'
                _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
              />
            </Box>

            {/* Type Filter */}
            <SelectRoot
              collection={typeFilterCollection}
              value={typeFilter ? [typeFilter] : ['']}
              onValueChange={(details) => setTypeFilter(details.value[0] || '')}
              size='md'
              w='160px'
            >
              <SelectTrigger borderColor='orange.200' borderRadius='xl' _hover={{ borderColor: '#dd7323' }}>
                <SelectValueText placeholder='Tất cả loại' />
              </SelectTrigger>
              <SelectContent>
                {typeFilterCollection.items.map((item) => (
                  <SelectItem key={item.value} item={item}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>

            {/* Status Filter (Open/Closed) */}
            <SelectRoot
              collection={statusFilterCollection}
              value={statusFilter ? [statusFilter] : ['']}
              onValueChange={(details) => setStatusFilter(details.value[0] || '')}
              size='md'
              w='170px'
            >
              <SelectTrigger borderColor='orange.200' borderRadius='xl' _hover={{ borderColor: '#dd7323' }}>
                <SelectValueText placeholder='Tất cả trạng thái' />
              </SelectTrigger>
              <SelectContent>
                {statusFilterCollection.items.map((item) => (
                  <SelectItem key={item.value} item={item}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </HStack>
        </Card.Body>
      </Card.Root>

      {/* Table */}
      {filteredAssignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title='Không tìm thấy bài tập'
          description={assignments.length === 0 ? 'Tạo bài tập mới để bắt đầu' : 'Thử thay đổi bộ lọc'}
        />
      ) : (
        <Card.Root
          bg='white'
          borderRadius='xl'
          border='1px solid'
          borderColor='orange.200'
          shadow='sm'
          overflow='hidden'
        >
          <Table.Root size='sm'>
            <Table.Header>
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Row key={headerGroup.id} bg='orange.50'>
                  {headerGroup.headers.map((header) => (
                    <Table.ColumnHeader
                      key={header.id}
                      py={3}
                      px={3}
                      color='#dd7323'
                      fontWeight='semibold'
                      fontSize='xs'
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </Table.ColumnHeader>
                  ))}
                </Table.Row>
              ))}
            </Table.Header>
            <Table.Body>
              {table.getRowModel().rows.map((row) => (
                <Table.Row
                  key={row.id}
                  cursor='pointer'
                  _hover={{ bg: 'orange.50' }}
                  transition='all 0.2s'
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <Table.Cell key={cell.id} py={3} px={3}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Card.Root>
      )}

      {/* Create Assignment Modal */}
      <CreateAssignmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateAssignment}
        classId={classId}
      />

      {/* Edit Assignment Modal */}
      <EditAssignmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedAssignment(null)
        }}
        onSubmit={handleUpdateAssignment}
        assignment={selectedAssignment}
      />

      {/* Assignment Detail Modal */}
      <AssignmentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedAssignment(null)
        }}
        assignment={selectedAssignment}
        classId={classId}
      />
    </VStack>
  )
}
