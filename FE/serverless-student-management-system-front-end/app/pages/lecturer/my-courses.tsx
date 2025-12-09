'use client'

import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Text,
  VStack,
  HStack,
  Spinner,
  Badge,
  Card,
  Button,
  Flex,
  Input,
  createListCollection
} from '@chakra-ui/react'
import { BookOpen, Users, Search, GraduationCap, Plus, Calendar, Eye } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatsCard from '../../components/ui/StatsCard'
import EmptyState from '../../components/ui/EmptyState'
import { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValueText } from '../../components/ui/select'
import { lecturerClassApi } from '../../services/lecturerApi'
import { useAuthStore } from '../../store/authStore'

// Card backgrounds
const CARD_BACKGROUNDS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
]

function getBackgroundIndex(id: string): number {
  // Hash string ID to get consistent index
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % CARD_BACKGROUNDS.length
}

// Get status badge
function getStatusBadge(status: number) {
  if (status === 1) {
    return { label: 'Đang giảng dạy', color: 'blue' }
  }
  return { label: 'Đã kết thúc', color: 'gray' }
}

// Status filter options
const statusCollection = createListCollection({
  items: [
    { value: '', label: 'Tất cả trạng thái' },
    { value: '1', label: 'Đang giảng dạy' },
    { value: '0', label: 'Đã kết thúc' }
  ]
})

export default function LecturerMyCourses() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, checkAuthStatus } = useAuthStore()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [authChecked, setAuthChecked] = useState(false)

  // Check auth status on mount (for page reload)
  useEffect(() => {
    const initAuth = async () => {
      // Nếu đã authenticated từ store, không cần check lại
      if (isAuthenticated) {
        setAuthChecked(true)
        return
      }

      // Nếu đang loading, đợi
      if (authLoading) {
        return
      }

      // Thử check auth với timeout
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timeout')), 5000)
        )
        await Promise.race([checkAuthStatus(), timeoutPromise])
      } catch (err) {
        console.error('Auth check failed:', err)
      }
      setAuthChecked(true)
    }
    initAuth()
  }, [isAuthenticated, authLoading, checkAuthStatus])

  // Redirect to login if not authenticated after check
  useEffect(() => {
    if (authChecked && !isAuthenticated && !authLoading) {
      navigate('/login')
    }
  }, [authChecked, isAuthenticated, authLoading, navigate])

  // Fetch ALL classes from API once (không gửi params vì BE không hỗ trợ filter theo keyword)
  const { data: classesData, isLoading } = useQuery({
    queryKey: ['lecturer-classes'],
    queryFn: async () => {
      console.log('Fetching all lecturer classes...')
      const response = await lecturerClassApi.getClasses()
      console.log('Lecturer classes RAW response:', response)
      return response
    },
    staleTime: 0, // Luôn coi data là stale
    refetchOnMount: 'always', // Luôn refetch khi mount component
    enabled: authChecked && isAuthenticated // Chỉ fetch khi đã auth
  })

  // Transform API response to local format
  // BE trả về { data: [...], count, message, status } chứ không phải { results: [...] }
  const allClasses = useMemo(() => {
    const results = (classesData as any)?.data || classesData?.results || []
    return results.map((c: any) => ({
      id: c.id || '',
      name: c.name || c.title || '',
      subject_id: c.subjectId || '',
      subject_name: c.subjectName || c.subtitle || '',
      teacher_id: c.lecturerId || '',
      semester: c.semester || '',
      academic_year: c.academicYear || '',
      student_count: c.studentCount || 0,
      status: c.status ?? 1,
      created_at: c.createdAt || '',
      updated_at: c.updatedAt || ''
    }))
  }, [classesData])

  // Filter classes on FE (vì BE không hỗ trợ filter theo keyword)
  const classes = useMemo(() => {
    let filtered = allClasses

    // Filter by keyword (search by name, case-insensitive)
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(
        (c: any) => c.name.toLowerCase().includes(keyword) || c.subject_name?.toLowerCase().includes(keyword)
      )
    }

    // Filter by status
    if (statusFilter !== '') {
      const status = parseInt(statusFilter)
      filtered = filtered.filter((c: any) => c.status === status)
    }

    return filtered
  }, [allClasses, searchKeyword, statusFilter])

  // Stats (dùng allClasses để hiển thị tổng số thực tế, không bị ảnh hưởng bởi filter)
  const activeClasses = allClasses.filter((c: any) => c.status === 1).length
  const totalStudents = allClasses.reduce((sum: number, c: any) => sum + (c.student_count || 0), 0)

  // Show loading while checking auth or fetching data
  if (!authChecked || authLoading || isLoading) {
    return (
      <Box minH='60vh' display='flex' alignItems='center' justifyContent='center' bg='white'>
        <VStack gap={3}>
          <Spinner size='xl' color='#dd7323' borderWidth='4px' />
          <Text color='gray.600'>{!authChecked || authLoading ? 'Đang xác thực...' : 'Đang tải danh sách lớp...'}</Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box w='full' py={8} px={{ base: 4, sm: 6, lg: 8 }} bg='white' minH='100vh'>
      <Box maxW='6xl' mx='auto'>
        {/* Header */}
        <PageHeader icon={GraduationCap} title='Lớp học của tôi' subtitle='Quản lý các lớp học bạn đang giảng dạy'>
          <Button
            bg='#dd7323'
            color='white'
            size='lg'
            borderRadius='xl'
            shadow='md'
            gap={2}
            px={6}
            fontWeight='semibold'
            _hover={{ bg: '#c5651f', transform: 'translateY(-2px)' }}
            transition='all 0.2s'
          >
            <Plus size={18} />
            Tạo lớp mới
          </Button>
        </PageHeader>

        {/* Stats */}
        <HStack gap={4} px={6} mb={6} flexWrap='wrap'>
          <Box flex={1} minW='200px'>
            <StatsCard label='Tổng số lớp' value={allClasses.length} icon={BookOpen} />
          </Box>
          <Box flex={1} minW='200px'>
            <StatsCard label='Lớp đang hoạt động' value={activeClasses} icon={GraduationCap} />
          </Box>
          <Box flex={1} minW='200px'>
            <StatsCard label='Tổng sinh viên' value={totalStudents} icon={Users} />
          </Box>
        </HStack>

        {/* Search & Filter */}
        <Card.Root bg='white' borderRadius='xl' border='1px solid' borderColor='orange.200' shadow='sm' mb={6} mx={6}>
          <Card.Body p={4}>
            <HStack gap={4} flexWrap='wrap'>
              {/* Search */}
              <Box flex={1} minW='250px' position='relative'>
                <Box position='absolute' left={3} top='50%' transform='translateY(-50%)' color='gray.400'>
                  <Search size={18} />
                </Box>
                <Input
                  pl={10}
                  placeholder='Tìm kiếm theo tên lớp...'
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  borderColor='orange.200'
                  borderRadius='xl'
                  _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                />
              </Box>

              {/* Status Filter */}
              <SelectRoot
                collection={statusCollection}
                value={statusFilter !== '' ? [statusFilter] : ['']}
                onValueChange={(details) => setStatusFilter(details.value[0] || '')}
                size='md'
                w='220px'
              >
                <SelectTrigger borderColor='orange.200' borderRadius='xl' _hover={{ borderColor: '#dd7323' }}>
                  <SelectValueText placeholder='Tất cả trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  {statusCollection.items.map((item) => (
                    <SelectItem key={item.value} item={item}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </HStack>
          </Card.Body>
        </Card.Root>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <Box px={6}>
            <EmptyState
              icon={BookOpen}
              title='Không tìm thấy lớp học'
              description='Thử thay đổi bộ lọc hoặc tạo lớp mới'
            />
          </Box>
        ) : (
          <Flex flexWrap='wrap' gap={6} px={6} justify={classes.length < 3 ? 'center' : 'flex-start'}>
            {classes.map((classData: any) => {
              const bgIndex = getBackgroundIndex(classData.id)
              const statusBadge = getStatusBadge(classData.status)

              return (
                <Card.Root
                  key={classData.id}
                  bg='white'
                  borderRadius='xl'
                  border='1px solid'
                  borderColor='orange.200'
                  shadow='sm'
                  overflow='hidden'
                  _hover={{ transform: 'translateY(-4px)', shadow: 'lg', borderColor: '#dd7323' }}
                  transition='all 0.2s'
                  w={{ base: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.333% - 16px)' }}
                  maxW='380px'
                >
                  {/* Card Header with gradient */}
                  <Box h='120px' position='relative' bgGradient={CARD_BACKGROUNDS[bgIndex]}>
                    {/* Status Badge */}
                    <Badge
                      position='absolute'
                      top={3}
                      right={3}
                      colorPalette={statusBadge.color}
                      variant='solid'
                      borderRadius='full'
                      px={3}
                    >
                      {statusBadge.label}
                    </Badge>

                    {/* Class Code */}
                    <Box position='absolute' bottom={3} left={3}>
                      <Text color='white' fontWeight='bold' fontSize='lg'>
                        {classData.name}
                      </Text>
                      <Text color='whiteAlpha.900' fontSize='sm'>
                        {classData.subject_name}
                      </Text>
                    </Box>
                  </Box>

                  {/* Card Body */}
                  <Card.Body p={4}>
                    <HStack gap={4} mb={4} color='gray.600' fontSize='sm'>
                      <HStack gap={1}>
                        <Users size={14} />
                        <Text>{classData.student_count} SV</Text>
                      </HStack>
                      <HStack gap={1}>
                        <Calendar size={14} />
                        <Text>
                          {classData.semester} {classData.academic_year}
                        </Text>
                      </HStack>
                    </HStack>

                    {/* View Details Button */}
                    <Button
                      w='full'
                      bg='#dd7323'
                      color='white'
                      borderRadius='xl'
                      _hover={{ bg: '#c5651f' }}
                      onClick={() => {
                        // Remove CLASS# prefix if present
                        const classId = classData.id.replace('CLASS#', '')
                        navigate(`/lecturer/classes/${classId}`)
                      }}
                    >
                      <Eye size={16} />
                      <Text ml={2}>Vào lớp</Text>
                    </Button>
                  </Card.Body>
                </Card.Root>
              )
            })}
          </Flex>
        )}
      </Box>
    </Box>
  )
}
