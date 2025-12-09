'use client'

import { useState, useRef } from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Textarea,
  Badge,
  Dialog,
  Portal,
  CloseButton,
  Input
} from '@chakra-ui/react'
import { Upload, File, X, Calendar, FileText, AlertCircle } from 'lucide-react'
import { toaster } from '../ui/toaster'
import { studentAssignmentApi } from '../../services/studentApi'

interface Assignment {
  id: number | string
  title: string
  type: 'homework' | 'project' | 'midterm' | 'final'
  deadline: string
  max_score: number
  description?: string
}

interface SubmissionModalProps {
  isOpen: boolean
  onClose: () => void
  assignment: Assignment | null
  classId: string
  onSubmitSuccess: () => void
  isResubmit?: boolean // true nếu đang nộp lại bài đã nộp trước đó
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

// Mock submission for UI testing
const USE_MOCK_DATA = false

export default function SubmissionModal({
  isOpen,
  onClose,
  assignment,
  classId,
  onSubmitSuccess,
  isResubmit = false
}: SubmissionModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!assignment) return null

  const isOverdue = new Date(assignment.deadline) < new Date()
  const deadlineDate = new Date(assignment.deadline)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toaster.create({
          title: 'File quá lớn',
          description: 'Kích thước file tối đa là 50MB',
          type: 'error'
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toaster.create({
          title: 'File quá lớn',
          description: 'Kích thước file tối đa là 50MB',
          type: 'error'
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    console.log('=== HANDLE SUBMIT CLICKED ===')
    console.log('selectedFile:', selectedFile)
    console.log('isOverdue:', isOverdue)
    console.log('isResubmit:', isResubmit)
    console.log('classId:', classId)
    console.log('assignment.id:', assignment.id)

    if (!selectedFile) {
      toaster.create({
        title: 'Chưa chọn file',
        description: 'Vui lòng chọn file để nộp bài',
        type: 'error'
      })
      return
    }

    setSubmitting(true)

    // Mock submission for UI testing
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toaster.create({
        title: 'Nộp bài thành công!',
        description: `Đã nộp bài "${assignment.title}"`,
        type: 'success'
      })
      setSelectedFile(null)
      setComment('')
      setSubmitting(false)
      onSubmitSuccess()
      onClose()
      return
    }

    try {
      // Gọi API nộp bài - POST nếu nộp mới, PUT nếu nộp lại
      await studentAssignmentApi.submitAssignment(
        {
          classId: classId,
          assignmentId: String(assignment.id),
          file: selectedFile,
          content: comment.trim() || undefined
        },
        isResubmit // true = PUT (update), false = POST (create)
      )

      toaster.create({
        title: 'Nộp bài thành công!',
        description: `Đã nộp bài "${assignment.title}"`,
        type: 'success'
      })

      setSelectedFile(null)
      setComment('')
      onSubmitSuccess()
      onClose()
    } catch (err: any) {
      const message = err.message || 'Nộp bài thất bại. Vui lòng thử lại.'
      toaster.create({
        title: 'Lỗi',
        description: message,
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setSelectedFile(null)
      setComment('')
      onClose()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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
                      <Upload size={20} color='white' />
                    </Box>
                    <Dialog.Title fontSize='xl' fontWeight='bold' color='gray.800'>
                      {isResubmit ? 'Nộp lại bài tập' : 'Nộp bài tập'}
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

                {/* File Upload Area */}
                <Box>
                  <Text fontSize='sm' fontWeight='semibold' color='gray.700' mb={2}>
                    File nộp bài{' '}
                    <Text as='span' color='red.500'>
                      *
                    </Text>
                  </Text>

                  {!selectedFile ? (
                    <Box
                      border='2px dashed'
                      borderColor={dragActive ? '#dd7323' : 'orange.200'}
                      borderRadius='xl'
                      p={8}
                      textAlign='center'
                      bg={dragActive ? 'orange.50' : 'gray.50'}
                      cursor='pointer'
                      transition='all 0.2s'
                      _hover={{ borderColor: '#dd7323', bg: 'orange.50' }}
                      onClick={() => fileInputRef.current?.click()}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <VStack gap={3}>
                        <Box p={3} bg='orange.100' borderRadius='full'>
                          <Upload size={28} color='#dd7323' />
                        </Box>
                        <VStack gap={1}>
                          <Text fontWeight='medium' color='gray.700'>
                            Kéo thả file vào đây hoặc{' '}
                            <Text as='span' color='#dd7323' fontWeight='semibold'>
                              chọn file
                            </Text>
                          </Text>
                          <Text fontSize='sm' color='gray.500'>
                            Hỗ trợ: PDF, DOC, DOCX, ZIP, RAR (tối đa 50MB)
                          </Text>
                        </VStack>
                      </VStack>
                      <Input
                        ref={fileInputRef}
                        type='file'
                        display='none'
                        accept='.pdf,.doc,.docx,.zip,.rar,.txt,.py,.java,.cpp,.c,.js,.ts,.html,.css'
                        onChange={handleFileChange}
                      />
                    </Box>
                  ) : (
                    <HStack
                      p={4}
                      bg='green.50'
                      borderRadius='xl'
                      border='1px solid'
                      borderColor='green.200'
                      justify='space-between'
                    >
                      <HStack gap={3}>
                        <Box p={2} bg='green.100' borderRadius='lg'>
                          <File size={20} color='#38a169' />
                        </Box>
                        <VStack align='flex-start' gap={0}>
                          <Text fontWeight='medium' color='gray.800' fontSize='sm'>
                            {selectedFile.name}
                          </Text>
                          <Text fontSize='xs' color='gray.500'>
                            {formatFileSize(selectedFile.size)}
                          </Text>
                        </VStack>
                      </HStack>
                      <Button
                        size='sm'
                        variant='ghost'
                        colorPalette='red'
                        onClick={handleRemoveFile}
                        borderRadius='full'
                      >
                        <X size={16} />
                      </Button>
                    </HStack>
                  )}
                </Box>

                {/* Comment */}
                <Box>
                  <Text fontSize='sm' fontWeight='semibold' color='gray.700' mb={2}>
                    Ghi chú (tùy chọn)
                  </Text>
                  <Textarea
                    placeholder='Nhập ghi chú cho bài nộp...'
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    borderColor='orange.200'
                    borderRadius='xl'
                    _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                    _hover={{ borderColor: '#dd7323' }}
                    rows={3}
                    resize='none'
                  />
                </Box>

                {/* Warning */}
                <HStack p={3} bg='yellow.50' borderRadius='lg' border='1px solid' borderColor='yellow.200'>
                  <AlertCircle size={16} color='#d69e2e' />
                  <Text fontSize='xs' color='yellow.800'>
                    {isResubmit ? (
                      <>
                        Lưu ý: Bài nộp mới sẽ{' '}
                        <Text as='span' fontWeight='bold'>
                          ghi đè bài cũ
                        </Text>
                        . Hãy kiểm tra kỹ trước khi nộp.
                      </>
                    ) : (
                      <>Lưu ý: Bạn có thể nộp lại bài nếu cần. Bài nộp mới sẽ ghi đè bài cũ.</>
                    )}
                  </Text>
                </HStack>
              </VStack>
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
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                bg={isResubmit ? 'blue.500' : '#dd7323'}
                color='white'
                borderRadius='xl'
                flex={1}
                size='lg'
                fontWeight='semibold'
                _hover={{ bg: isResubmit ? 'blue.600' : '#c5651f' }}
                onClick={() => {
                  console.log('Button clicked!')
                  handleSubmit()
                }}
                loading={submitting}
                loadingText='Đang nộp...'
                disabled={!selectedFile || isOverdue || submitting}
              >
                <Upload size={18} />
                {isResubmit ? 'Nộp lại' : 'Nộp bài'}
              </Button>
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild>
              <CloseButton
                size='sm'
                pos='absolute'
                top={4}
                right={4}
                borderRadius='full'
                _hover={{ bg: 'gray.100' }}
                disabled={submitting}
              />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
