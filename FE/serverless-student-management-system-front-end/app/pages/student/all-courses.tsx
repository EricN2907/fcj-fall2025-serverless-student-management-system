'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, ChevronRight, BookOpen, Library } from 'lucide-react'
import { Box, Text, VStack, Spinner, Collapsible, SimpleGrid, HStack, Icon } from '@chakra-ui/react'
import { ErrorDisplay } from '../../components/ui/ErrorDisplay'
import SubjectClassCard, { type ClassInfo } from '../../components/ui/SubjectClassCard'
import EnrolmentModal from '../../components/ui/EnrolmentModal'
import PageHeader from '../../components/ui/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import { toaster } from '../../components/ui/toaster'
import api from '../../utils/axios'

// API Response types
interface SubjectFromAPI {
  id: string
  name: string
  description?: string
  credits?: number
}

interface ClassFromAPI {
  id: number
  name: string
  subject_id: number
  subject_name?: string
  teacher_id: number
  teacher_name?: string
  semester: string
  academic_year: string
  student_count: number
  status: number
}

interface SubjectsAPIResponse {
  data: SubjectFromAPI[]
  count: number
  message: string
}

interface ClassesAPIResponse {
  data: ClassFromAPI[]
  count: number
  message: string
}

interface Subject {
  id: string
  name: string
  description: string
  credits: number
}

interface SubjectWithClasses extends Subject {
  classes: ClassInfo[]
  isLoading: boolean
  isLoaded: boolean
}

export default function AllCoursesRoute() {
  const [subjects, setSubjects] = useState<SubjectWithClasses[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())

  // Modal state
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null)
  const [selectedCardIndex, setSelectedCardIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchSubjects = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get<SubjectsAPIResponse>('/api/v1/subjects')

      const mappedSubjects: SubjectWithClasses[] = (response.data.data || []).map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description || 'Chưa có mô tả',
        credits: s.credits || 0,
        classes: [],
        isLoading: false,
        isLoaded: false
      }))

      setSubjects(mappedSubjects)
    } catch (err) {
      setError('Không thể tải danh sách môn học. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchClassesForSubject = useCallback(async (subjectId: string) => {
    // Update loading state
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, isLoading: true } : s))
    )

    try {
      const response = await api.get<ClassesAPIResponse>(`/api/v1/subjects/${subjectId}/classes`)

      const classes: ClassInfo[] = (response.data.data || []).map((c) => ({
        id: c.id,
        name: c.name,
        subject_id: c.subject_id,
        subject_name: c.subject_name || '',
        teacher_id: c.teacher_id,
        teacher_name: c.teacher_name || 'Chưa có giảng viên',
        semester: c.semester,
        academic_year: c.academic_year,
        student_count: c.student_count,
        status: c.status
      }))

      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId ? { ...s, classes, isLoading: false, isLoaded: true } : s
        )
      )
    } catch (err) {
      console.error('Failed to fetch classes:', err)
      setSubjects((prev) =>
        prev.map((s) => (s.id === subjectId ? { ...s, isLoading: false, isLoaded: true } : s))
      )
    }
  }, [])

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  const handleToggleSubject = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId)

    setExpandedSubjects((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId)
      } else {
        newSet.add(subjectId)
        // Fetch classes if not loaded yet
        if (subject && !subject.isLoaded && !subject.isLoading) {
          fetchClassesForSubject(subjectId)
        }
      }
      return newSet
    })
  }

  const handleClassClick = (classInfo: ClassInfo, index: number) => {
    setSelectedClass(classInfo)
    setSelectedCardIndex(index)
    setIsModalOpen(true)
  }

  const handleEnrol = async (classId: number, enrolmentKey: string) => {
    try {
      await api.post(`/api/v1/classes/${classId}/enrol`, {
        enrolment_key: enrolmentKey
      })

      toaster.create({
        title: 'Đăng ký thành công',
        description: 'Bạn đã đăng ký lớp học thành công!',
        type: 'success',
        duration: 3000
      })

      setIsModalOpen(false)
    } catch (err: any) {
      const message = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại mã đăng ký.'
      toaster.create({
        title: 'Đăng ký thất bại',
        description: message,
        type: 'error',
        duration: 3000
      })
      throw err
    }
  }

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <Box minH='60vh' display='flex' alignItems='center' justifyContent='center' bg='gray.50'>
        <VStack gap={3}>
          <Spinner size='xl' color='orange.500' borderWidth='4px' />
          <Text color='gray.600'>Đang tải môn học...</Text>
        </VStack>
      </Box>
    )
  }

  if (error) {
    return <ErrorDisplay variant='fetch' message={error} onRetry={fetchSubjects} />
  }

  return (
    <Box w='full' py={8} px={{ base: 4, sm: 6, lg: 8 }} bg='white' minH='100vh'>
      <Box maxW='6xl' mx='auto'>
        {/* Header */}
        <PageHeader icon={Library} title='Tất cả môn học' subtitle='Khám phá các môn học có sẵn trong hệ thống' />

        {/* Search Bar */}
        <Box mb={6} px={6}>
          <Box position='relative'>
            <Box
              position='absolute'
              left={4}
              top='50%'
              transform='translateY(-50%)'
              zIndex={1}
              color='gray.400'
            >
              <Search size={20} />
            </Box>
            <input
              type='text'
              placeholder='Tìm kiếm theo tên hoặc mã môn học...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '48px',
                paddingRight: '16px',
                paddingTop: '12px',
                paddingBottom: '12px',
                border: '1px solid #fed7aa',
                borderRadius: '12px',
                outline: 'none',
                backgroundColor: '#fite',
                fontSize: '14px'
              }}
            />
          </Box>
        </Box>

        {/* Subjects List */}
        {filteredSubjects.length === 0 ? (
          <Box px={6}>
            <EmptyState icon={BookOpen} title='Không tìm thấy môn học nào' />
          </Box>
        ) : (
          <VStack align='stretch' gap={2}>
            {filteredSubjects.map((subject) => {
              const isExpanded = expandedSubjects.has(subject.id)

              return (
                <Collapsible.Root
                  key={subject.id}
                  open={isExpanded}
                  onOpenChange={() => handleToggleSubject(subject.id)}
                >
                  {/* Subject Header */}
                  <Collapsible.Trigger asChild>
                    <HStack
                      as='button'
                      w='full'
                      py={3}
                      px={2}
                      gap={2}
                      cursor='pointer'
                      _hover={{ bg: 'gray.100' }}
                      borderRadius='lg'
                      transition='all 0.2s'
                    >
                      <Icon
                        asChild
                        color='#dd7323'
                        transform={isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}
                        transition='transform 0.2s'
                      >
                        <ChevronRight size={20} />
                      </Icon>
                      <Text
                        fontSize='lg'
                        fontWeight='semibold'
                        color='#dd7323'
                        textAlign='left'
                      >
                        {subject.id}-{subject.name}
                      </Text>
                    </HStack>
                  </Collapsible.Trigger>

                  {/* Classes Grid */}
                  <Collapsible.Content>
                    <Box pl={8} pr={2} pb={4}>
                      {subject.isLoading ? (
                        <HStack gap={2} py={4}>
                          <Spinner size='sm' color='orange.500' />
                          <Text fontSize='sm' color='gray.500'>
                            Đang tải danh sách lớp...
                          </Text>
                        </HStack>
                      ) : subject.classes.length === 0 ? (
                        <Text fontSize='sm' color='gray.500' py={4}>
                          Chưa có lớp học nào cho môn này
                        </Text>
                      ) : (
                        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4} pt={2}>
                          {subject.classes.map((classInfo, index) => (
                            <SubjectClassCard
                              key={classInfo.id}
                              classInfo={classInfo}
                              index={index}
                              onClick={() => handleClassClick(classInfo, index)}
                            />
                          ))}
                        </SimpleGrid>
                      )}
                    </Box>
                  </Collapsible.Content>
                </Collapsible.Root>
              )
            })}
          </VStack>
        )}
      </Box>

      {/* Enrolment Modal */}
      <EnrolmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classInfo={selectedClass}
        cardIndex={selectedCardIndex}
        onEnrol={handleEnrol}
      />
    </Box>
  )
}
