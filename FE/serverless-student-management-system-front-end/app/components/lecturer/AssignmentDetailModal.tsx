'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Dialog,
  Portal,
  CloseButton,
  Spinner,
  Table,
  Link,
  Button,
  Input
} from '@chakra-ui/react'
import { FileText, Calendar, Award, Clock, Users, Lock, Unlock, Download, User, Check, X, Edit2 } from 'lucide-react'
import type { AssignmentDTO } from '../../types'
import { lecturerAssignmentApi } from '../../services/lecturerApi'
import { toaster } from '../ui/toaster'
import { fetchAuthSession } from '@aws-amplify/auth'

// Submission interface từ BE
interface SubmissionDTO {
  id: string
  student_id?: string
  studentId?: string
  student_name?: string
  studentName?: string
  file_url?: string
  fileUrl?: string
  file_name?: string
  fileName?: string
  submitted_at?: string
  submittedAt?: string
  created_at?: string
  createdAt?: string
  score?: number | null
  feedback?: string | null
  status?: string
}

interface AssignmentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  assignment: AssignmentDTO | null
  classId: string
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

export default function AssignmentDetailModal({ isOpen, onClose, assignment, classId }: AssignmentDetailModalProps) {
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  // State cho chấm điểm
  const [gradingStudentId, setGradingStudentId] = useState<string | null>(null)
  const [gradeInput, setGradeInput] = useState('')
  const [feedbackInput, setFeedbackInput] = useState('')
  const [isGrading, setIsGrading] = useState(false)

  // Fetch submissions khi modal mở
  const fetchSubmissions = useCallback(async () => {
    if (!assignment || !classId) return

    setLoadingSubmissions(true)
    try {
      const data = await lecturerAssignmentApi.getSubmissions(classId, String(assignment.id))
      setSubmissions(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('Failed to fetch submissions:', err)
      setSubmissions([])
    } finally {
      setLoadingSubmissions(false)
    }
  }, [assignment, classId])

  useEffect(() => {
    if (isOpen && assignment) {
      fetchSubmissions()
    } else {
      setSubmissions([])
      setGradingStudentId(null)
      setGradeInput('')
      setFeedbackInput('')
    }
  }, [isOpen, assignment, fetchSubmissions])

  // Hàm chấm điểm
  const handleGrade = async (studentId: string) => {
    if (!assignment || !classId) return

    const score = parseFloat(gradeInput)
    if (isNaN(score) || score < 0 || score > assignment.max_score) {
      toaster.create({
        title: 'Lỗi',
        description: `Điểm phải từ 0 đến ${assignment.max_score}`,
        type: 'error'
      })
      return
    }

    setIsGrading(true)
    try {
      // Lấy idToken từ Cognito session
      const session = await fetchAuthSession()
      const idToken = session.tokens?.idToken?.toString()

      if (!idToken) {
        throw new Error('Không tìm thấy token xác thực')
      }

      // Normalize assignmentId - ensure ASS_ prefix
      let normalizedAssignmentId = String(assignment.id)
      if (!normalizedAssignmentId.startsWith('ASS_') && !normalizedAssignmentId.includes('#')) {
        normalizedAssignmentId = `ASS_${normalizedAssignmentId}`
      }

      // Normalize classId - remove CLASS# prefix if present
      const normalizedClassId = classId.replace('CLASS#', '')

      // API: POST /api/lecturer/assignments/{assignment_id}/update-grades?classId={classId}
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
      const url = `${baseUrl}/api/lecturer/assignments/${normalizedAssignmentId}/update-grades?classId=${normalizedClassId}`

      // Body theo Swagger: { assignmentId, studentId, score, feedback }
      // Thêm classId vào body để BE có thể verify giảng viên
      const requestBody = {
        assignmentId: normalizedAssignmentId,
        studentId: studentId,
        score: score,
        feedback: feedbackInput || '',
        classId: normalizedClassId
      }

      console.log('=== GRADE API DEBUG ===')
      console.log('URL:', url)
      console.log('Method: POST')
      console.log('classId (original):', classId)
      console.log('classId (normalized):', normalizedClassId)
      console.log('assignmentId (original):', assignment.id)
      console.log('assignmentId (normalized):', normalizedAssignmentId)
      console.log('studentId:', studentId)
      console.log('Request body:', JSON.stringify(requestBody, null, 2))

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
          'user-idToken': idToken
        },
        body: JSON.stringify(requestBody)
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.log('Error response:', errorData)
        throw new Error(errorData.message || 'Lỗi khi chấm điểm')
      }

      toaster.create({
        title: 'Thành công',
        description: 'Đã chấm điểm cho học sinh',
        type: 'success'
      })

      // Cập nhật UI
      setSubmissions((prev) =>
        prev.map((sub) => {
          const subStudentId = sub.student_id || sub.studentId
          if (subStudentId === studentId) {
            return { ...sub, score: score, feedback: feedbackInput }
          }
          return sub
        })
      )

      // Reset form
      setGradingStudentId(null)
      setGradeInput('')
      setFeedbackInput('')
    } catch (err: any) {
      console.error('Failed to grade:', err)
      toaster.create({
        title: 'Lỗi',
        description: err.message || 'Không thể chấm điểm',
        type: 'error'
      })
    } finally {
      setIsGrading(false)
    }
  }

  if (!assignment) return null

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} placement='center'>
      <Portal>
        <Dialog.Backdrop bg='blackAlpha.600' backdropFilter='blur(4px)' />
        <Dialog.Positioner>
          <Dialog.Content borderRadius='2xl' shadow='2xl' maxW='lg' w='full' mx={4} overflow='hidden' bg='white'>
            <Dialog.Header p={6} pb={4} borderBottom='1px solid' borderColor='gray.100'>
              <HStack gap={3}>
                <Box p={2} bg='#dd7323' borderRadius='lg'>
                  <FileText size={20} color='white' />
                </Box>
                <Box flex={1}>
                  <Dialog.Title fontSize='xl' fontWeight='bold' color='gray.800'>
                    {assignment.title}
                  </Dialog.Title>
                  <HStack gap={2} mt={1}>
                    <Badge colorPalette={TYPE_COLORS[assignment.type]} variant='subtle' borderRadius='full'>
                      {TYPE_LABELS[assignment.type]}
                    </Badge>
                    {assignment.is_published ? (
                      <Badge colorPalette='green' variant='subtle' borderRadius='full'>
                        <Unlock size={12} />
                        <Text ml={1}>Đang mở</Text>
                      </Badge>
                    ) : (
                      <Badge colorPalette='red' variant='subtle' borderRadius='full'>
                        <Lock size={12} />
                        <Text ml={1}>Đã đóng</Text>
                      </Badge>
                    )}
                  </HStack>
                </Box>
              </HStack>
            </Dialog.Header>

            <Dialog.Body px={6} py={5}>
              <VStack gap={4} align='stretch'>
                {/* Deadline */}
                <HStack gap={3} p={3} bg='orange.50' borderRadius='lg'>
                  <Box p={2} bg='white' borderRadius='md'>
                    <Calendar size={18} color='#dd7323' />
                  </Box>
                  <Box>
                    <Text fontSize='xs' color='gray.500' fontWeight='medium'>
                      Deadline
                    </Text>
                    <Text fontWeight='semibold' color='gray.800'>
                      {formatDate(assignment.deadline)}
                    </Text>
                  </Box>
                </HStack>

                {/* Stats Row */}
                <HStack gap={3}>
                  <Box flex={1} p={3} bg='gray.50' borderRadius='lg'>
                    <HStack gap={2}>
                      <Award size={16} color='#dd7323' />
                      <Box>
                        <Text fontSize='xs' color='gray.500'>
                          Điểm tối đa
                        </Text>
                        <Text fontWeight='bold' color='gray.800'>
                          {assignment.max_score}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                  <Box flex={1} p={3} bg='gray.50' borderRadius='lg'>
                    <HStack gap={2}>
                      <Clock size={16} color='#dd7323' />
                      <Box>
                        <Text fontSize='xs' color='gray.500'>
                          Trọng số
                        </Text>
                        <Text fontWeight='bold' color='gray.800'>
                          {(assignment.weight * 100).toFixed(0)}%
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                  <Box flex={1} p={3} bg='gray.50' borderRadius='lg'>
                    <HStack gap={2}>
                      <Users size={16} color='#dd7323' />
                      <Box>
                        <Text fontSize='xs' color='gray.500'>
                          Đã nộp
                        </Text>
                        <Text fontWeight='bold' color='gray.800'>
                          {assignment.submission_count || 0}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                </HStack>

                {/* Description */}
                <Box>
                  <Text fontSize='sm' fontWeight='medium' color='gray.600' mb={2}>
                    Mô tả
                  </Text>
                  <Box p={3} bg='gray.50' borderRadius='lg'>
                    <Text color={assignment.description ? 'gray.700' : 'gray.400'} whiteSpace='pre-wrap'>
                      {assignment.description || 'Không có mô tả'}
                    </Text>
                  </Box>
                </Box>

                {/* Submissions List */}
                <Box>
                  <HStack justify='space-between' mb={3}>
                    <Text fontSize='sm' fontWeight='medium' color='gray.600'>
                      Danh sách bài nộp ({submissions.length})
                    </Text>
                    {loadingSubmissions && <Spinner size='sm' color='#dd7323' />}
                  </HStack>

                  {!loadingSubmissions && submissions.length === 0 ? (
                    <Box p={4} bg='gray.50' borderRadius='lg' textAlign='center'>
                      <Text color='gray.500' fontSize='sm'>
                        Chưa có học sinh nào nộp bài
                      </Text>
                    </Box>
                  ) : (
                    <Box maxH='200px' overflowY='auto' border='1px solid' borderColor='gray.200' borderRadius='lg'>
                      <Table.Root size='sm'>
                        <Table.Header>
                          <Table.Row bg='gray.50'>
                            <Table.ColumnHeader py={2} px={3} fontSize='xs'>
                              Học sinh
                            </Table.ColumnHeader>
                            <Table.ColumnHeader py={2} px={3} fontSize='xs'>
                              File
                            </Table.ColumnHeader>
                            <Table.ColumnHeader py={2} px={3} fontSize='xs'>
                              Thời gian
                            </Table.ColumnHeader>
                            <Table.ColumnHeader py={2} px={3} fontSize='xs'>
                              Điểm
                            </Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {submissions.map((sub, idx) => {
                            const studentId = sub.student_id || sub.studentId || ''
                            const isEditing = gradingStudentId === studentId

                            return (
                              <Table.Row key={sub.id || idx}>
                                <Table.Cell py={2} px={3}>
                                  <HStack gap={2}>
                                    <User size={14} color='#666' />
                                    <Text fontSize='sm' color='gray.700'>
                                      {sub.student_name || sub.studentName || studentId || 'N/A'}
                                    </Text>
                                  </HStack>
                                </Table.Cell>
                                <Table.Cell py={2} px={3}>
                                  {sub.file_url || sub.fileUrl ? (
                                    <Link
                                      href={sub.file_url || sub.fileUrl}
                                      target='_blank'
                                      color='blue.500'
                                      fontSize='sm'
                                    >
                                      <HStack gap={1}>
                                        <Download size={12} />
                                        <Text>{sub.file_name || sub.fileName || 'Tải file'}</Text>
                                      </HStack>
                                    </Link>
                                  ) : (
                                    <Text fontSize='sm' color='gray.400'>
                                      -
                                    </Text>
                                  )}
                                </Table.Cell>
                                <Table.Cell py={2} px={3}>
                                  <Text fontSize='xs' color='gray.600'>
                                    {sub.submitted_at || sub.submittedAt || sub.created_at || sub.createdAt
                                      ? new Date(
                                          sub.submitted_at || sub.submittedAt || sub.created_at || sub.createdAt!
                                        ).toLocaleString('vi-VN')
                                      : '-'}
                                  </Text>
                                </Table.Cell>
                                <Table.Cell py={2} px={3}>
                                  {isEditing ? (
                                    <HStack gap={1}>
                                      <Input
                                        size='xs'
                                        type='number'
                                        min={0}
                                        max={assignment.max_score}
                                        value={gradeInput}
                                        onChange={(e) => setGradeInput(e.target.value)}
                                        placeholder='Điểm'
                                        w='60px'
                                        borderColor='orange.300'
                                        _focus={{ borderColor: '#dd7323' }}
                                      />
                                      <Button
                                        size='xs'
                                        colorPalette='green'
                                        onClick={() => handleGrade(studentId)}
                                        loading={isGrading}
                                        p={1}
                                      >
                                        <Check size={14} />
                                      </Button>
                                      <Button
                                        size='xs'
                                        variant='ghost'
                                        onClick={() => {
                                          setGradingStudentId(null)
                                          setGradeInput('')
                                          setFeedbackInput('')
                                        }}
                                        p={1}
                                      >
                                        <X size={14} />
                                      </Button>
                                    </HStack>
                                  ) : (
                                    <HStack gap={2}>
                                      {sub.score !== null && sub.score !== undefined ? (
                                        <Badge colorPalette='green' variant='subtle'>
                                          {sub.score}/{assignment.max_score}
                                        </Badge>
                                      ) : (
                                        <Badge colorPalette='yellow' variant='subtle'>
                                          Chưa chấm
                                        </Badge>
                                      )}
                                      <Button
                                        size='xs'
                                        variant='ghost'
                                        colorPalette='orange'
                                        onClick={() => {
                                          setGradingStudentId(studentId)
                                          setGradeInput(sub.score?.toString() || '')
                                          setFeedbackInput(sub.feedback || '')
                                        }}
                                        p={1}
                                        title='Chấm điểm'
                                      >
                                        <Edit2 size={12} />
                                      </Button>
                                    </HStack>
                                  )}
                                </Table.Cell>
                              </Table.Row>
                            )
                          })}
                        </Table.Body>
                      </Table.Root>
                    </Box>
                  )}
                </Box>

                {/* Created/Updated */}
                <HStack gap={4} pt={2} borderTop='1px solid' borderColor='gray.100'>
                  <Text fontSize='xs' color='gray.400'>
                    Tạo lúc: {formatDate(assignment.created_at)}
                  </Text>
                  <Text fontSize='xs' color='gray.400'>
                    Cập nhật: {formatDate(assignment.updated_at)}
                  </Text>
                </HStack>
              </VStack>
            </Dialog.Body>

            <Dialog.CloseTrigger asChild>
              <CloseButton size='sm' pos='absolute' top={4} right={4} borderRadius='full' _hover={{ bg: 'gray.100' }} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
