'use client'

import { useState, useEffect } from 'react'
import { Box, Text, VStack, HStack, Button, Badge, Dialog, Portal, CloseButton, Spinner, Link } from '@chakra-ui/react'
import { Calendar, FileText, Upload, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { studentAssignmentApi } from '../../services/studentApi'

interface Assignment {
  id: number | string
  title: string
  type: 'homework' | 'project' | 'midterm' | 'final'
  deadline: string
  max_score: number
  description?: string
}

// Submission interface matching BE response (snake_case) + camelCase variants
interface Submission {
  id?: number | string
  // snake_case from BE
  file_url?: string
  file_name?: string
  submitted_at?: string
  graded_at?: string | null
  // camelCase variants
  fileUrl?: string
  fileName?: string
  submittedAt?: string
  gradedAt?: string | null
  // common fields
  score?: number | null
  feedback?: string | null
  status?: string
  createdAt?: string
  created_at?: string
}

interface AssignmentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  assignment: Assignment | null
  classId: string // kept for future use
  onSubmitClick: (isResubmit: boolean) => void // truyền true nếu đang nộp lại
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

export default function AssignmentDetailModal({
  isOpen,
  onClose,
  assignment,
  classId,
  onSubmitClick
}: AssignmentDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [submission, setSubmission] = useState<Submission | null>(null)

  // Fetch submission khi modal mở
  useEffect(() => {
    if (isOpen && assignment) {
      fetchSubmission()
    } else {
      setSubmission(null)
    }
  }, [isOpen, assignment])

  const fetchSubmission = async () => {
    if (!assignment) return

    setLoading(true)
    try {
      const data = await studentAssignmentApi.getMySubmission(String(assignment.id))
      // Cast to Submission type (handles both snake_case and camelCase)
      setSubmission(data as unknown as Submission | null)
    } catch (err: any) {
      console.error('Failed to fetch submission:', err)
      // Không show error nếu chưa có submission
      setSubmission(null)
    } finally {
      setLoading(false)
    }
  }

  if (!assignment) return null

  const isOverdue = new Date(assignment.deadline) < new Date()
  const deadlineDate = new Date(assignment.deadline)
  const hasSubmission = !!submission
  const isGraded = submission?.score !== null && submission?.score !== undefined

  const handleClose = () => {
    setSubmission(null)
    onClose()
  }

  const handleSubmitClick = (resubmit: boolean) => {
    handleClose()
    onSubmitClick(resubmit)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()} placement='center'>
      <Portal>
        <Dialog.Backdrop bg='blackAlpha.600' backdropFilter='blur(4px)' />
        <Dialog.Positioner>
          <Dialog.Content borderRadius='2xl' shadow='2xl' maxW='lg' mx={4} overflow='hidden' bg='white'>
            {/* Header */}
            <Dialog.Header pt={6} pb={4} px={6} borderBottom='1px solid' borderColor='gray.100'>
              <VStack align='flex-start' gap={2} w='full' pr={8}>
                <HStack justify='space-between' w='full'>
                  <HStack gap={2}>
                    <Box p={2} bg='#dd7323' borderRadius='lg'>
                      <FileText size={20} color='white' />
                    </Box>
                    <Dialog.Title fontSize='xl' fontWeight='bold' color='gray.800'>
                      Chi tiết bài tập
                    </Dialog.Title>
                  </HStack>
                  <Badge colorPalette={TYPE_COLORS[assignment.type]} variant='solid' borderRadius='full'>
                    {TYPE_LABELS[assignment.type]}
                  </Badge>
                </HStack>
                <Text fontSize='md' color='gray.700' fontWeight='medium'>
                  {assignment.title}
                </Text>
              </VStack>
            </Dialog.Header>

            <Dialog.Body py={5} px={6}>
              {loading ? (
                <VStack py={8}>
                  <Spinner size='lg' color='#dd7323' />
                  <Text color='gray.500'>Đang tải thông tin...</Text>
                </VStack>
              ) : (
                <VStack gap={5} align='stretch'>
                  {/* Deadline Info */}
                  <HStack
                    p={3}
                    bg={isOverdue ? 'red.50' : 'orange.50'}
                    borderRadius='lg'
                    border='1px solid'
                    borderColor={isOverdue ? 'red.200' : 'orange.200'}
                  >
                    {isOverdue ? <AlertCircle size={18} color='#e53e3e' /> : <Calendar size={18} color='#dd7323' />}
                    <Text fontSize='sm' color={isOverdue ? 'red.700' : 'gray.700'}>
                      <Text as='span' fontWeight='semibold'>
                        Deadline:
                      </Text>{' '}
                      {deadlineDate.toLocaleDateString('vi-VN')} •{' '}
                      {deadlineDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      {isOverdue && (
                        <Text as='span' color='red.600' fontWeight='semibold'>
                          {' '}
                          (Đã quá hạn)
                        </Text>
                      )}
                    </Text>
                  </HStack>

                  {/* Description */}
                  {assignment.description && (
                    <Box>
                      <Text fontSize='sm' fontWeight='semibold' color='gray.700' mb={2}>
                        Mô tả
                      </Text>
                      <Box p={3} bg='gray.50' borderRadius='lg'>
                        <Text fontSize='sm' color='gray.600' whiteSpace='pre-wrap'>
                          {assignment.description}
                        </Text>
                      </Box>
                    </Box>
                  )}

                  {/* Max Score */}
                  <HStack>
                    <Text fontSize='sm' color='gray.600'>
                      Điểm tối đa:
                    </Text>
                    <Text fontSize='sm' fontWeight='semibold' color='#dd7323'>
                      {assignment.max_score}
                    </Text>
                  </HStack>

                  {/* Submission Status */}
                  <Box
                    p={4}
                    bg={hasSubmission ? 'green.50' : 'yellow.50'}
                    borderRadius='xl'
                    border='1px solid'
                    borderColor={hasSubmission ? 'green.200' : 'yellow.200'}
                  >
                    <VStack align='stretch' gap={3}>
                      <HStack>
                        {hasSubmission ? (
                          <CheckCircle size={20} color='#38a169' />
                        ) : (
                          <Clock size={20} color='#d69e2e' />
                        )}
                        <Text fontWeight='semibold' color={hasSubmission ? 'green.700' : 'yellow.700'}>
                          {hasSubmission ? 'Đã nộp bài' : 'Chưa nộp bài'}
                        </Text>
                      </HStack>

                      {hasSubmission && (
                        <>
                          {/* File đã nộp - handle both snake_case and camelCase */}
                          {(submission?.file_name || submission?.fileName) && (
                            <HStack justify='space-between' p={2} bg='white' borderRadius='lg'>
                              <HStack gap={2}>
                                <FileText size={16} color='#38a169' />
                                <Text fontSize='sm' color='gray.700'>
                                  {submission.file_name || submission.fileName}
                                </Text>
                              </HStack>
                              {(submission?.file_url || submission?.fileUrl) && (
                                <Link href={submission.file_url || submission.fileUrl} target='_blank'>
                                  <Button size='xs' variant='ghost' colorPalette='green'>
                                    <Download size={14} />
                                    <Text ml={1}>Tải</Text>
                                  </Button>
                                </Link>
                              )}
                            </HStack>
                          )}

                          {/* Thời gian nộp - handle both formats */}
                          {(submission?.submitted_at ||
                            submission?.submittedAt ||
                            submission?.created_at ||
                            submission?.createdAt) && (
                            <Text fontSize='xs' color='gray.500'>
                              Nộp lúc:{' '}
                              {new Date(
                                submission.submitted_at ||
                                  submission.submittedAt ||
                                  submission.created_at ||
                                  submission.createdAt!
                              ).toLocaleString('vi-VN')}
                            </Text>
                          )}

                          {/* Điểm */}
                          {isGraded && (
                            <HStack p={3} bg='white' borderRadius='lg' justify='space-between'>
                              <Text fontWeight='semibold' color='gray.700'>
                                Điểm số:
                              </Text>
                              <Text fontSize='xl' fontWeight='bold' color='#dd7323'>
                                {submission?.score} / {assignment.max_score}
                              </Text>
                            </HStack>
                          )}

                          {/* Feedback */}
                          {submission?.feedback && (
                            <Box p={3} bg='white' borderRadius='lg'>
                              <Text fontSize='sm' fontWeight='semibold' color='gray.700' mb={1}>
                                Nhận xét của giảng viên:
                              </Text>
                              <Text fontSize='sm' color='gray.600'>
                                {submission.feedback}
                              </Text>
                            </Box>
                          )}
                        </>
                      )}
                    </VStack>
                  </Box>
                </VStack>
              )}
            </Dialog.Body>

            <Dialog.Footer gap={3} px={6} pb={6} pt={2} borderTop='1px solid' borderColor='gray.100'>
              <Button
                variant='outline'
                borderRadius='xl'
                flex={1}
                size='lg'
                fontWeight='semibold'
                borderColor='gray.300'
                _hover={{ bg: 'gray.50' }}
                onClick={handleClose}
              >
                Đóng
              </Button>
              {/* Nút Nộp bài - hiển thị khi chưa nộp và chưa quá hạn */}
              {!hasSubmission && !isOverdue && (
                <Button
                  bg='#dd7323'
                  color='white'
                  borderRadius='xl'
                  flex={1}
                  size='lg'
                  fontWeight='semibold'
                  _hover={{ bg: '#c5651f' }}
                  onClick={() => handleSubmitClick(false)}
                >
                  <Upload size={18} />
                  <Text ml={2}>Nộp bài</Text>
                </Button>
              )}
              {/* Nút Nộp lại - hiển thị khi đã nộp và chưa quá hạn */}
              {hasSubmission && !isOverdue && (
                <Button
                  bg='blue.500'
                  color='white'
                  borderRadius='xl'
                  flex={1}
                  size='lg'
                  fontWeight='semibold'
                  _hover={{ bg: 'blue.600' }}
                  onClick={() => handleSubmitClick(true)}
                >
                  <Upload size={18} />
                  <Text ml={2}>Nộp lại</Text>
                </Button>
              )}
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild>
              <CloseButton size='sm' pos='absolute' top={4} right={4} borderRadius='full' _hover={{ bg: 'gray.100' }} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
