'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Box, Text, VStack, HStack, Spinner, Card, Table, Input, Badge } from '@chakra-ui/react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState
} from '@tanstack/react-table'
import { Users, Search, ArrowUpDown, Mail, Phone, UserCheck, UserX } from 'lucide-react'
import StatsCard from '../ui/StatsCard'
import EmptyState from '../ui/EmptyState'
import { lecturerStudentApi } from '../../services/lecturerApi'

interface Student {
  id: string
  studentCode: string
  name: string
  email: string
  phone?: string | null
  joinedAt?: string
  status: string
  totalScore?: number | null
}

interface StudentTabProps {
  classId: string
}

export default function LecturerStudentTab({ classId }: StudentTabProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const response = await lecturerStudentApi.getStudentsInClass(classId)
      console.log('Students response:', response)
      // BE trả về { data: [...], count, message, status }
      const data = (response as any)?.data || response?.results || []

      const studentsData: Student[] = data.map((s: any) => ({
        id: s.studentId || s.id || '',
        studentCode: s.studentCode || s.codeUser || '',
        name: s.studentName || s.name || '',
        email: s.email || '',
        phone: s.phone || null,
        joinedAt: s.joinedAt || s.enrolledAt || '',
        status: s.status || 'enrolled',
        totalScore: s.totalScore ?? null
      }))
      setStudents(studentsData)
    } catch (err) {
      console.error('Failed to fetch students:', err)
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  // Stats
  const stats = useMemo(() => {
    const total = students.length
    const active = students.filter((s) => s.status === 'enrolled' || s.status === 'active').length
    return { total, active }
  }, [students])

  // Table columns - chỉ hiển thị các trường có giá trị
  const columns = useMemo<ColumnDef<Student>[]>(
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
        accessorKey: 'studentCode',
        header: ({ column }) => (
          <HStack gap={1} cursor='pointer' onClick={() => column.toggleSorting()}>
            <Text>MSSV</Text>
            <ArrowUpDown size={14} />
          </HStack>
        ),
        cell: ({ row }) => (
          <Text fontWeight='medium' color='gray.800'>
            {row.original.studentCode || '—'}
          </Text>
        ),
        size: 140
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <HStack gap={1} cursor='pointer' onClick={() => column.toggleSorting()}>
            <Text>Họ tên</Text>
            <ArrowUpDown size={14} />
          </HStack>
        ),
        cell: ({ row }) => (
          <HStack gap={3}>
            <Box
              w='32px'
              h='32px'
              borderRadius='full'
              bg='orange.100'
              display='flex'
              alignItems='center'
              justifyContent='center'
              flexShrink={0}
            >
              <Text fontSize='sm' fontWeight='bold' color='#dd7323'>
                {row.original.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </Box>
            <Text fontWeight='medium' color='gray.800'>
              {row.original.name || '—'}
            </Text>
          </HStack>
        )
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) =>
          row.original.email ? (
            <HStack gap={2} color='gray.600'>
              <Mail size={14} />
              <Text fontSize='sm'>{row.original.email}</Text>
            </HStack>
          ) : (
            <Text fontSize='sm' color='gray.400'>
              —
            </Text>
          )
      },
      {
        accessorKey: 'phone',
        header: 'SĐT',
        cell: ({ row }) =>
          row.original.phone ? (
            <HStack gap={2} color='gray.600'>
              <Phone size={14} />
              <Text fontSize='sm'>{row.original.phone}</Text>
            </HStack>
          ) : (
            <Text fontSize='sm' color='gray.400'>
              —
            </Text>
          ),
        size: 120
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => {
          const isActive = row.original.status === 'enrolled' || row.original.status === 'active'
          const statusLabel =
            row.original.status === 'enrolled'
              ? 'Đã đăng ký'
              : row.original.status === 'active'
                ? 'Hoạt động'
                : 'Không hoạt động'
          return (
            <Badge colorPalette={isActive ? 'green' : 'gray'} variant='subtle' px={2} py={1} borderRadius='full'>
              <HStack gap={1}>
                {isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                <Text fontSize='xs'>{statusLabel}</Text>
              </HStack>
            </Badge>
          )
        },
        size: 140
      }
    ],
    []
  )

  const table = useReactTable({
    data: students,
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
        <Text color='gray.500'>Đang tải danh sách sinh viên...</Text>
      </VStack>
    )
  }

  return (
    <VStack gap={6} align='stretch'>
      {/* Header with Stats */}
      <HStack gap={4} flexWrap='wrap'>
        <Box minW='180px'>
          <StatsCard label='Tổng sinh viên' value={stats.total} icon={Users} />
        </Box>
        <Box minW='180px'>
          <StatsCard label='Đang hoạt động' value={stats.active} icon={UserCheck} />
        </Box>
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
              placeholder='Tìm kiếm theo MSSV, họ tên, email...'
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
      {students.length === 0 ? (
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
