'use client'

import { Text, Box, HStack, Badge } from '@chakra-ui/react'
import { BookOpen } from 'lucide-react'
import type { ChatClass } from '../../services/chatApi'

interface ClassListItemProps {
  chatClass: ChatClass
  onClick: () => void
}

export default function ClassListItem({ chatClass, onClick }: ClassListItemProps) {
  return (
    <Box
      as="button"
      w="full"
      p={3}
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.200"
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        bg: 'orange.50',
        borderColor: 'orange.300',
        transform: 'translateX(4px)'
      }}
      onClick={onClick}
      textAlign="left"
    >
      <HStack gap={3}>
        <Box bg="orange.100" p={2} borderRadius="lg" color="orange.600">
          <BookOpen size={20} />
        </Box>
        <Box flex={1} minW={0}>
          <HStack justify="space-between" align="start">
            <Text fontWeight="600" color="gray.800" fontSize="sm" lineClamp={1}>
              {chatClass.class_name}
            </Text>
            {chatClass.unread_count > 0 && (
              <Badge
                bg="orange.500"
                color="white"
                borderRadius="full"
                minW="20px"
                textAlign="center"
                fontSize="xs"
              >
                {chatClass.unread_count > 99 ? '99+' : chatClass.unread_count}
              </Badge>
            )}
          </HStack>
          <Text fontSize="xs" color="gray.500" lineClamp={1}>
            {chatClass.subject_name}
          </Text>
          {chatClass.last_message && (
            <Text fontSize="xs" color="gray.400" lineClamp={1} mt={1}>
              <Text as="span" fontWeight="500">
                {chatClass.last_message.sender_name}:
              </Text>{' '}
              {chatClass.last_message.content}
            </Text>
          )}
        </Box>
      </HStack>
    </Box>
  )
}
