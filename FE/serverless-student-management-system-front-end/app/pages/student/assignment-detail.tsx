'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Box,
  Text,
  VStack,
  HStack,
  Spinner,
  Card,
  Badge,
  Button,
  Textarea,
  Input
} from '@chakra-ui/react'
import {
  ChevronLeft,
  FileText,
  Calendar,
  Upload,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  File
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import PageHeader from '../../components/ui/PageHeader'
import { ErrorDisplay } from '../../components/ui/ErrorDisplay'
import { toaster } from '../../components/ui/toaster'
import api from '../../utils/axios'

interface AssignmentDetail {
  id: number
  title: string
  description: string
  type: 'homework' | 'project' | 'midterm' | 'final'
  deadline: string
  max_score: number
  weight: number
  attachments: { id: number; file_name: string; file_url: string }[]
  submission?: {
    id: number
    file_url: string
    file_name: string
    submitted_at: string
    score: number | null
    feedback: string | null
    status: 'on_time' | 'late' | 'missing'
  }
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

export default function AssignmentDetailRoute() {
  const { classId, assignmentId } = useParams<{ classId: string; assignmentId: string }>()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Submission form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchAssignment = useCallback(async () => {
    if (!classId || !assignmentId) return
    setLoading(true)
    setError(null)
    try {
      const response = await api.get<{ data: AssignmentDetail }>(
        `/api/student/classes/${classId}/assignments/${assignmentId}`
      )
      setAssignment(response.data.data)
    } catch (err) {
      console.error('Failed to fetch assignment:', err)
      setError('Không thể tải thông tin bài tập. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [classId, assignmentId])

  useEffect(() => {
    fetchAssignment()
  }, [fetchAssignment])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      toaster.create({
        title: 'Lỗi',
        description: 'Vui lòng chọn file để nộp bài',
        type: 'error'
      })
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (comment) {
        formData.append('comment', comment)
      }

      await api.post(`/api/student/assignments/${assignmentId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toaster.create({
        title: 'Thành công',
        description: 'Nộp bài thành công!',
        type: 'success'
      })

      // Refresh data
      fetchAssignment()
    } catch (err: any) {
      const message = err.response?.data?.message || 'Nộp bài thất bại. Vui lòng thử lại.'
      toaster.create({
        title: 'Lỗi',
        description: message,
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isOverdue = assignment ? new Date(assignment.deadline) < new Date() : false
  const canSubmit = assignment && !assignment.submission && !isOverdue

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
    return <ErrorDisplay variant='fetch' message={error} onRetry={fetchAssignment} />
  }

  if (!assignment) return null

  return (
    <Box w='full' py={8} px={{ base: 4, sm: 6, lg: 8 }} bg='white' minH='100vh'>
      <Box maxW='4xl' mx='auto'>
        {/* Back Button */}
        <HStack
          mb={4}
          px={6}
          gap={2}
          cursor='pointer'
          color='gray.600'
          _hover={{ color: '#dd7323' }}
          onClick={() => navigate(`/student/course-details/${classId}`)}
          w='fit-content'
        >
          <ChevronLeft size={20} />
          <Text fontWeight='medium'>Quay lại danh sách bài tập</Text>
        </HStack>

        {/* Header */}
        <PageHeader icon={FileText} title={assignment.title} subtitle={`Trọng số: ${(assignment.weight * 100).toFixed(0)}%`} />

        <VStack gap={6} px={6} align='stretch'>
          {/* Assignment Info Card */}
          <Card.Root bg='white' borderRadius='xl' border='1px solid' borderColor='orange.200' shadow='sm'>
            <Card.Body p={6}>
              <HStack gap={4} mb={6} flexWrap='wrap'>
                <Badge colorPalette={TYPE_COLORS[assignment.type]} variant='solid' borderRadius='full' px={3} py={1}>
                  {TYPE_LABELS[assignment.type]}
                </Badge>
                <HStack gap={2} color='gray.600'>
                  <Calendar size={16} />
                  <Text fontSize='sm'>
                    Deadline: {new Date(assignment.deadline).toLocaleDateString('vi-VN')} •{' '}
                    {new Date(assignment.deadline).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </HStack>
                <HStack gap={2} color='gray.600'>
                  <FileText size={16} />
                  <Text fontSize='sm'>Điểm tối đa: {assignment.max_score}</Text>
                </HStack>
              </HStack>

              {/* Description */}
              <Text fontWeight='semibold' color='gray.800' mb={3}>
                Mô tả bài tập
              </Text>
              <Box
                bg='gray.50'
                borderRadius='lg'
                p={4}
                mb={6}
                className='markdown-content'
                css={{
                  '& h1, & h2, & h3': { fontWeight: 'bold', marginTop: '1em', marginBottom: '0.5em' },
                  '& p': { marginBottom: '0.5em' },
                  '& ul, & ol': { paddingLeft: '1.5em', marginBottom: '0.5em' },
                  '& code': { background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em' },
                  '& pre': { background: '#e2e8f0', padding: '12px', borderRadius: '8px', overflow: 'auto' }
                }}
              >
                <ReactMarkdown>{assignment.description || 'Không có mô tả'}</ReactMarkdown>
              </Box>

              {/* Attachments */}
              {assignment.attachments.length > 0 && (
                <>
                  <Text fontWeight='semibold' color='gray.800' mb={3}>
                    File đính kèm
                  </Text>
                  <VStack align='stretch' gap={2} mb={6}>
                    {assignment.attachments.map((file) => (
                      <HStack
                        key={file.id}
                        p={3}
                        bg='orange.50'
                        borderRadius='lg'
                        justify='space-between'
                        _hover={{ bg: 'orange.100' }}
                        transition='all 0.2s'
                      >
                        <HStack gap={2}>
                          <File size={18} color='#dd7323' />
                          <Text fontSize='sm' color='gray.700'>
                            {file.file_name}
                          </Text>
                        </HStack>
                        <Button
                          size='sm'
                          variant='ghost'
                          color='#dd7323'
                          _hover={{ bg: 'orange.100' }}
                          onClick={() => window.open(file.file_url, '_blank')}
                        >
                          <Download size={16} />
                          Tải xuống
                        </Button>
                      </HStack>
                    ))}
                  </VStack>
                </>
              )}
            </Card.Body>
          </Card.Root>

          {/* Submission Status Card */}
          <Card.Root bg='white' borderRadius='xl' border='1px solid' borderColor='orange.200' shadow='sm'>
            <Card.Body p={6}>
              <Text fontWeight='semibold' color='gray.800' mb={4}>
                Trạng thái nộp bài
              </Text>

              {assignment.submission ? (
                // Already submitted
                <VStack align='stretch' gap={4}>
                  <HStack gap={3} p={4} bg='green.50' borderRadius='lg' border='1px solid' borderColor='green.200'>
                    <CheckCircle size={24} color='#38a169' />
                    <VStack align='flex-start' gap={0}>
                      <Text fontWeight='semibold' color='green.700'>
                        Đã nộp bài
                      </Text>
                      <Text fontSize='sm' color='green.600'>
                        {new Date(assignment.submission.submitted_at).toLocaleString('vi-VN')}
                      </Text>
                    </VStack>
                    <Badge
                      ml='auto'
                      colorPalette={assignment.submission.status === 'on_time' ? 'green' : 'yellow'}
                      variant='solid'
                      borderRadius='full'
                    >
                      {assignment.submission.status === 'on_time' ? 'Đúng hạn' : 'Trễ hạn'}
                    </Badge>
                  </HStack>

                  {/* Submitted file */}
                  <HStack p={3} bg='gray.50' borderRadius='lg' justify='space-between'>
                    <HStack gap={2}>
                      <File size={18} color='#dd7323' />
                      <Text fontSize='sm' color='gray.700'>
                        {assignment.submission.file_name}
                      </Text>
                    </HStack>
                    <Button
                      size='sm'
                      variant='ghost'
                      color='#dd7323'
                      onClick={() => window.open(assignment.submission!.file_url, '_blank')}
                    >
                      <Download size={16} />
                      Tải xuống
                    </Button>
                  </HStack>

                  {/* Score */}
                  {assignment.submission.score !== null ? (
                    <Box p={4} bg='orange.50' borderRadius='lg' border='1px solid' borderColor='orange.200'>
                      <HStack justify='space-between'>
                        <Text fontWeight='semibold' color='gray.800'>
                          Điểm số
                        </Text>
                        <Text fontSize='2xl' fontWeight='bold' color='#dd7323'>
                          {assignment.submission.score}/{assignment.max_score}
                        </Text>
                      </HStack>
                      {assignment.submission.feedback && (
                        <Box mt={3} pt={3} borderTop='1px solid' borderColor='orange.200'>
                          <Text fontSize='sm' fontWeight='medium' color='gray.700' mb={1}>
                            Nhận xét của giảng viên:
                          </Text>
                          <Text fontSize='sm' color='gray.600'>
                            {assignment.submission.feedback}
                          </Text>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <HStack gap={2} p={3} bg='yellow.50' borderRadius='lg' border='1px solid' borderColor='yellow.200'>
                      <Clock size={18} color='#d69e2e' />
                      <Text fontSize='sm' color='yellow.700'>
                        Bài nộp đang chờ chấm điểm
                      </Text>
                    </HStack>
                  )}
                </VStack>
              ) : isOverdue ? (
                // Overdue - cannot submit
                <HStack gap={3} p={4} bg='red.50' borderRadius='lg' border='1px solid' borderColor='red.200'>
                  <AlertCircle size={24} color='#e53e3e' />
                  <VStack align='flex-start' gap={0}>
                    <Text fontWeight='semibold' color='red.700'>
                      Đã quá hạn nộp bài
                    </Text>
                    <Text fontSize='sm' color='red.600'>
                      Bạn không thể nộp bài sau deadline
                    </Text>
                  </VStack>
                </HStack>
              ) : (
                // Can submit
                <VStack align='stretch' gap={4}>
                  <HStack gap={3} p={4} bg='yellow.50' borderRadius='lg' border='1px solid' borderColor='yellow.200'>
                    <Clock size={24} color='#d69e2e' />
                    <VStack align='flex-start' gap={0}>
                      <Text fontWeight='semibold' color='yellow.700'>
                        Chưa nộp bài
                      </Text>
                      <Text fontSize='sm' color='yellow.600'>
                        Hãy nộp bài trước deadline
                      </Text>
                    </VStack>
                  </HStack>

                  {/* Upload Form */}
                  <Box>
                    <Text fontSize='sm' fontWeight='medium' color='gray.700' mb={2}>
                      Chọn file nộp bài
                    </Text>
                    <Input
                      type='file'
                      onChange={handleFileChange}
                      p={1}
                      borderColor='orange.200'
                      _hover={{ borderColor: '#dd7323' }}
                    />
                    {selectedFile && (
                      <Text fontSize='sm' color='green.600' mt={1}>
                        Đã chọn: {selectedFile.name}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Text fontSize='sm' fontWeight='medium' color='gray.700' mb={2}>
                      Ghi chú (tùy chọn)
                    </Text>
                    <Textarea
                      placeholder='Nhập ghi chú cho bài nộp...'
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      borderColor='orange.200'
                      _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                      rows={3}
                    />
                  </Box>

                  <Button
                    bg='#dd7323'
                    color='white'
                    size='lg'
                    borderRadius='xl'
                    _hover={{ bg: '#c5651f' }}
                    onClick={handleSubmit}
                    loading={submitting}
                    loadingText='Đang nộp bài...'
                    disabled={!selectedFile}
                  >
                    <Upload size={18} />
                    Nộp bài
                  </Button>

                  <Text fontSize='xs' color='gray.500' textAlign='center'>
                    Lưu ý: Bạn chỉ được nộp bài 1 lần duy nhất
                  </Text>
                </VStack>
              )}
            </Card.Body>
          </Card.Root>
        </VStack>
      </Box>
    </Box>
  )
}
