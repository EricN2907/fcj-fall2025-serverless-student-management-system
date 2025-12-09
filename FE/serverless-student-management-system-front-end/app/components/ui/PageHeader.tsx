'use client'

import { Box, HStack, VStack, Heading, Text, Icon } from '@chakra-ui/react'
import type { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle: string
  children?: React.ReactNode
}

export default function PageHeader({ icon: IconComponent, title, subtitle, children }: PageHeaderProps) {
  return (
    <HStack mb={10} justifyContent='space-between' flexWrap='wrap' gap={4} p={6}>
      <VStack alignItems='flex-start' gap={2}>
        <HStack gap={3}>
          <Box
            p={2}
            bg='#dd7323'
            borderRadius='xl'
            shadow='lg'
            _hover={{ transform: 'rotate(5deg)', transition: 'all 0.3s' }}
          >
            <Icon asChild color='white'>
              <IconComponent size={32} />
            </Icon>
          </Box>
          <Heading
            size='4xl'
            fontWeight='bold'
            bgGradient='to-r'
            gradientFrom='gray.800'
            gradientTo='gray.600'
            bgClip='text'
          >
            {title}
          </Heading>
        </HStack>
        <Text color='gray.600' fontSize='md' fontWeight='medium'>
          {subtitle}
        </Text>
      </VStack>
      {children}
    </HStack>
  )
}
