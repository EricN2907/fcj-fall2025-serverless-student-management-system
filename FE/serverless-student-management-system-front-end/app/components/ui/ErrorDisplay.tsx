import { Box, VStack, Icon, Text, Button } from '@chakra-ui/react'
import React from 'react'

interface ErrorDisplayProps {
  title?: string
  message: string
  icon?: React.ReactNode
  onRetry?: () => void
  retryLabel?: string
  variant?: 'unauthenticated' | 'fetch' | 'network' | 'default'
}

const defaultIcons = {
  unauthenticated: (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='48'
      height='48'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <circle cx='12' cy='12' r='10' />
      <path d='M12 16v-4' />
      <path d='M12 8h.01' />
    </svg>
  ),
  fetch: (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='48'
      height='48'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <circle cx='12' cy='12' r='10' />
      <line x1='12' y1='8' x2='12' y2='12' />
      <line x1='12' y1='16' x2='12.01' y2='16' />
    </svg>
  ),
  network: (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='48'
      height='48'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <circle cx='12' cy='12' r='10' />
      <path d='M2 16.5V17a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-.5' />
      <path d='M6 8v4' />
      <path d='M18 8v4' />
    </svg>
  ),
  default: (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='48'
      height='48'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <circle cx='12' cy='12' r='10' />
      <line x1='12' y1='8' x2='12' y2='12' />
      <line x1='12' y1='16' x2='12.01' y2='16' />
    </svg>
  )
}

const defaultTitles = {
  unauthenticated: 'Bạn chưa đăng nhập',
  fetch: 'Đã xảy ra lỗi',
  network: 'Lỗi kết nối mạng',
  default: 'Đã xảy ra lỗi'
}

const defaultRetryLabels = {
  unauthenticated: 'Đăng nhập',
  fetch: 'Thử lại',
  network: 'Thử lại',
  default: 'Thử lại'
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
  icon,
  onRetry,
  retryLabel,
  variant = 'default'
}) => {
  return (
    <Box minH='60vh' display='flex' alignItems='center' justifyContent='center' bg='bg.subtle'>
      <VStack
        gap={8}
        p={{ base: 6, md: 10 }}
        bg='bg.default'
        borderRadius='2xl'
        shadow='xl'
        maxW='md'
        w='full'
        mx={4}
        borderWidth='1px'
        borderColor='border.subtle'
      >
        {/* Error Icon */}
        <Box p={4} borderRadius='full' bg='red.50' borderWidth='3px' borderColor='red.100'>
          <Icon asChild color='red.500' boxSize={12}>
            {icon || defaultIcons[variant]}
          </Icon>
        </Box>
        {/* Error Message */}
        <VStack gap={2}>
          <Text fontWeight='bold' fontSize='xl' color='fg.default'>
            {title || defaultTitles[variant]}
          </Text>
          <Text color='fg.muted' textAlign='center' fontSize='md' lineHeight='1.6' px={4}>
            {message}
          </Text>
        </VStack>
        {/* Retry Button */}
        {onRetry && (
          <Button
            colorPalette='orange'
            variant='solid'
            size='lg'
            backgroundColor='orange.400'
            color='white'
            borderRadius='xl'
            shadow='md'
            px={8}
            fontWeight='semibold'
            gap={2}
            _hover={{
              shadow: 'lg',
              transform: 'translateY(-2px)',
              transition: 'all 0.2s'
            }}
            onClick={onRetry}
          >
            <Icon asChild>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' />
                <path d='M3 3v5h5' />
                <path d='M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16' />
                <path d='M16 21h5v-5' />
              </svg>
            </Icon>
            {retryLabel || defaultRetryLabels[variant]}
          </Button>
        )}
      </VStack>
    </Box>
  )
}
