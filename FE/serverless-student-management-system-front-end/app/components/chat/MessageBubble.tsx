'use client'

import { Text, Box, HStack, Avatar } from '@chakra-ui/react'
import type { ChatMessage } from '../../services/chatApi'

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <HStack
      w="full"
      justify={isOwn ? 'flex-end' : 'flex-start'}
      align="flex-end"
      gap={2}
    >
      {!isOwn && (
        <Avatar.Root size="xs">
          <Avatar.Fallback name={message.sender_name}>
            {message.sender_name?.substring(0, 2).toUpperCase()}
          </Avatar.Fallback>
          {message.sender_avatar && (
            <Avatar.Image src={message.sender_avatar} alt={message.sender_name} />
          )}
        </Avatar.Root>
      )}
      <Box maxW="75%">
        {!isOwn && (
          <Text fontSize="xs" color="gray.500" mb={1} ml={1}>
            {message.sender_name}
          </Text>
        )}
        <Box
          bg={isOwn ? 'blue.500' : 'white'}
          color={isOwn ? 'white' : 'gray.800'}
          px={3}
          py={2}
          borderRadius="lg"
          borderBottomRightRadius={isOwn ? 'sm' : 'lg'}
          borderBottomLeftRadius={isOwn ? 'lg' : 'sm'}
          boxShadow="sm"
          border={isOwn ? 'none' : '1px solid'}
          borderColor="gray.200"
        >
          <Text fontSize="sm" whiteSpace="pre-wrap" wordBreak="break-word">
            {message.content}
          </Text>
        </Box>
        <Text
          fontSize="xs"
          color="gray.400"
          mt={1}
          textAlign={isOwn ? 'right' : 'left'}
          mr={isOwn ? 1 : 0}
          ml={isOwn ? 0 : 1}
        >
          {formatTime(message.created_at)}
        </Text>
      </Box>
    </HStack>
  )
}
