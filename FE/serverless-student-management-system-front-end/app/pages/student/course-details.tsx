'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Box, Tabs, VStack, HStack, Text, Spinner, Card, Button, Input, Field } from '@chakra-ui/react'
import { FileText, MessageSquare, ChevronLeft, UserPlus, Lock, BookOpen, Users } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { AssignmentTab, PostTab } from '../../components/course'
import { ErrorDisplay } from '../../components/ui/ErrorDisplay'
import { studentClassApi } from '../../services/studentApi'
import { toaster } from '../../components/ui/toaster'
import api from '../../utils/axios'

interface ClassInfo {
  id: string
  name: string
  subject_name: string
  teacher_name: string
  semester: string
  academic_year: string
  student_count?: number
}

export default function CourseDetailsRoute() {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('assignments')

  // Enrollment state
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null)
  const [enrollPassword, setEnrollPassword] = useState('')
  const [enrolling, setEnrolling] = useState(false)

  // Check if student is enrolled in this class
  const checkEnrollment = useCallback(async () => {
    if (!classId) return

    try {
      console.log('=== CHECK ENROLLMENT ===')
      console.log('Checking enrollment for classId:', classId)

      // Gọi API với class_id cụ thể để kiểm tra enrollment
      const enrolledClasses = await studentClassApi.getEnrolledClasses(classId)
      console.log('Enrolled classes response for classId:', classId, enrolledClasses)

      // Nếu API trả về rỗng hoặc không có kết quả => chưa enrolled
      if (!enrolledClasses || enrolledClasses.length === 0) {
        console.log('No enrollment found for classId:', classId)
        setIsEnrolled(false)
        return
      }

      // Nếu gọi API với class_id cụ thể và có kết quả => đã enrolled
      // Lấy class đầu tiên từ kết quả (vì đã filter theo class_id)
      const foundClass = enrolledClasses[0] as any
      console.log('Found class (first result):', foundClass)

      // Double check: verify class ID matches (handle cả snake_case và camelCase)
      const cId = foundClass.class_id || foundClass.classId || foundClass.id || ''
      const normalizedCId = cId.replace('CLASS#', '')
      const normalizedClassId = classId.replace('CLASS#', '')

      const isMatch =
        cId === classId ||
        cId === `CLASS#${classId}` ||
        normalizedCId === classId ||
        normalizedCId === normalizedClassId

      console.log('Class ID match check:', { cId, classId, normalizedCId, normalizedClassId, isMatch })

      if (isMatch || enrolledClasses.length === 1) {
        // Nếu match hoặc chỉ có 1 kết quả (BE đã filter) => enrolled
        setIsEnrolled(true)
        setClassInfo({
          id: foundClass.class_id || foundClass.classId || foundClass.id || classId,
          name: foundClass.name || foundClass.className || classId,
          subject_name: foundClass.subjectName || foundClass.subject_name || '',
          teacher_name: foundClass.lecturerName || foundClass.lecturer_name || foundClass.teacherName || '',
          semester: foundClass.semester || '',
          academic_year: foundClass.academic_year || foundClass.academicYear || '',
          student_count: foundClass.student_count || foundClass.studentCount
        })
      } else {
        // Nếu có nhiều kết quả nhưng không match => tìm trong list
        const matchedClass = enrolledClasses.find((c: any) => {
          const id = c.class_id || c.classId || c.id || ''
          return id.replace('CLASS#', '') === normalizedClassId
        })

        if (matchedClass) {
          setIsEnrolled(true)
          setClassInfo({
            id: (matchedClass as any).class_id || (matchedClass as any).classId || (matchedClass as any).id || classId,
            name: (matchedClass as any).name || classId,
            subject_name: (matchedClass as any).subjectName || '',
            teacher_name: (matchedClass as any).lecturerName || '',
            semester: (matchedClass as any).semester || '',
            academic_year: (matchedClass as any).academic_year || (matchedClass as any).academicYear || '',
            student_count: (matchedClass as any).student_count || (matchedClass as any).studentCount
          })
        } else {
          setIsEnrolled(false)
        }
      }

      console.log('=== END CHECK ENROLLMENT ===')
    } catch (err: any) {
      console.error('=== ENROLLMENT CHECK ERROR ===')
      console.error('Failed to check enrollment:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
      // Nếu lỗi, coi như chưa enrolled
      setIsEnrolled(false)
    }
  }, [classId])

  // Fetch class info (for non-enrolled view)
  const fetchClassInfo = useCallback(async () => {
    if (!classId) return

    try {
      // Try to get class info from search or public API
      const response = await api.get(`/api/search`, {
        params: { type: 'classes', keyword: classId }
      })
      console.log('Class search response:', response.data)

      const results = Array.isArray(response.data) ? response.data : response.data?.data || []
      const foundClass = results.find(
        (c: any) => c.id === classId || c.id === `CLASS#${classId}` || c.id?.replace('CLASS#', '') === classId
      )

      if (foundClass) {
        setClassInfo({
          id: foundClass.id,
          name: foundClass.title || classId,
          subject_name: foundClass.subtitle || '',
          teacher_name: foundClass.extraInfo || '',
          semester: '',
          academic_year: ''
        })
      } else {
        // Fallback
        setClassInfo({
          id: classId,
          name: classId,
          subject_name: '',
          teacher_name: '',
          semester: '',
          academic_year: ''
        })
      }
    } catch (err) {
      console.error('Failed to fetch class info:', err)
      setClassInfo({
        id: classId,
        name: classId,
        subject_name: '',
        teacher_name: '',
        semester: '',
        academic_year: ''
      })
    }
  }, [classId])

  // Main effect: check enrollment first
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await checkEnrollment()
      setLoading(false)
    }
    init()
  }, [checkEnrollment])

  // Fetch class info if not enrolled
  useEffect(() => {
    if (isEnrolled === false && !classInfo) {
      fetchClassInfo()
    }
  }, [isEnrolled, classInfo, fetchClassInfo])

  // Handle enroll
  const handleEnroll = async () => {
    if (!classId || !enrollPassword.trim()) {
      toaster.create({
        title: 'Lỗi',
        description: 'Vui lòng nhập mật khẩu lớp học',
        type: 'error'
      })
      return
    }

    try {
      setEnrolling(true)
      // Gọi API enroll với classId và password
      await studentClassApi.enroll(classId, enrollPassword)

      toaster.create({
        title: 'Thành công',
        description: 'Đã đăng ký vào lớp học',
        type: 'success'
      })

      // Re-check enrollment to refresh UI
      setIsEnrolled(null)
      await checkEnrollment()
      setIsEnrolled(true)
    } catch (err: any) {
      console.error('Failed to enroll:', err)
      toaster.create({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Không thể đăng ký vào lớp học. Kiểm tra lại mật khẩu.',
        type: 'error'
      })
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <Box minH='60vh' display='flex' alignItems='center' justifyContent='center' bg='white'>
        <VStack gap={3}>
          <Spinner size='xl' color='#dd7323' borderWidth='4px' />
          <Text color='gray.600'>Đang kiểm tra thông tin lớp học...</Text>
        </VStack>
      </Box>
    )
  }

  if (error) {
    return <ErrorDisplay variant='fetch' message={error} onRetry={checkEnrollment} />
  }

  // Not enrolled - show enroll UI
  if (isEnrolled === false) {
    return (
      <Box w='full' py={8} px={{ base: 4, sm: 6, lg: 8 }} bg='gray.50' minH='100vh'>
        <Box maxW='2xl' mx='auto'>
          {/* Back Button */}
          <HStack
            mb={6}
            gap={2}
            cursor='pointer'
            color='gray.600'
            _hover={{ color: '#dd7323' }}
            onClick={() => navigate(-1)}
            w='fit-content'
          >
            <ChevronLeft size={20} />
            <Text fontWeight='medium'>Quay lại</Text>
          </HStack>

          {/* Enroll Card */}
          <Card.Root bg='white' borderRadius='2xl' shadow='lg' overflow='hidden'>
            {/* Header with gradient */}
            <Box h='120px' bg='linear-gradient(135deg, #dd7323 0%, #f59e0b 100%)' position='relative'>
              <Box
                position='absolute'
                bottom='-30px'
                left='50%'
                transform='translateX(-50%)'
                w='70px'
                h='70px'
                bg='white'
                borderRadius='xl'
                display='flex'
                alignItems='center'
                justifyContent='center'
                shadow='lg'
              >
                <BookOpen size={32} color='#dd7323' />
              </Box>
            </Box>

            <Card.Body pt={12} pb={8} px={8}>
              <VStack gap={6} align='stretch'>
                {/* Class Info */}
                <VStack gap={2}>
                  <Text fontSize='2xl' fontWeight='bold' color='gray.800' textAlign='center'>
                    {classInfo?.name || classId}
                  </Text>
                  {classInfo?.subject_name && (
                    <Text fontSize='lg' color='gray.600' textAlign='center'>
                      {classInfo.subject_name}
                    </Text>
                  )}
                  {classInfo?.teacher_name && (
                    <HStack justify='center' gap={2} color='gray.500'>
                      <Users size={16} />
                      <Text fontSize='sm'>GV: {classInfo.teacher_name}</Text>
                    </HStack>
                  )}
                </VStack>

                {/* Info Box */}
                <Box p={4} bg='orange.50' borderRadius='xl'>
                  <VStack gap={2} align='stretch'>
                    <HStack gap={2}>
                      <Lock size={18} color='#dd7323' />
                      <Text fontWeight='medium' color='gray.700'>
                        Lớp học yêu cầu mật khẩu để đăng ký
                      </Text>
                    </HStack>
                    <Text fontSize='sm' color='gray.600'>
                      Liên hệ giảng viên để nhận mật khẩu lớp học
                    </Text>
                  </VStack>
                </Box>

                {/* Password Input */}
                <Field.Root>
                  <Field.Label fontWeight='medium' color='gray.700'>
                    Mật khẩu lớp học
                  </Field.Label>
                  <Input
                    type='password'
                    placeholder='Nhập mật khẩu lớp học...'
                    value={enrollPassword}
                    onChange={(e) => setEnrollPassword(e.target.value)}
                    borderColor='gray.200'
                    borderRadius='xl'
                    _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleEnroll()}
                  />
                </Field.Root>

                {/* Enroll Button */}
                <Button
                  bg='#dd7323'
                  color='white'
                  size='lg'
                  borderRadius='xl'
                  _hover={{ bg: '#c5651f' }}
                  onClick={handleEnroll}
                  disabled={enrolling || !enrollPassword.trim()}
                >
                  {enrolling ? (
                    <Spinner size='sm' />
                  ) : (
                    <>
                      <UserPlus size={20} />
                      <Text ml={2}>Đăng ký vào lớp</Text>
                    </>
                  )}
                </Button>
              </VStack>
            </Card.Body>
          </Card.Root>
        </Box>
      </Box>
    )
  }

  // Enrolled - show class detail UI
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
          onClick={() => navigate('/student/my-courses')}
          w='fit-content'
        >
          <ChevronLeft size={20} />
          <Text fontWeight='medium'>Quay lại danh sách lớp</Text>
        </HStack>

        {/* Header */}
        <PageHeader
          icon={FileText}
          title={classInfo?.subject_name || classInfo?.name || 'Chi tiết lớp học'}
          subtitle={
            [
              classInfo?.name,
              classInfo?.teacher_name ? `GV: ${classInfo.teacher_name}` : null,
              classInfo?.semester,
              classInfo?.academic_year
            ]
              .filter(Boolean)
              .join(' • ') || 'Thông tin lớp học'
          }
        />

        {/* Tabs */}
        <Box px={6}>
          <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
            <Tabs.List bg='orange.50' borderRadius='xl' p={1} mb={6}>
              <Tabs.Trigger
                value='assignments'
                flex={1}
                borderRadius='lg'
                fontWeight='semibold'
                _selected={{ bg: '#dd7323', color: 'white' }}
                _hover={{ bg: activeTab === 'assignments' ? '#dd7323' : 'orange.100' }}
              >
                <HStack gap={2}>
                  <FileText size={18} />
                  <Text>Bài tập</Text>
                </HStack>
              </Tabs.Trigger>
              <Tabs.Trigger
                value='posts'
                flex={1}
                borderRadius='lg'
                fontWeight='semibold'
                _selected={{ bg: '#dd7323', color: 'white' }}
                _hover={{ bg: activeTab === 'posts' ? '#dd7323' : 'orange.100' }}
              >
                <HStack gap={2}>
                  <MessageSquare size={18} />
                  <Text>Bài đăng</Text>
                </HStack>
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value='assignments'>
              <AssignmentTab classId={classId || ''} />
            </Tabs.Content>

            <Tabs.Content value='posts'>
              <PostTab classId={classId || ''} />
            </Tabs.Content>
          </Tabs.Root>
        </Box>
      </Box>
    </Box>
  )
}
