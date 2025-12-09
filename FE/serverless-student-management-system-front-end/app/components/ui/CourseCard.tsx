'use client'

import { useState, useMemo } from 'react'
import {
  Button,
  Text,
  HStack,
  VStack,
  Badge,
  Dialog,
  Portal,
  CloseButton,
  IconButton,
  Box,
  Icon
} from '@chakra-ui/react'
import { BookOpen, Users, LogOut, Eye, Calendar, Key } from 'lucide-react'

// Background gradients matching SubjectClassCard
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

// Get consistent background based on classId hash
function getBackgroundIndex(classId: string): number {
  let hash = 0
  for (let i = 0; i < classId.length; i++) {
    hash = classId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % CARD_BACKGROUNDS.length
}

export interface EnrolledClass {
  classId: string
  subjectId: string
  subjectName: string
  lecturerName: string
  totalStudents: number
  enrolledAt?: string
}

interface CourseCardProps {
  course: EnrolledClass
  onViewDetails: (classId: string) => void
  onUnenroll: (classId: string) => Promise<void>
}

export default function CourseCard({ course, onViewDetails, onUnenroll }: CourseCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUnenrolling, setIsUnenrolling] = useState(false)

  const backgroundIndex = useMemo(() => getBackgroundIndex(course.classId), [course.classId])
  const background = CARD_BACKGROUNDS[backgroundIndex]

  const handleUnenroll = async () => {
    setIsUnenrolling(true)
    try {
      await onUnenroll(course.classId)
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to unenroll:', error)
    } finally {
      setIsUnenrolling(false)
    }
  }

  return (
    <>
      <Box
        w='full'
        maxW='320px'
        borderRadius='xl'
        overflow='hidden'
        shadow='md'
        transition='all 0.2s'
        _hover={{ shadow: 'xl', transform: 'translateY(-4px)' }}
        bg='white'
      >
        {/* Card Image Area with gradient */}
        <Box h='140px' position='relative' bgGradient={background}>
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
            {course.subjectName}
          </Box>

          {/* Enrolled Badge */}
          <Badge
            position='absolute'
            top={3}
            right={3}
            colorPalette='green'
            variant='solid'
            size='sm'
            borderRadius='full'
          >
            Enrolled
          </Badge>

          {/* Key Icon */}
          <Box position='absolute' bottom={3} right={3} bg='white' p={2} borderRadius='full' shadow='md'>
            <Icon asChild color='#dd7323'>
              <Key size={18} />
            </Icon>
          </Box>
        </Box>

        {/* Card Content */}
        <Box p={4}>
          {/* Class ID and Lecturer */}
          <Text fontSize='sm' color='#dd7323' fontWeight='semibold' mb={2}>
            {course.classId} - {course.lecturerName}
          </Text>

          {/* Stats */}
          <HStack gap={4} mb={3} color='gray.600' fontSize='sm'>
            <HStack gap={1}>
              <Icon asChild color='gray.400'>
                <Users size={14} />
              </Icon>
              <Text>{course.totalStudents} SV</Text>
            </HStack>
            {course.enrolledAt && (
              <HStack gap={1}>
                <Icon asChild color='gray.400'>
                  <Calendar size={14} />
                </Icon>
                <Text>{new Date(course.enrolledAt).toLocaleDateString('vi-VN')}</Text>
              </HStack>
            )}
          </HStack>

          {/* Actions */}
          <HStack gap={2}>
            <Button
              bg='#dd7323'
              color='white'
              flex={1}
              size='sm'
              borderRadius='lg'
              _hover={{ bg: '#c5651f' }}
              onClick={() => onViewDetails(course.classId)}
            >
              <Eye size={16} />
              Xem chi tiết
            </Button>
            <IconButton
              aria-label='Unenroll'
              bg='white'
              color='red.500'
              border='1px solid'
              borderColor='gray.200'
              size='sm'
              borderRadius='lg'
              _hover={{ bg: 'red.50', borderColor: 'red.200' }}
              onClick={() => setIsDialogOpen(true)}
            >
              <LogOut size={16} />
            </IconButton>
          </HStack>
        </Box>
      </Box>

      {/* Unenroll Confirmation Dialog */}
      <Dialog.Root
        open={isDialogOpen}
        onOpenChange={(e) => setIsDialogOpen(e.open)}
        role='alertdialog'
        placement='center'
        motionPreset='slide-in-bottom'
      >
        <Portal>
          <Dialog.Backdrop bg='blackAlpha.600' backdropFilter='blur(4px)' />
          <Dialog.Positioner>
            <Dialog.Content borderRadius='2xl' shadow='2xl' maxW='md' mx={4} overflow='hidden'>
              <Dialog.Header pt={6} pb={2} px={6}>
                <VStack gap={4} w='full' align='center'>
                  {/* Warning Icon */}
                  <Box
                    p={4}
                    borderRadius='full'
                    bg='red.50'
                    border='4px solid'
                    borderColor='red.100'
                    shadow='lg'
                    _dark={{ bg: 'red.900', borderColor: 'red.800' }}
                  >
                    <Icon asChild color='red.500' boxSize={8}>
                      <LogOut size={32} />
                    </Icon>
                  </Box>
                  <Dialog.Title fontSize='xl' fontWeight='bold' textAlign='center' color='gray.800'>
                    Confirm Unenrollment
                  </Dialog.Title>
                </VStack>
              </Dialog.Header>

              <Dialog.Body py={4} px={6}>
                <VStack gap={4} align='center'>
                  <Text color='gray.600' textAlign='center' lineHeight='1.7'>
                    Are you sure you want to unenroll from the class
                  </Text>
                  <Box bg='gray.50' borderRadius='xl' p={4} w='full' border='1px solid' borderColor='gray.200'>
                    <VStack gap={1}>
                      <Text fontWeight='bold' fontSize='lg' color='orange.600'>
                        {course.classId}
                      </Text>
                      <Text color='gray.700' fontWeight='medium'>
                        {course.subjectName}
                      </Text>
                    </VStack>
                  </Box>
                  <HStack gap={2} bg='red.50' borderRadius='lg' p={3} w='full' border='1px solid' borderColor='red.200'>
                    <Text color='red.600' fontSize='lg'>
                      ⚠️
                    </Text>
                    <Text fontSize='sm' color='red.600' fontWeight='medium'>
                      This action cannot be undone!
                    </Text>
                  </HStack>
                </VStack>
              </Dialog.Body>

              <Dialog.Footer gap={3} px={6} pb={6} pt={2}>
                <Dialog.ActionTrigger asChild>
                  <Button
                    variant='outline'
                    disabled={isUnenrolling}
                    borderRadius='xl'
                    flex={1}
                    size='lg'
                    fontWeight='semibold'
                    borderWidth='2px'
                    _hover={{ bg: 'gray.50' }}
                  >
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  colorPalette='red'
                  onClick={handleUnenroll}
                  loading={isUnenrolling}
                  loadingText='Đang xử lý...'
                  borderRadius='xl'
                  flex={1}
                  size='lg'
                  fontWeight='semibold'
                  shadow='md'
                  _hover={{
                    shadow: 'lg',
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s'
                  }}
                >
                  Confirm Unenrollment
                </Button>
              </Dialog.Footer>

              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size='sm'
                  pos='absolute'
                  top={4}
                  right={4}
                  borderRadius='full'
                  _hover={{ bg: 'gray.100' }}
                />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
