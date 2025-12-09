'use client'

import { Box, Card, HStack, VStack, Text, Circle } from '@chakra-ui/react'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  onClick?: () => void
  isLoading?: boolean
}

export default function StatsCard({ label, value, icon: IconComponent, onClick, isLoading }: StatsCardProps) {
  return (
    <Card.Root
      bg='white'
      border='1px solid'
      borderColor='orange.200'
      borderRadius='xl'
      shadow='sm'
      _hover={{
        transform: 'translateY(-4px)',
        shadow: 'lg',
        borderColor: '#dd7323'
      }}
      transition='all 0.2s'
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
    >
      <Card.Body py={5} px={5}>
        <HStack justify='space-between'>
          <VStack align='flex-start' gap={1}>
            <Text fontSize='sm' color='gray.600'>
              {label}
            </Text>
            <Text fontSize='3xl' color='#dd7323' fontWeight='bold'>
              {isLoading ? '-' : value}
            </Text>
          </VStack>
          <Circle size='12' bg='orange.50'>
            <IconComponent size={24} color='#dd7323' />
          </Circle>
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}
