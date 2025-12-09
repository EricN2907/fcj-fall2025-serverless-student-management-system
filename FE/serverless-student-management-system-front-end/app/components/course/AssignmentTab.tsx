'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Box, Text, VStack, HStack, Spinner, Badge, Card, Table, Button } from '@chakra-ui/react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState
} from '@tanstack/react-table'
import { FileText, ArrowUpDown, Eye } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import SubmissionModal from './SubmissionModal'
import AssignmentDetailModal from './AssignmentDetailModal'
import api from '../../utils/axios'

// ============================================
// MOCK DATA - Set to false to use real API
// ============================================
const USE_MOCK_DATA = false

const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 1,
    title: 'Lab 01 - Giới thiệu Python',
    type: 'homework',
    deadline: '2024-10-10T23:59:00Z',
    max_score: 10
  },
  {
    id: 2,
    title: 'Lab 02 - Biến và kiểu dữ liệu',
    type: 'homework',
    deadline: '2024-10-17T23:59:00Z',
    max_score: 10
  },
  {
    id: 3,
    title: 'Project Phase 1 - Phân tích yêu cầu',
    type: 'project',
    deadline: '2024-10-25T23:59:00Z',
    max_score: 10
  },
  {
    id: 4,
    title: 'Kiểm tra giữa kỳ',
    type: 'midterm',
    deadline: '2024-11-15T10:00:00Z',
    max_score: 10
  },
  {
    id: 5,
    title: 'Lab 03 - Vòng lặp và điều kiện',
    type: 'homework',
    deadline: '2025-12-20T23:59:00Z',
    max_score: 10
  },
  {
    id: 6,
    title: 'Project Phase 2 - Thiết kế hệ thống',
    type: 'project',
    deadline: '2025-12-25T23:59:00Z',
    max_score: 10
  },
  {
    id: 7,
    title: 'Thi cuối kỳ',
    type: 'final',
    deadline: '2025-12-30T08:00:00Z',
    max_score: 10
  }
]

interface Assignment {
  id: number | string
  title: string
  type: 'homework' | 'project' | 'midterm' | 'final'
  deadline: string
  max_score: number
  description?: string
}

interface AssignmentTabProps {
  classId: string | number
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

export default function AssignmentTab({ classId }: AssignmentTabProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])

  // Modal states
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [isResubmit, setIsResubmit] = useState(false) // true nếu đang nộp lại bài đã nộp

  const fetchAssignments = useCallback(async () => {
    setLoading(true)

    // Use mock data for UI testing
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 400))
      setAssignments(MOCK_ASSIGNMENTS)
      setLoading(false)
      return
    }

    try {
      // API: GET /api/student/assignments?classId=xxx
      const response = await api.get('/api/student/assignments', {
        params: { classId }
      })
      console.log('Assignments response:', response.data)
      // Handle different response formats
      const data = response.data?.results || response.data?.data || response.data || []
      setAssignments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch assignments:', err)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  // Stats - chỉ hiển thị tổng số bài tập
  const stats = useMemo(() => {
    return { total: assignments.length }
  }, [assignments])

  // Handle row click - mở modal chi tiết
  const handleRowClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setIsDetailModalOpen(true)
  }

  // Handle submit click từ detail modal
  const handleOpenSubmitModal = (resubmit: boolean = false) => {
    setIsResubmit(resubmit)
    setIsDetailModalOpen(false)
    setIsSubmitModalOpen(true)
  }

  // Handle submission success
  const handleSubmitSuccess = () => {
    // Refresh để cập nhật UI
    fetchAssignments()
  }

  // Check if deadline has passed
  const isOverdue = (deadline: string) => new Date(deadline) < new Date()

  // Table columns - chỉ hiển thị STT, Tiêu đề, Loại, Deadline, Xem chi tiết
  const columns = useMemo<ColumnDef<Assignment>[]>(
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
        header: ({ column }) => (
          <HStack gap={1} cursor='pointer' onClick={() => column.toggleSorting()}>
            <Text>Deadline</Text>
            <ArrowUpDown size={14} />
          </HStack>
        ),
        cell: ({ row }) => {
          const date = new Date(row.original.deadline)
          const overdue = isOverdue(row.original.deadline)
          return (
            <Text color={overdue ? 'red.500' : 'gray.600'} fontSize='sm'>
              {date.toLocaleDateString('vi-VN')}
            </Text>
          )
        },
        size: 100
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Box display='flex' justifyContent='center' w='full'>
            <Button
              size='xs'
              variant='ghost'
              colorPalette='orange'
              borderRadius='lg'
              onClick={(e) => {
                e.stopPropagation()
                handleRowClick(row.original)
              }}
              px={3}
            >
              <Eye size={14} />
              <Text ml={1} fontSize='xs'>
                Xem
              </Text>
            </Button>
          </Box>
        ),
        size: 80
      }
    ],
    []
  )

  const table = useReactTable({
    data: assignments,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  if (loading) {
    return (
      <VStack gap={3} py={12}>
        <Spinner size='lg' color='#dd7323' />
        <Text color='gray.500'>Đang tải danh sách bài tập...</Text>
      </VStack>
    )
  }

  return (
    <>
      <VStack gap={6} align='stretch'>
        {/* Stats - chỉ hiển thị tổng số bài tập */}
        <HStack gap={4} flexWrap='wrap'>
          <Box minW='200px'>
            <Card.Root bg='white' borderRadius='xl' border='1px solid' borderColor='orange.200' shadow='sm' p={4}>
              <HStack gap={3}>
                <Box p={2} bg='orange.100' borderRadius='lg'>
                  <FileText size={20} color='#dd7323' />
                </Box>
                <VStack align='flex-start' gap={0}>
                  <Text fontSize='2xl' fontWeight='bold' color='#dd7323'>
                    {stats.total}
                  </Text>
                  <Text fontSize='sm' color='gray.600'>
                    Tổng số bài tập
                  </Text>
                </VStack>
              </HStack>
            </Card.Root>
          </Box>
        </HStack>

        {/* Table */}
        {assignments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title='Chưa có bài tập nào'
            description='Giảng viên chưa tạo bài tập cho lớp này'
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
      </VStack>

      {/* Assignment Detail Modal */}
      <AssignmentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        assignment={selectedAssignment}
        classId={String(classId)}
        onSubmitClick={handleOpenSubmitModal}
      />

      {/* Submission Modal */}
      <SubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        assignment={selectedAssignment}
        classId={String(classId)}
        onSubmitSuccess={handleSubmitSuccess}
        isResubmit={isResubmit}
      />
    </>
  )
}
