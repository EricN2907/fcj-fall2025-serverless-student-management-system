'use client'

import {
  Dialog,
  Portal,
  Button,
  Text,
  Box,
  HStack,
  VStack,
  Badge,
  IconButton
} from '@chakra-ui/react'
import {
  X,
  Clock,
  BookOpen,
  FileText,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import { useNavigate } from 'react-router'
import type { CalendarAssignment } from '../../types'

interface AssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  assignment: CalendarAssignment | null
}

// Assignment type colors
const TYPE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  homework: { bg: 'green.100', color: 'green.700', label: 'Bài tập' },
  project: { bg: 'purple.100', color: 'purple.700', label: 'Đồ án' },
  midterm: { bg: 'orange.100', color: 'orange.700', label: 'Giữa kỳ' },
  final: { bg: 'red.100', color: 'red.700', label: 'Cuối kỳ' }
}

// Weight display
const TYPE_WEIGHTS: Record<string, string> = {
  homework: '20%',
  project: '30%',
  midterm: '25%',
  final: '25%'
}

export default function AssignmentModal({ isOpen, onClose, assignment }: AssignmentModalProps) {
  const navigate = useNavigate()

  if (!assignment) return null

  const typeConfig = TYPE_COLORS[assignment.type] || TYPE_COLORS.homework
  const weight = TYPE_WEIGHTS[assignment.type] || '0%'

  // Format deadline
  const formatDeadline = (dateStr: string) => {
    const date = new Date(dateStr)
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
    const dayName = days[date.getDay()]
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${dayName}, ${day}/${month}/${year} ${hours}:${minutes}`
  }

  // Get status
  const getStatus = () => {
    if (assignment.is_submitted) {
      return { label: 'Đã nộp', color: 'green.500', icon: CheckCircle }
    }
    const now = new Date()
    const deadline = new Date(assignment.deadline)
    if (now > deadline) {
      return { label: 'Quá hạn', color: 'red.500', icon: AlertCircle }
    }
    return { label: 'Chưa nộp', color: 'orange.500', icon: Clock }
  }

  const status = getStatus()
  const StatusIcon = status.icon

  const handleViewDetail = () => {
    onClose()
    navigate(`/student/my-courses/${assignment.class_id}/assignments/${assignment.id}`)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" />
        <Dialog.Positioner>
          <Dialog.Content
            bg="white"
            borderRadius="xl"
            maxW="480px"
            w="90vw"
            overflow="hidden"
            boxShadow="xl"
          >
            {/* Header */}
            <Dialog.Header
              bg={typeConfig.bg}
              px={6}
              py={4}
              borderBottom="1px solid"
              borderColor="gray.100"
            >
              <HStack justify="space-between" w="full">
                <HStack gap={3}>
                  <Box
                    bg="white"
                    p={2}
                    borderRadius="lg"
                    boxShadow="sm"
                  >
                    <FileText size={20} color={typeConfig.color.replace('.700', '')} />
                  </Box>
                  <Box>
                    <Dialog.Title
                      fontSize="lg"
                      fontWeight="bold"
                      color="gray.800"
                      lineHeight="1.3"
                    >
                      {assignment.title}
                    </Dialog.Title>
                    <Badge
                      bg={typeConfig.bg}
                      color={typeConfig.color}
                      fontSize="xs"
                      fontWeight="600"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      mt={1}
                    >
                      {typeConfig.label} • {weight}
                    </Badge>
                  </Box>
                </HStack>
                <Dialog.CloseTrigger asChild>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label="Đóng"
                    color="gray.500"
                    _hover={{ bg: 'white' }}
                  >
                    <X size={18} />
                  </IconButton>
                </Dialog.CloseTrigger>
              </HStack>
            </Dialog.Header>

            {/* Body */}
            <Dialog.Body px={6} py={5}>
              <VStack gap={4} align="stretch">
                {/* Class & Subject */}
                <Box>
                  <HStack gap={2} color="gray.500" mb={1}>
                    <BookOpen size={16} />
                    <Text fontSize="sm" fontWeight="500">
                      Lớp học
                    </Text>
                  </HStack>
                  <Text fontSize="md" fontWeight="600" color="gray.800">
                    {assignment.class_name}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {assignment.subject_name}
                  </Text>
                </Box>

                {/* Deadline */}
                <Box>
                  <HStack gap={2} color="gray.500" mb={1}>
                    <Clock size={16} />
                    <Text fontSize="sm" fontWeight="500">
                      Hạn nộp
                    </Text>
                  </HStack>
                  <Text fontSize="md" fontWeight="600" color="gray.800">
                    {formatDeadline(assignment.deadline)}
                  </Text>
                </Box>

                {/* Status */}
                <Box>
                  <Text fontSize="sm" fontWeight="500" color="gray.500" mb={2}>
                    Trạng thái
                  </Text>
                  <HStack
                    bg={status.color.replace('.500', '.50')}
                    px={3}
                    py={2}
                    borderRadius="lg"
                    gap={2}
                  >
                    <StatusIcon size={18} color={status.color.replace('.500', '')} />
                    <Text fontSize="sm" fontWeight="600" color={status.color}>
                      {status.label}
                    </Text>
                  </HStack>
                </Box>

                {/* Description */}
                {assignment.description && (
                  <Box>
                    <Text fontSize="sm" fontWeight="500" color="gray.500" mb={1}>
                      Mô tả
                    </Text>
                    <Text fontSize="sm" color="gray.700" lineHeight="1.6">
                      {assignment.description}
                    </Text>
                  </Box>
                )}
              </VStack>
            </Dialog.Body>

            {/* Footer */}
            <Dialog.Footer px={6} py={4} borderTop="1px solid" borderColor="gray.100">
              <HStack gap={3} w="full" justify="flex-end">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  color="gray.600"
                  _hover={{ bg: 'gray.100' }}
                >
                  Đóng
                </Button>
                <Button
                  bg="orange.500"
                  color="white"
                  _hover={{ bg: 'orange.600' }}
                  onClick={handleViewDetail}
                >
                  <ExternalLink size={16} />
                  Xem chi tiết
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
