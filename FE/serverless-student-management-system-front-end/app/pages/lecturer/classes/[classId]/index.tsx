'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Box, Tabs, VStack, HStack, Text, Spinner, Button, Input } from '@chakra-ui/react'
import { FileText, MessageSquare, ChevronLeft, Settings, Save, X, Loader2, Power, Users } from 'lucide-react'
import { ErrorDisplay } from '../../../../components/ui/ErrorDisplay'
import { LecturerAssignmentTab, LecturerPostTab, LecturerStudentTab } from '../../../../components/lecturer'
import { lecturerClassApi } from '../../../../services/lecturerApi'
import { toaster } from '../../../../components/ui/toaster'
import { useAuthStore } from '../../../../store/authStore'

// Mock data
// Class info interface for API response
interface ClassInfo {
  id: string
  name: string
  subjectId?: string
  subjectName?: string
  lecturerId?: string
  lecturerName?: string
  semester?: string
  academicYear?: string
  studentCount?: number
  status?: number
  room?: string
  description?: string
  password?: string
}

export default function LecturerClassDetail() {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, checkAuthStatus } = useAuthStore()
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('assignments')
  const [authChecked, setAuthChecked] = useState(false)

  // Edit class state
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    semester: '',
    academicYear: '',
    description: '',
    room: '',
    password: ''
  })

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

  const fetchClassInfo = useCallback(async () => {
    if (!classId) return
    setLoading(true)
    setError(null)

    try {
      // Fetch class info from lecturer classes API
      const response = await lecturerClassApi.getClasses()
      const classes = (response as any)?.data || response?.results || []
      // Find the class by ID (classId might not have CLASS# prefix)
      const foundClass = classes.find(
        (c: any) => c.id === classId || c.id === `CLASS#${classId}` || c.id?.replace('CLASS#', '') === classId
      )

      if (foundClass) {
        setClassInfo({
          id: foundClass.id,
          name: foundClass.name,
          subjectId: foundClass.subjectId,
          subjectName: foundClass.subjectName,
          lecturerId: foundClass.lecturerId || foundClass.teacherId,
          lecturerName: foundClass.lecturerName,
          semester: foundClass.semester,
          academicYear: foundClass.academicYear,
          studentCount: foundClass.studentCount || 0,
          status: foundClass.status,
          room: foundClass.room,
          description: foundClass.description,
          password: foundClass.password
        })
      } else {
        // Fallback: use classId as name
        setClassInfo({
          id: classId,
          name: classId,
          studentCount: 0
        })
      }
    } catch (err) {
      console.error('Failed to fetch class info:', err)
      setError('Không thể tải thông tin lớp học. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [classId])

  // Fetch class info only after auth is ready
  useEffect(() => {
    if (authChecked && isAuthenticated) {
      fetchClassInfo()
    } else if (authChecked && !isAuthenticated && !authLoading) {
      // Not authenticated after check, redirect to login
      navigate('/login')
    }
  }, [authChecked, isAuthenticated, authLoading, fetchClassInfo, navigate])

  // Initialize edit form when classInfo changes
  useEffect(() => {
    if (classInfo) {
      setEditForm({
        name: classInfo.name || '',
        semester: classInfo.semester || '',
        academicYear: classInfo.academicYear || '',
        description: classInfo.description || '',
        room: classInfo.room || '',
        password: classInfo.password || ''
      })
    }
  }, [classInfo])

  // Handle save class
  const handleSaveClass = async () => {
    if (!classId) return

    try {
      setSaving(true)
      await lecturerClassApi.updateClass(classId, {
        name: editForm.name || undefined,
        semester: editForm.semester || undefined,
        academicYear: editForm.academicYear || undefined,
        description: editForm.description || undefined,
        password: editForm.password || undefined
      })

      toaster.create({
        title: 'Thành công',
        description: 'Đã cập nhật thông tin lớp học',
        type: 'success'
      })

      setIsEditing(false)
      // Refresh class info
      fetchClassInfo()
    } catch (err: any) {
      console.error('Failed to update class:', err)
      toaster.create({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Không thể cập nhật lớp học',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle deactivate class
  const handleDeactivateClass = async () => {
    if (!classId) return

    // Confirm before deactivating
    if (!confirm('Bạn có chắc muốn đóng lớp học này? Lớp sẽ không còn hoạt động nữa.')) {
      return
    }

    try {
      setDeactivating(true)
      await lecturerClassApi.deactivateClass(classId)

      toaster.create({
        title: 'Thành công',
        description: 'Đã đóng lớp học',
        type: 'success'
      })

      // Navigate back to my courses
      navigate('/lecturer/my-courses')
    } catch (err: any) {
      console.error('Failed to deactivate class:', err)
      toaster.create({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Không thể đóng lớp học',
        type: 'error'
      })
    } finally {
      setDeactivating(false)
    }
  }

  // Show loading while checking auth or fetching data
  if (!authChecked || authLoading || loading) {
    return (
      <Box minH='60vh' display='flex' alignItems='center' justifyContent='center' bg='white'>
        <VStack gap={3}>
          <Spinner size='xl' color='#dd7323' borderWidth='4px' />
          <Text color='gray.600'>
            {!authChecked || authLoading ? 'Đang xác thực...' : 'Đang tải thông tin lớp học...'}
          </Text>
        </VStack>
      </Box>
    )
  }

  if (error) {
    return <ErrorDisplay variant='fetch' message={error} onRetry={fetchClassInfo} />
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
          onClick={() => navigate('/lecturer/my-courses')}
          w='fit-content'
        >
          <ChevronLeft size={20} />
          <Text fontWeight='medium'>Quay lại danh sách lớp</Text>
        </HStack>

        {/* Header */}
        <Box px={6} mb={6}>
          <HStack justify='space-between' align='start'>
            <Box>
              <HStack gap={3} mb={2}>
                <Box p={2} bg='orange.50' borderRadius='lg'>
                  <FileText size={24} className='text-[#dd7323]' />
                </Box>
                <Text fontSize='2xl' fontWeight='bold' color='gray.800'>
                  {classInfo?.subjectName || classInfo?.name || 'Chi tiết lớp học'}
                </Text>
              </HStack>
              <Text color='gray.500'>
                {classInfo?.name || ''} • {classInfo?.studentCount || 0} sinh viên • {classInfo?.semester || ''}{' '}
                {classInfo?.academicYear || ''}
              </Text>
            </Box>
            <HStack gap={2}>
              <Button
                onClick={() => setIsEditing(true)}
                bg='white'
                border='1px solid'
                borderColor='gray.200'
                color='gray.700'
                _hover={{ bg: 'gray.50', borderColor: '#dd7323' }}
                size='sm'
              >
                <Settings size={16} />
                <Text ml={2}>Chỉnh sửa</Text>
              </Button>
            </HStack>
          </HStack>
        </Box>

        {/* Edit Class Modal */}
        {isEditing && (
          <Box
            position='fixed'
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg='blackAlpha.500'
            zIndex={1000}
            display='flex'
            alignItems='center'
            justifyContent='center'
            onClick={() => setIsEditing(false)}
          >
            <Box
              bg='white'
              borderRadius='2xl'
              p={6}
              w='full'
              maxW='500px'
              mx={4}
              onClick={(e) => e.stopPropagation()}
              shadow='2xl'
            >
              <HStack justify='space-between' mb={6}>
                <Text fontSize='xl' fontWeight='bold' color='gray.800'>
                  Chỉnh sửa lớp học
                </Text>
                <Button variant='ghost' size='sm' onClick={() => setIsEditing(false)}>
                  <X size={20} />
                </Button>
              </HStack>

              <VStack gap={4} align='stretch'>
                <Box>
                  <Text fontSize='sm' fontWeight='medium' color='gray.700' mb={2}>
                    Tên lớp
                  </Text>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder='Nhập tên lớp'
                    borderColor='gray.200'
                    _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                  />
                </Box>

                <Box>
                  <Text fontSize='sm' fontWeight='medium' color='gray.700' mb={2}>
                    Học kỳ
                  </Text>
                  <Input
                    value={editForm.semester}
                    onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                    placeholder='VD: HK1, HK2'
                    borderColor='gray.200'
                    _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                  />
                </Box>

                <Box>
                  <Text fontSize='sm' fontWeight='medium' color='gray.700' mb={2}>
                    Năm học
                  </Text>
                  <Input
                    value={editForm.academicYear}
                    onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value })}
                    placeholder='VD: 2024-2025'
                    borderColor='gray.200'
                    _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                  />
                </Box>

                <Box>
                  <Text fontSize='sm' fontWeight='medium' color='gray.700' mb={2}>
                    Mô tả
                  </Text>
                  <Input
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder='Mô tả lớp học (tùy chọn)'
                    borderColor='gray.200'
                    _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                  />
                </Box>

                <Box>
                  <Text fontSize='sm' fontWeight='medium' color='gray.700' mb={2}>
                    Mật khẩu lớp
                  </Text>
                  <Input
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder='Mật khẩu để tham gia lớp'
                    borderColor='gray.200'
                    _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                  />
                </Box>
              </VStack>

              <HStack justify='flex-end' mt={6} gap={3}>
                <Button variant='ghost' onClick={() => setIsEditing(false)} disabled={saving}>
                  Hủy
                </Button>
                <Button
                  bg='#dd7323'
                  color='white'
                  _hover={{ bg: '#c2621a' }}
                  onClick={handleSaveClass}
                  disabled={saving}
                >
                  {saving ? <Loader2 size={18} className='animate-spin' /> : <Save size={18} />}
                  <Text ml={2}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
                </Button>
              </HStack>
            </Box>
          </Box>
        )}

        {/* Tabs */}
        <Box px={6}>
          <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
            <Tabs.List bg='white' borderBottom='2px solid' borderColor='gray.100' mb={6} gap={0}>
              <Tabs.Trigger
                value='assignments'
                px={6}
                py={3}
                fontWeight='medium'
                color='gray.500'
                borderBottom='3px solid'
                borderColor='transparent'
                marginBottom='-2px'
                _selected={{
                  color: '#dd7323',
                  borderColor: '#dd7323',
                  fontWeight: 'semibold'
                }}
                _hover={{ color: '#dd7323' }}
                transition='all 0.2s'
              >
                <HStack gap={2}>
                  <FileText size={18} />
                  <Text>Bài tập</Text>
                </HStack>
              </Tabs.Trigger>
              <Tabs.Trigger
                value='posts'
                px={6}
                py={3}
                fontWeight='medium'
                color='gray.500'
                borderBottom='3px solid'
                borderColor='transparent'
                marginBottom='-2px'
                _selected={{
                  color: '#dd7323',
                  borderColor: '#dd7323',
                  fontWeight: 'semibold'
                }}
                _hover={{ color: '#dd7323' }}
                transition='all 0.2s'
              >
                <HStack gap={2}>
                  <MessageSquare size={18} />
                  <Text>Bài đăng</Text>
                </HStack>
              </Tabs.Trigger>
              <Tabs.Trigger
                value='students'
                px={6}
                py={3}
                fontWeight='medium'
                color='gray.500'
                borderBottom='3px solid'
                borderColor='transparent'
                marginBottom='-2px'
                _selected={{
                  color: '#dd7323',
                  borderColor: '#dd7323',
                  fontWeight: 'semibold'
                }}
                _hover={{ color: '#dd7323' }}
                transition='all 0.2s'
              >
                <HStack gap={2}>
                  <Users size={18} />
                  <Text>Sinh viên</Text>
                </HStack>
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value='assignments'>
              <LecturerAssignmentTab classId={classId || ''} />
            </Tabs.Content>

            <Tabs.Content value='posts'>
              <LecturerPostTab classId={classId || ''} />
            </Tabs.Content>

            <Tabs.Content value='students'>
              <LecturerStudentTab classId={classId || ''} />
            </Tabs.Content>
          </Tabs.Root>
        </Box>
      </Box>
    </Box>
  )
}
