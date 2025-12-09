'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Box, Text, VStack, HStack, Spinner, Card, Table, Button, Input } from '@chakra-ui/react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState
} from '@tanstack/react-table'
import { Users, CheckCircle, Download, Search, ArrowUpDown } from 'lucide-react'
import StatsCard from '../ui/StatsCard'
import EmptyState from '../ui/EmptyState'
import { lecturerGradeApi, lecturerStudentApi } from '../../services/lecturerApi'

interface StudentGrade {
  id: string
  student_code: string
  student_name: string
  homework_avg: number | null
  project_score: number | null
  midterm_score: number | null
  final_score: number | null
  total_score: number | null
}

interface GradeTabProps {
  classId: string
  studentCount: number
}

export default function LecturerGradeTab({ classId, studentCount }: GradeTabProps) {
  const [grades, setGrades] = useState<StudentGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const fetchGrades = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch students in class
      const studentsRes = await lecturerStudentApi.getStudentsInClass(classId)
      console.log('Students response:', studentsRes)
      // BE trả về { data: [...], count, message, status }
      const students = (studentsRes as any)?.data || studentsRes?.results || []

      // Transform students to grade format
      const gradesData: StudentGrade[] = students.map((s: any) => ({
        id: s.id || s.studentId || '',
        student_code: s.codeUser || s.studentCode || s.code || '',
        student_name: s.name || s.studentName || '',
        homework_avg: s.homeworkAvg ?? null,
        project_score: s.projectScore ?? null,
        midterm_score: s.midtermScore ?? null,
        final_score: s.finalScore ?? null,
        total_score: s.totalScore ?? null
      }))
      setGrades(gradesData)
    } catch (err) {
      console.error('Failed to fetch grades:', err)
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    fetchGrades()
  }, [fetchGrades])

  // Stats
  const stats = useMemo(() => {
    const total = grades.length
    const complete = grades.filter((g) => g.total_score !== null).length
    return { total, complete }
  }, [grades])

  // Export to Excel
  const handleExport = () => {
    // Simple CSV export
    const headers = ['STT', 'MSSV', 'Họ tên', 'BT (20%)', 'DA (30%)', 'GK (25%)', 'CK (25%)', 'Tổng kết']
    const rows = grades.map((g, i) => [
      i + 1,
      g.student_code,
      g.student_name,
      g.homework_avg ?? '',
      g.project_score ?? '',
      g.midterm_score ?? '',
      g.final_score ?? '',
      g.total_score ?? ''
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bang_diem_${classId}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Table columns
  const columns = useMemo<ColumnDef<StudentGrade>[]>(
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
        accessorKey: 'student_code',
        header: ({ column }) => (
          <HStack gap={1} cursor='pointer' onClick={() => column.toggleSorting()}>
            <Text>MSSV</Text>
            <ArrowUpDown size={14} />
          </HStack>
        ),
        cell: ({ row }) => (
          <Text fontWeight='medium' color='gray.800'>
            {row.original.student_code}
          </Text>
        ),
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
        cell: ({ row }) => (
          <Text fontWeight='medium' color='gray.800'>
            {row.original.student_name}
          </Text>
        )
      },
      {
        accessorKey: 'homework_avg',
        header: 'BT (20%)',
        cell: ({ row }) => (
          <Text color={row.original.homework_avg !== null ? 'gray.800' : 'gray.400'} fontSize='sm'>
            {row.original.homework_avg !== null ? row.original.homework_avg.toFixed(1) : '—'}
          </Text>
        ),
        size: 80
      },
      {
        accessorKey: 'project_score',
        header: 'DA (30%)',
        cell: ({ row }) => (
          <Text color={row.original.project_score !== null ? 'gray.800' : 'gray.400'} fontSize='sm'>
            {row.original.project_score !== null ? row.original.project_score.toFixed(1) : '—'}
          </Text>
        ),
        size: 80
      },
      {
        accessorKey: 'midterm_score',
        header: 'GK (25%)',
        cell: ({ row }) => (
          <Text color={row.original.midterm_score !== null ? 'gray.800' : 'gray.400'} fontSize='sm'>
            {row.original.midterm_score !== null ? row.original.midterm_score.toFixed(1) : '—'}
          </Text>
        ),
        size: 80
      },
      {
        accessorKey: 'final_score',
        header: 'CK (25%)',
        cell: ({ row }) => (
          <Text color={row.original.final_score !== null ? 'gray.800' : 'gray.400'} fontSize='sm'>
            {row.original.final_score !== null ? row.original.final_score.toFixed(1) : '—'}
          </Text>
        ),
        size: 80
      },
      {
        accessorKey: 'total_score',
        header: ({ column }) => (
          <HStack gap={1} cursor='pointer' onClick={() => column.toggleSorting()}>
            <Text>Tổng kết</Text>
            <ArrowUpDown size={14} />
          </HStack>
        ),
        cell: ({ row }) => (
          <Text fontWeight='bold' color={row.original.total_score !== null ? '#dd7323' : 'gray.400'} fontSize='sm'>
            {row.original.total_score !== null ? row.original.total_score.toFixed(1) : '—'}
          </Text>
        ),
        size: 90
      }
    ],
    []
  )

  const table = useReactTable({
    data: grades,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  if (loading) {
    return (
      <VStack gap={3} py={12}>
        <Spinner size='lg' color='#dd7323' />
        <Text color='gray.500'>Đang tải bảng điểm...</Text>
      </VStack>
    )
  }

  return (
    <VStack gap={6} align='stretch'>
      {/* Header with Stats and Export Button */}
      <HStack justify='space-between' flexWrap='wrap' gap={4}>
        <HStack gap={4} flexWrap='wrap'>
          <Box minW='180px'>
            <StatsCard label='Tổng sinh viên' value={stats.total} icon={Users} />
          </Box>
          <Box minW='180px'>
            <StatsCard label='Đã có đủ điểm' value={`${stats.complete}/${stats.total}`} icon={CheckCircle} />
          </Box>
        </HStack>
        <Button bg='#dd7323' color='white' borderRadius='xl' _hover={{ bg: '#c5651f' }} onClick={handleExport}>
          <Download size={18} />
          <Text ml={2}>Xuất Excel</Text>
        </Button>
      </HStack>

      {/* Search */}
      <Card.Root bg='white' borderRadius='xl' border='1px solid' borderColor='orange.200' shadow='sm'>
        <Card.Body p={4}>
          <Box position='relative' maxW='400px'>
            <Box position='absolute' left={3} top='50%' transform='translateY(-50%)' color='gray.400'>
              <Search size={18} />
            </Box>
            <Input
              pl={10}
              placeholder='Tìm kiếm theo MSSV, họ tên...'
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              borderColor='orange.200'
              borderRadius='xl'
              _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
            />
          </Box>
        </Card.Body>
      </Card.Root>

      {/* Table */}
      {grades.length === 0 ? (
        <EmptyState icon={Users} title='Chưa có sinh viên nào' description='Lớp học chưa có sinh viên đăng ký' />
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
    </VStack>
  )
}
