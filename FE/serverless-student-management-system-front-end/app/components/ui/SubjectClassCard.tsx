'use client'

import { useMemo } from 'react'
import { Box, Text, Icon } from '@chakra-ui/react'
import { Key } from 'lucide-react'

// Background colors for cards
const CARD_BACKGROUNDS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
]

// Pattern SVG backgrounds
const PATTERNS = [
  `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3Ccircle cx='30' cy='30' r='10'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.15' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
  `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.15' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`
]

export interface ClassInfo {
  id: number
  name: string
  subject_id: number
  subject_name: string
  teacher_id: number
  teacher_name: string
  semester: string
  academic_year: string
  student_count: number
  status: number
}

interface SubjectClassCardProps {
  classInfo: ClassInfo
  index: number
  onClick: () => void
}

export default function SubjectClassCard({ classInfo, index, onClick }: SubjectClassCardProps) {
  const background = useMemo(() => CARD_BACKGROUNDS[index % CARD_BACKGROUNDS.length], [index])
  const pattern = useMemo(() => PATTERNS[index % PATTERNS.length], [index])

  return (
    <Box
      as='button'
      onClick={onClick}
      w='full'
      maxW='320px'
      borderRadius='xl'
      overflow='hidden'
      shadow='md'
      transition='all 0.2s'
      _hover={{ shadow: 'xl', transform: 'translateY(-4px)' }}
      textAlign='left'
      cursor='pointer'
    >
      {/* Card Image Area */}
      <Box
        h='140px'
        position='relative'
        bgGradient={background}
        backgroundImage={pattern}
        backgroundSize='cover'
      >
        {/* Subject Badge */}
        <Box
          position='absolute'
          top={3}
          left={3}
          bg='#dd7323'
          color='white'
          px={3}
          py={1}
          borderRadius='md'
          fontSize='xs'
          fontWeight='semibold'
          maxW='200px'
          truncate
        >
          {classInfo.subject_name}
        </Box>

        {/* Key Icon */}
        <Box
          position='absolute'
          bottom={3}
          right={3}
          bg='white'
          p={2}
          borderRadius='full'
          shadow='md'
        >
          <Icon asChild color='#dd7323'>
            <Key size={18} />
          </Icon>
        </Box>
      </Box>

      {/* Card Footer */}
      <Box bg='white' p={3} borderTop='1px solid' borderColor='gray.100'>
        <Text fontSize='sm' color='#dd7323' fontWeight='medium' truncate>
          {classInfo.name} - {classInfo.teacher_name}
        </Text>
      </Box>
    </Box>
  )
}
