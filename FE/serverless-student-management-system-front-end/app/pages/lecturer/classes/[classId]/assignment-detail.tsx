'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router'
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
  NumberInput,
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
import { FileText, ChevronLeft, Download, CheckCircle, Clock, ArrowUpDown, Users, Search, Check, X, Edit3, Eye } from 'lucide-react'
import StatsCard from '../../../../components/ui/StatsCard'
import EmptyState from '../../../../components/ui/EmptyState'
import { ErrorDisplay } from '../../../../components/ui/ErrorDisplay'
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValueText } from '../../../../components/ui/select'
import { lecturerAssignmentApi } from '../../../../services/lecturerApi'
import type { AssignmentDTO, AssignmentSubmissionDTO } from '../../../../types'

const USE_MOCK_DATA = false

const MOCK_ASSIGNMENT: AssignmentDTO = {
  id: 1,
  class_id: 1,
  title: 'Lab 01 - Giới thiệu Python',
  description: 'Bài tập thực hành cơ bản về Python',
  type: 'homework',
  weight: 0.2,
  deadline: '2024-10-10T23:59:00Z',
  max_score: 10,
  is_published: true,
  submission_count: 40,
  created_at: '',
  updated_at: ''
}

const MOCK_SUBMISSIONS: AssignmentSubmissionDTO[] = [
  { id: 1, assignment_id: 1, student_id: 1, student_name: 'Nguyễn Văn A', student_code: 'SV001', file_url: 'https://example.com/SV001_Lab01.zip', file_name: 'SV001_Lab01.zip', submitted_at: '2024-10-09T20:30:00Z', score: 8.5, feedback: 'Tốt', status: 'on_time', created_at: '', updated_at: '' },
  { id: 2, assignment_id: 1, student_id: 2, student_name: 'Trần Thị B', student_code: 'SV002', file_url: 'https://example.com/SV002_Lab01.zip', file_name: 'SV002_Lab01.zip', submitted_at: '2024-10-10T22:00:00Z', score: 9.0, feedback: 'Xuất sắc', status: 'on_time', created_at: '', updated_at: '' },
  { id: 3, assignment_id: 1, student_id: 3, student_name: 'Lê Văn C', student_code: 'SV003', file_url: '', file_name: '', submitted_at: '2024-10-11T08:00:00Z', score: undefined, feedback: undefined, status: 'late', created_at: '', updated_at: '' },
  { id: 4, assignment_id: 1, student_id: 4, student_name: 'Phạm Thị D', student_code: 'SV004', file_url: 'https://example.com/SV004_Lab01.zip', file_name: 'SV004_Lab01.zip', submitted_at: '2024-10-10T18:00:00Z', score: undefined, feedback: undefined, status: 'on_time', created_at: '', updated_at: '' },
  { id: 5, assignment_id: 1, student_id: 5, student_name: 'Hoàng Văn E', student_code: 'SV005', file_url: '', file_name: '', submitted_at: '2024-10-10T12:00:00Z', score: 7.5, feedback: 'Khá', status: 'on_time', created_at: '', updated_at: '' }
]

// Filter collections for Select components
const statusFilterCollection = createListCollection({
  items: [
    { value: '', label: 'Tất cả TT nộp' },
    { value: 'on_time', label: 'Đúng hạn' },
    { value: 'late', label: 'Trễ hạn' }
  ]
})

const gradingFilterCollection = createListCollection({
  items: [
    { value: '', label: 'Tất cả TT chấm' },
    { value: 'graded', label: 'Đã chấm' },
    { value: 'pending', label: 'Chưa chấm' }
  ]
})

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

export default function LecturerAssignmentDetail() {
  const { classId, assignmentId } = useParams<{ classId: string; assignmentId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Get mode from URL params (view or grade)
  const mode = searchParams.get('mode') || 'view'
  const isGradeMode = mode === 'grade'
  
  const [assignment, setAssignment] = useState<AssignmentDTO | null>(null)
  const [submissions, setSubmissions] = useState<AssignmentSubmissionDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  
  // Filters
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [gradingFilter, setGradingFilter] = useState<string>(isGradeMode ? 'pending' : '')
  
  // Inline editing
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editScore, setEditScore] = useState<string>('')

  const fetchData = useCallback(async () => {
    if (!classId || !assignmentId) return
    setLoading(true)
    setError(null)

    if (USE_MOCK_DATA) {
      await new Promise((r) => setTimeout(r, 400))
      setAssignment(MOCK_ASSIGNMENT)
      setSubmissions(MOCK_SUBMISSIONS)
      setLoading(false)
      return
    }

    try {
      const [assignmentRes, submissionsRes] = await Promise.all([
        lecturerAssignmentApi.getAssignmentById(Number(classId), Number(assignmentId)),
        lecturerAssignmentApi.getSubmissions(Number(classId), Number(assignmentId))
      ])
      setAssignment(assignmentRes)
      setSubmissions(submissionsRes.results || [])
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError('Không thể tải thông tin bài tập. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [classId, assignmentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      // Search by student name or code
      const matchesSearch = !searchKeyword ||
        s.student_name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        s.student_code?.toLowerCase().includes(searchKeyword.toLowerCase())
      
      // Status filter (on_time / late)
      const matchesStatus = !statusFilter || s.status === statusFilter
      
      // Grading filter
      let matchesGrading = true
      if (gradingFilter === 'graded') {
        matchesGrading = s.score !== undefined
      } else if (gradingFilter === 'pending') {
        matchesGrading = s.score === undefined
      }
      
      return matchesSearch && matchesStatus && matchesGrading
    })
  }, [submissions, searchKeyword, statusFilter, gradingFilter])

  // Stats
  const stats = useMemo(() => {
    const total = submissions.length
    const graded = submissions.filter((s) => s.score !== undefined).length
    const onTime = submissions.filter((s) => s.status === 'on_time').length
    return { total, graded, onTime }
  }, [submissions])

  // Handle inline grade edit
  const startEditing = (submission: AssignmentSubmissionDTO) => {
    setEditingId(submission.id)
    setEditScore(submission.score !== undefined ? submission.score.toString() : '')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditScore('')
  }

  const saveScore = async (submissionId: number) => {
    const score = parseFloat(editScore)
    if (isNaN(score) || score < 0 || score > (assignment?.max_score || 10)) {
      return
    }

    try {
      if (USE_MOCK_DATA) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === submissionId ? { ...s, score, graded_at: new Date().toISOString() } : s
          )
        )
      } else {
        // Use the new API endpoint: PUT /lecturer/assignments/{assignment_id}/update-grades
        await lecturerAssignmentApi.gradeSubmission(
          Number(classId),
          Number(assignmentId),
          submissionId,
          { score }
        )
        // Refresh data after grading
        fetchData()
      }
    } catch (err) {
      console.error('Failed to save score:', err)
      setError('Không thể lưu điểm. Vui lòng thử lại.')
    }
    
    setEditingId(null)
    setEditScore('')
  }

  // Table columns
  const columns = useMemo<ColumnDef<AssignmentSubmissionDTO>[]>(
    () => [
      {
        accessorKey: 'index',
        header: 'STT',
        cell: ({ row }) => <Text color='gray.600' fontSize='sm'>{row.index + 1}</Text>,
        size: 50
      },
      {
        accessorKey: 'student_code',
        header: 'MSSV',
        cell: ({ row }) => <Text fontWeight='medium' color='gray.800'>{row.original.student_code}</Text>,
        size: 100
      },
      {
        accessorKey: 'student_name',
        header: ({ column }) => (
          <HStack gap={1} cursor='pointer' onClick={() => column.toggleSorting()}>
            <Text>Họ tên</Text>
            <ArrowUpDown size={14} />
          </HStack>
        ),
        cell: ({ row }) => <Text fontWeight='medium' color='gray.800'>{row.original.student_name}</Text>
      },
      {
        accessorKey: 'submitted_at',
        header: 'Thời gian nộp',
        cell: ({ row }) => {
          const date = new Date(row.original.submitted_at)
          return (
            <Text color='gray.600' fontSize='sm'>
              {date.toLocaleDateString('vi-VN')} {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )
        },
        size: 150
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái nộp',
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.status === 'on_time' ? 'green' : 'yellow'}
            variant='solid'
            borderRadius='full'
            size='sm'
          >
            {row.original.status === 'on_time' ? 'Đúng hạn' : 'Trễ hạn'}
          </Badge>
        ),
        size: 110
      },
      {
        accessorKey: 'grading_status',
        header: 'Trạng thái chấm',
        cell: ({ row }) => {
          const isGraded = row.original.score !== undefined
          return (
            <Badge
              colorPalette={isGraded ? 'green' : 'orange'}
              variant={isGraded ? 'solid' : 'outline'}
              borderRadius='full'
              size='sm'
            >
              <HStack gap={1}>
                {isGraded ? <CheckCircle size={12} /> : <Clock size={12} />}
                <Text>{isGraded ? 'Đã chấm' : 'Chưa chấm'}</Text>
              </HStack>
            </Badge>
          )
        },
        size: 120
      },
      {
        accessorKey: 'score',
        header: ({ column }) => (
          <HStack gap={1} cursor='pointer' onClick={() => column.toggleSorting()}>
            <Text>Điểm</Text>
            <ArrowUpDown size={14} />
          </HStack>
        ),
        cell: ({ row }) => {
          const submission = row.original
          const isEditing = editingId === submission.id
          const isGraded = submission.score !== undefined
          
          if (isEditing) {
            return (
              <HStack gap={1}>
                <NumberInput.Root
                  size='sm'
                  min={0}
                  max={assignment?.max_score || 10}
                  step={0.5}
                  value={editScore}
                  onValueChange={(details) => setEditScore(details.value)}
                  w='90px'
                >
                  <NumberInput.Input
                    borderColor='orange.300'
                    bg='white'
                    borderRadius='md'
                    _focus={{ 
                      borderColor: '#dd7323', 
                      boxShadow: '0 0 0 2px rgba(221, 115, 35, 0.2)' 
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveScore(submission.id)
                      if (e.key === 'Escape') cancelEditing()
                    }}
                  />
                  <NumberInput.Control>
                    <NumberInput.IncrementTrigger />
                    <NumberInput.DecrementTrigger />
                  </NumberInput.Control>
                </NumberInput.Root>
                <Button size='xs' colorPalette='green' variant='ghost' onClick={() => saveScore(submission.id)} title='Lưu'>
                  <Check size={14} />
                </Button>
                <Button size='xs' colorPalette='red' variant='ghost' onClick={cancelEditing} title='Hủy'>
                  <X size={14} />
                </Button>
              </HStack>
            )
          }
          
          return (
            <Text 
              fontWeight='bold' 
              color={isGraded ? '#dd7323' : 'gray.400'}
              fontSize='sm'
            >
              {isGraded ? `${submission.score!.toFixed(1)}/${assignment?.max_score || 10}` : '—'}
            </Text>
          )
        },
        size: 160
      },
      {
        id: 'download',
        header: () => <Text textAlign='center'>Tải bài</Text>,
        cell: ({ row }) => {
          const submission = row.original
          const hasFile = submission.file_url && submission.file_url.trim() !== ''
          
          return (
            <Box display='flex' justifyContent='center'>
              <Button
                size='xs'
                variant='ghost'
                color={hasFile ? '#dd7323' : 'gray.300'}
                disabled={!hasFile}
                opacity={hasFile ? 1 : 0.5}
                cursor={hasFile ? 'pointer' : 'not-allowed'}
                _hover={hasFile ? { bg: 'orange.50' } : {}}
                onClick={(e) => {
                  e.stopPropagation()
                  if (hasFile) {
                    window.open(submission.file_url, '_blank')
                  }
                }}
                title={hasFile ? `Tải ${submission.file_name}` : 'Không có tệp đính kèm'}
              >
                <Download size={16} />
              </Button>
            </Box>
          )
        },
        size: 80
      },
      {
        id: 'grade_action',
        header: () => <Text textAlign='center'>Chấm điểm</Text>,
        cell: ({ row }) => {
          const submission = row.original
          const isGraded = submission.score !== undefined
          const isEditing = editingId === submission.id
          
          return (
            <Box display='flex' justifyContent='center'>
              <Button
                size='xs'
                bg={isGraded ? 'gray.100' : 'linear-gradient(135deg, #dd7323 0%, #f59e0b 100%)'}
                color={isGraded ? 'gray.400' : 'white'}
                borderRadius='lg'
                px={3}
                disabled={isGraded || isEditing}
                opacity={isGraded ? 0.6 : 1}
                cursor={isGraded ? 'not-allowed' : 'pointer'}
                _hover={!isGraded ? { 
                  bg: 'linear-gradient(135deg, #c5651f 0%, #d97706 100%)',
                  transform: 'translateY(-1px)',
                  shadow: 'md'
                } : {}}
                transition='all 0.2s'
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isGraded && !isEditing) {
                    startEditing(submission)
                  }
                }}
                title={isGraded ? 'Đã chấm điểm' : 'Nhập điểm'}
              >
                <HStack gap={1}>
                  <Edit3 size={12} />
                  <Text fontSize='xs'>{isGraded ? 'Đã chấm' : 'Chấm điểm'}</Text>
                </HStack>
              </Button>
            </Box>
          )
        },
        size: 120
      }
    ],
    [editingId, editScore, assignment?.max_score]
  )

  const table = useReactTable({
    data: filteredSubmissions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  if (loading) {
    return (
      <Box minH='60vh' display='flex' alignItems='center' justifyContent='center' bg='white'>
        <VStack gap={3}>
          <Spinner size='xl' color='#dd7323' borderWidth='4px' />
          <Text color='gray.600'>Đang tải thông tin bài tập...</Text>
        </VStack>
      </Box>
    )
  }

  if (error) {
    return <ErrorDisplay variant='fetch' message={error} onRetry={fetchData} />
  }

  return (
    <Box w='full' py={8} px={{ base: 4, sm: 6, lg: 8 }} bg='white' minH='100vh'>
      <Box maxW='6xl' mx='auto'>
        {/* Back Button */}
        <HStack
          mb={4}
          px={6}
          gap={2}
          cursor='pointer'
          color='gray.600'
          _hover={{ color: '#dd7323' }}
          onClick={() => navigate(`/lecturer/classes/${classId}`)}
          w='fit-content'
        >
          <ChevronLeft size={20} />
          <Text fontWeight='medium'>Quay lại lớp học</Text>
        </HStack>

        {/* Header */}
        <HStack px={6} mb={6} justify='space-between' flexWrap='wrap' gap={4}>
          <VStack align='flex-start' gap={1}>
            <HStack gap={3}>
              <Box 
                p={3} 
                bg={isGradeMode ? 'linear-gradient(135deg, #dd7323 0%, #f59e0b 100%)' : 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'} 
                borderRadius='xl' 
                shadow='lg'
              >
                {isGradeMode ? <Edit3 size={28} color='white' /> : <Eye size={28} color='white' />}
              </Box>
              <VStack align='flex-start' gap={0}>
                <HStack gap={2}>
                  <Text fontSize='2xl' fontWeight='bold' color='gray.800'>
                    {assignment?.title}
                  </Text>
                  <Badge 
                    colorPalette={isGradeMode ? 'orange' : 'green'} 
                    variant='solid' 
                    borderRadius='full'
                    px={3}
                    py={1}
                  >
                    {isGradeMode ? 'Chế độ chấm điểm' : 'Chế độ xem điểm'}
                  </Badge>
                </HStack>
                <HStack gap={2} mt={1}>
                  <Badge colorPalette={TYPE_COLORS[assignment?.type || 'homework']} variant='subtle' borderRadius='full'>
                    {TYPE_LABELS[assignment?.type || 'homework']}
                  </Badge>
                  <Text color='gray.500' fontSize='sm'>
                    Deadline: {assignment ? new Date(assignment.deadline).toLocaleDateString('vi-VN') : ''}
                  </Text>
                  <Text color='gray.500' fontSize='sm'>
                    • Điểm tối đa: {assignment?.max_score || 10}
                  </Text>
                </HStack>
              </VStack>
            </HStack>
          </VStack>
          
          {/* Mode Toggle Button */}
          <Button
            variant='outline'
            borderColor={isGradeMode ? 'green.400' : 'orange.400'}
            color={isGradeMode ? 'green.600' : '#dd7323'}
            borderRadius='xl'
            _hover={{ 
              bg: isGradeMode ? 'green.50' : 'orange.50',
              borderColor: isGradeMode ? 'green.500' : 'orange.500'
            }}
            onClick={() => {
              const newMode = isGradeMode ? 'view' : 'grade'
              navigate(`/lecturer/classes/${classId}/assignments/${assignmentId}?mode=${newMode}`)
            }}
          >
            {isGradeMode ? <Eye size={16} /> : <Edit3 size={16} />}
            <Text ml={2}>{isGradeMode ? 'Xem điểm' : 'Chấm điểm'}</Text>
          </Button>
        </HStack>

        {/* Stats */}
        <HStack gap={4} px={6} mb={6} flexWrap='wrap'>
          <Box minW='180px'>
            <StatsCard label='Tổng bài nộp' value={stats.total} icon={Users} />
          </Box>
          <Box minW='180px'>
            <StatsCard label='Đã chấm' value={`${stats.graded}/${stats.total}`} icon={CheckCircle} />
          </Box>
          <Box minW='180px'>
            <StatsCard label='Chưa chấm' value={stats.total - stats.graded} icon={Clock} />
          </Box>
          <Box minW='180px'>
            <StatsCard label='Nộp đúng hạn' value={stats.onTime} icon={Clock} />
          </Box>
        </HStack>
        
        {/* Grading Progress Bar */}
        {stats.total > 0 && (
          <Box px={6} mb={6}>
            <Card.Root bg='white' borderRadius='xl' border='1px solid' borderColor='orange.200' shadow='sm'>
              <Card.Body p={4}>
                <HStack justify='space-between' mb={2}>
                  <Text fontWeight='medium' color='gray.700'>Tiến độ chấm điểm</Text>
                  <Text fontWeight='bold' color='#dd7323'>
                    {Math.round((stats.graded / stats.total) * 100)}%
                  </Text>
                </HStack>
                <Box 
                  w='full' 
                  h='8px' 
                  bg='gray.100' 
                  borderRadius='full' 
                  overflow='hidden'
                >
                  <Box 
                    h='full' 
                    w={`${(stats.graded / stats.total) * 100}%`}
                    bg={stats.graded === stats.total ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' : 'linear-gradient(90deg, #dd7323 0%, #f59e0b 100%)'}
                    borderRadius='full'
                    transition='width 0.5s ease'
                  />
                </Box>
                <HStack justify='space-between' mt={2}>
                  <Text fontSize='sm' color='gray.500'>
                    {stats.graded} bài đã chấm
                  </Text>
                  <Text fontSize='sm' color='gray.500'>
                    {stats.total - stats.graded} bài còn lại
                  </Text>
                </HStack>
              </Card.Body>
            </Card.Root>
          </Box>
        )}

        {/* Filters */}
        <Card.Root bg='white' borderRadius='xl' border='1px solid' borderColor='orange.200' shadow='sm' mx={6} mb={6}>
          <Card.Body p={4}>
            <HStack gap={4} flexWrap='wrap'>
              {/* Search */}
              <Box flex={1} minW='200px' position='relative'>
                <Box position='absolute' left={3} top='50%' transform='translateY(-50%)' color='gray.400' zIndex={1}>
                  <Search size={18} />
                </Box>
                <Input
                  pl={10}
                  placeholder='Tìm theo tên, MSSV...'
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  borderColor='orange.200'
                  borderRadius='xl'
                  _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                />
              </Box>

              {/* Status Filter */}
              <SelectRoot
                collection={statusFilterCollection}
                value={statusFilter ? [statusFilter] : ['']}
                onValueChange={(details) => setStatusFilter(details.value[0] || '')}
                size='md'
                w='160px'
              >
                <SelectTrigger
                  borderColor='orange.200'
                  borderRadius='xl'
                  _hover={{ borderColor: '#dd7323' }}
                >
                  <SelectValueText placeholder='Tất cả TT nộp' />
                </SelectTrigger>
                <SelectContent>
                  {statusFilterCollection.items.map((item) => (
                    <SelectItem key={item.value} item={item}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>

              {/* Grading Filter */}
              <SelectRoot
                collection={gradingFilterCollection}
                value={gradingFilter ? [gradingFilter] : ['']}
                onValueChange={(details) => setGradingFilter(details.value[0] || '')}
                size='md'
                w='170px'
              >
                <SelectTrigger
                  borderColor='orange.200'
                  borderRadius='xl'
                  _hover={{ borderColor: '#dd7323' }}
                >
                  <SelectValueText placeholder='Tất cả TT chấm' />
                </SelectTrigger>
                <SelectContent>
                  {gradingFilterCollection.items.map((item) => (
                    <SelectItem key={item.value} item={item}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </HStack>
          </Card.Body>
        </Card.Root>

        {/* Submissions Table */}
        <Box px={6}>
          {filteredSubmissions.length === 0 ? (
            <EmptyState 
              icon={FileText} 
              title='Không tìm thấy bài nộp' 
              description={submissions.length === 0 ? 'Sinh viên chưa nộp bài tập này' : 'Thử thay đổi bộ lọc'} 
            />
          ) : (
            <Card.Root bg='white' borderRadius='xl' border='1px solid' borderColor='orange.200' shadow='sm' overflow='hidden'>
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
                    <Table.Row key={row.id} _hover={{ bg: 'orange.50' }} transition='all 0.2s'>
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
        </Box>
      </Box>
    </Box>
  )
}
