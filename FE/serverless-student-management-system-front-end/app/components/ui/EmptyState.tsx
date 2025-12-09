'use client'

import { Box, VStack, Text, Circle, Icon, Button } from '@chakra-ui/react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ icon: IconComponent, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Box
      bg='white'
      borderRadius='2xl'
      border='2px dashed'
      borderColor='orange.200'
      p={12}
      textAlign='center'
    >
      <Circle size='16' bg='orange.50' mx='auto' mb={4}>
        <Icon asChild color='#dd7323'>
          <IconComponent size={32} />
        </Icon>
      </Circle>
      <Text color='gray.700' fontWeight='semibold' fontSize='lg' mb={1}>
        {title}
      </Text>
      {description && (
        <Text color='gray.500' fontSize='sm' mb={4}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          bg='#dd7323'
          color='white'
          size='md'
          borderRadius='xl'
          _hover={{ bg: '#c5651f' }}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}
