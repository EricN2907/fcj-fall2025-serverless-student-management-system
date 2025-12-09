'use client'

import { useEffect, useState, useCallback } from 'react'
import { Box, Button, Text, VStack, Spinner, Center } from '@chakra-ui/react'
import { ErrorDisplay } from '../../components/ui/ErrorDisplay'
import { BookOpen, GraduationCap } from 'lucide-react'
import api from '../../utils/axios'
import CourseCard, { type EnrolledClass } from '../../components/ui/CourseCard'
import PageHeader from '../../components/ui/PageHeader'
import { useAuthStore } from '../../store/authStore'
import { toaster } from '../../components/ui/toaster'
import { studentClassApi } from '../../services/studentApi'

export default function MyCoursesRoute() {
  const [courses, setCourses] = useState<EnrolledClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuthStore()

  const fetchMyCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Call API to get enrolled classes - GET /api/student/classes/enrolled
      const response = await api.get('/api/student/classes/enrolled')
      console.log('Enrolled classes full response:', response)
      console.log('Enrolled classes response.data:', response.data)

      // BE có thể trả về nhiều format khác nhau:
      // 1. { data: [...], count, message, status }
      // 2. { results: [...] }
      // 3. Array trực tiếp [...]
      let results: any[] = []
      if (Array.isArray(response.data)) {
        results = response.data
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        results = response.data.data
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        results = response.data.results
      }

      console.log('Parsed results:', results)

      // Map API response to EnrolledClass format
      const mappedCourses: EnrolledClass[] = results.map((c: any) => ({
        classId: c.classId || c.class_id || c.id || '',
        subjectId: c.subjectId || c.subject_id || '',
        subjectName: c.subjectName || c.subject_name || c.name || '',
        lecturerName: c.lecturerName || c.lecturer_name || c.teacherName || c.teacher_name || '',
        totalStudents: c.studentCount || c.student_count || c.totalStudents || 0,
        enrolledAt: c.enrolledAt || c.enrolled_at || c.createdAt || c.created_at || ''
      }))

      console.log('Mapped courses:', mappedCourses)
      setCourses(mappedCourses)
    } catch (err: any) {
      console.error('Failed to fetch enrolled courses:', err)
      console.error('Error response:', err.response)
      const errorMessage = err.response?.data?.message || 'Không thể tải danh sách lớp học. Vui lòng thử lại.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMyCourses()
  }, [fetchMyCourses])

  const handleViewDetails = (classId: string) => {
    window.location.href = `/student/course-details/${classId}`
  }

  const handleUnenroll = async (classId: string) => {
    if (!user?.id) {
      toaster.error({
        title: 'Lỗi',
        description: 'Vui lòng đăng nhập để thực hiện thao tác này.'
      })
      throw new Error('User not authenticated')
    }

    try {
      // Call unenroll API - POST /api/student/enroll with action='unenroll'
      // Dùng studentClassApi.unenroll để gửi đúng headers và body format
      await studentClassApi.unenroll(classId)

      // Remove from local state on success
      setCourses(courses.filter((c) => c.classId !== classId))

      toaster.success({
        title: 'Thành công',
        description: 'Đã hủy đăng ký lớp học thành công.'
      })
    } catch (err: any) {
      console.error('Failed to unenroll:', err)
      const errorMessage = err.response?.data?.message || 'Không thể hủy đăng ký lớp học. Vui lòng thử lại.'
      toaster.error({
        title: 'Lỗi',
        description: errorMessage
      })
      throw err // Re-throw to let CourseCard handle error state
    }
  }

  if (loading) {
    return (
      <Box minH='60vh' display='flex' alignItems='center' justifyContent='center'>
        <VStack gap={4} colorPalette='orange'>
          <Spinner size='xl' color='colorPalette.500' borderWidth='4px' />
          <Text color='fg.muted' fontWeight='medium'>
            Loading courses...
          </Text>
        </VStack>
      </Box>
    )
  }

  if (error) {
    // Detect unauthenticated error
    const isUnauth = error.toLowerCase().includes('đăng nhập') || error.toLowerCase().includes('login')
    return (
      <ErrorDisplay
        variant={isUnauth ? 'unauthenticated' : 'fetch'}
        message={error}
        onRetry={!isUnauth ? fetchMyCourses : undefined}
        retryLabel={!isUnauth ? undefined : 'Đăng nhập'}
      />
    )
  }

  // Main UI
  return (
    <Box w='full' py={8} px={{ base: 4, sm: 6, lg: 8 }} bg='white' minH='100vh' overflowY='auto'>
      <Box maxW='6xl' mx='auto'>
        {/* Header */}
        <PageHeader icon={GraduationCap} title='Lớp học của tôi' subtitle='Quản lý các lớp học bạn đã đăng ký' />

        {/* Courses Grid or Suggest Enroll */}
        {courses.length === 0 ? (
          <Center py={20}>
            <VStack
              gap={8}
              p={12}
              bg='white'
              borderRadius='3xl'
              shadow='xl'
              border='2px dashed'
              borderColor='orange.200'
              maxW='lg'
              w='full'
              position='relative'
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                bgGradient: 'to-r',
                gradientFrom: 'orange.400',
                gradientTo: 'amber.400'
              }}
            >
              <Box p={6} borderRadius='full' bg='orange.50' shadow='inner' border='3px solid' borderColor='orange.100'>
                <BookOpen size={64} color='#dd7323' />
              </Box>
              <VStack gap={3}>
                <Text
                  fontWeight='bold'
                  fontSize='2xl'
                  bgGradient='to-r'
                  gradientFrom='gray.800'
                  gradientTo='gray.600'
                  bgClip='text'
                >
                  Chưa có lớp học nào!
                </Text>
                <Text color='gray.600' textAlign='center' fontSize='md' lineHeight='1.7' maxW='sm'>
                  Bạn chưa đăng ký lớp học nào. Hãy khám phá và đăng ký ngay!
                </Text>
              </VStack>
              <Button
                bg='#dd7323'
                color='white'
                size='xl'
                borderRadius='xl'
                shadow='lg'
                px={8}
                _hover={{
                  bg: '#c5651f',
                  shadow: 'xl',
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s'
                }}
                onClick={() => (window.location.href = '/student/all-courses')}
              >
                <BookOpen size={20} />
                Khám phá và đăng ký lớp học
              </Button>
            </VStack>
          </Center>
        ) : (
          <Box w='full'>
            {/* Grid với Flexbox để căn giữa các card khi không đủ 3 */}
            <Box display='flex' flexWrap='wrap' justifyContent='center' gap={8} w='full'>
              {courses.map((course) => (
                <Box
                  key={course.classId}
                  w={{ base: 'full', md: 'calc(50% - 16px)', lg: 'calc(33.333% - 22px)' }}
                  maxW='360px'
                  display='flex'
                  justifyContent='center'
                >
                  <CourseCard course={course} onViewDetails={handleViewDetails} onUnenroll={handleUnenroll} />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}
