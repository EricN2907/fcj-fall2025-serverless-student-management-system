'use client'

import { Input, IconButton, HStack } from '@chakra-ui/react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  isLoading: boolean
}

export default function ChatInput({ value, onChange, onSend, isLoading }: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <HStack gap={2} w="full">
      <Input
        placeholder="Nhập tin nhắn..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyPress}
        size="md"
        flex="1"
        bg="gray.50"
        borderColor="gray.300"
        _focus={{
          borderColor: 'orange.500',
          boxShadow: '0 0 0 1px #dd7323'
        }}
        _placeholder={{ color: 'gray.400' }}
      />
      <IconButton
        onClick={onSend}
        disabled={isLoading || !value.trim()}
        loading={isLoading}
        bg="orange.500"
        color="white"
        _hover={{ bg: 'orange.600' }}
        _disabled={{ bg: 'gray.300', cursor: 'not-allowed' }}
        size="md"
        aria-label="Gửi tin nhắn"
      >
        <Send size={18} />
      </IconButton>
    </HStack>
  )
}
