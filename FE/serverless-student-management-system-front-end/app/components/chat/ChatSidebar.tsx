'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Drawer,
  Portal,
  Text,
  Box,
  IconButton,
  HStack,
  VStack,
  Skeleton
} from '@chakra-ui/react'
import { X, MessageCircle, BookOpen, ArrowLeft } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import {
  fetchMyClasses,
  fetchMessages,
  sendMessage,
  type ChatClass
} from '../../services/chatApi'
import ClassListItem from './ClassListItem'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

// ============================================
// TYPES
// ============================================
interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
}

// ============================================
// SKELETON COMPONENTS
// ============================================
function ClassListSkeleton() {
  return (
    <VStack gap={3} w="full">
      {[1, 2, 3, 4].map((i) => (
        <Box
          key={i}
          w="full"
          p={3}
          bg="white"
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.200"
        >
          <HStack gap={3}>
            <Skeleton width="40px" height="40px" borderRadius="lg" />
            <VStack align="start" flex={1} gap={2}>
              <Skeleton height="14px" width="70%" />
              <Skeleton height="12px" width="50%" />
            </VStack>
          </HStack>
        </Box>
      ))}
    </VStack>
  )
}

function MessagesSkeleton() {
  return (
    <VStack gap={3} w="full" p={4}>
      {[1, 2, 3, 4, 5].map((i) => (
        <HStack key={i} w="full" justify={i % 2 === 0 ? 'flex-end' : 'flex-start'}>
          <Skeleton height="40px" width="60%" borderRadius="lg" />
        </HStack>
      ))}
    </VStack>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [selectedClass, setSelectedClass] = useState<ChatClass | null>(null)
  const [newMessage, setNewMessage] = useState('')

  // Fetch classes
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['chat-classes'],
    queryFn: fetchMyClasses,
    enabled: isOpen
  })

  // Fetch messages for selected class
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', selectedClass?.id],
    queryFn: () => fetchMessages(selectedClass!.id),
    enabled: !!selectedClass
  })

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      setNewMessage('')
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedClass?.id] })
      queryClient.invalidateQueries({ queryKey: ['chat-classes'] })
    }
  })

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Reset selected class when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedClass(null)
      setNewMessage('')
    }
  }, [isOpen])

  const handleSend = () => {
    if (!newMessage.trim() || !selectedClass) return
    sendMutation.mutate({
      class_id: selectedClass.id,
      content: newMessage.trim()
    })
  }

  const handleBack = () => {
    setSelectedClass(null)
    setNewMessage('')
  }

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      placement="end"
      size="sm"
    >
      <Portal>
        <Drawer.Backdrop bg="blackAlpha.600" />
        <Drawer.Positioner>
          <Drawer.Content bg="gray.50">
            {/* Header */}
            <Drawer.Header borderBottomWidth="1px" bg="white" px={4} py={3}>
              <HStack gap={3} flex={1}>
                {selectedClass ? (
                  <>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      aria-label="Quay lại"
                      color="gray.600"
                      _hover={{ bg: 'gray.100' }}
                    >
                      <ArrowLeft size={20} />
                    </IconButton>
                    <Box flex={1}>
                      <Text fontWeight="bold" color="gray.800" fontSize="md" lineClamp={1}>
                        {selectedClass.class_name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {selectedClass.subject_name}
                      </Text>
                    </Box>
                  </>
                ) : (
                  <>
                    <Box bg="orange.500" p={2} borderRadius="lg" color="white">
                      <MessageCircle size={20} />
                    </Box>
                    <Drawer.Title color="gray.800" fontWeight="bold" fontSize="lg">
                      Tin nhắn
                    </Drawer.Title>
                  </>
                )}
              </HStack>
              <Drawer.CloseTrigger asChild position="absolute" top="3" right="3">
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label="Đóng"
                  color="gray.500"
                  _hover={{ bg: 'gray.100' }}
                >
                  <X size={18} />
                </IconButton>
              </Drawer.CloseTrigger>
            </Drawer.Header>

            {/* Body */}
            <Drawer.Body p={0} overflowY="auto" flex={1}>
              {!selectedClass ? (
                // Class List View
                <Box p={4}>
                  {classesLoading ? (
                    <ClassListSkeleton />
                  ) : classes.length === 0 ? (
                    <VStack py={12} gap={3} color="gray.400">
                      <BookOpen size={48} />
                      <Text fontSize="sm" textAlign="center">
                        Bạn chưa tham gia lớp học nào
                      </Text>
                    </VStack>
                  ) : (
                    <VStack gap={3}>
                      {classes.map((chatClass) => (
                        <ClassListItem
                          key={chatClass.id}
                          chatClass={chatClass}
                          onClick={() => setSelectedClass(chatClass)}
                        />
                      ))}
                    </VStack>
                  )}
                </Box>
              ) : (
                // Chat View
                <Box h="full" overflowY="auto" p={4} bg="gray.100">
                  {messagesLoading ? (
                    <MessagesSkeleton />
                  ) : messages.length === 0 ? (
                    <VStack py={12} gap={3} color="gray.400">
                      <MessageCircle size={48} />
                      <Text fontSize="sm" textAlign="center">
                        Chưa có tin nhắn nào.
                        <br />
                        Hãy bắt đầu cuộc trò chuyện!
                      </Text>
                    </VStack>
                  ) : (
                    <VStack gap={3} align="stretch">
                      {messages.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          message={msg}
                          isOwn={msg.sender_id === user?.id}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </VStack>
                  )}
                </Box>
              )}
            </Drawer.Body>

            {/* Footer - Only show when in chat view */}
            {selectedClass && (
              <Drawer.Footer borderTopWidth="1px" p={3} bg="white">
                <ChatInput
                  value={newMessage}
                  onChange={setNewMessage}
                  onSend={handleSend}
                  isLoading={sendMutation.isPending}
                />
              </Drawer.Footer>
            )}
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}
