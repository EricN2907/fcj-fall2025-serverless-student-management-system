'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Input,
  Icon,
  Dialog,
  Portal,
  CloseButton
} from '@chakra-ui/react'
import { Key, ChevronDown } from 'lucide-react'
import type { ClassInfo } from './SubjectClassCard'

// Background colors for cards (same as SubjectClassCard)
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

interface EnrolmentModalProps {
  isOpen: boolean
  onClose: () => void
  classInfo: ClassInfo | null
  cardIndex: number
  onEnrol: (classId: number, enrolmentKey: string) => Promise<void>
}

export default function EnrolmentModal({
  isOpen,
  onClose,
  classInfo,
  cardIndex,
  onEnrol
}: EnrolmentModalProps) {
  const [enrolmentKey, setEnrolmentKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const handleEnrol = async () => {
    if (!classInfo || !enrolmentKey.trim()) return

    setIsLoading(true)
    try {
      await onEnrol(classInfo.id, enrolmentKey)
      setEnrolmentKey('')
      onClose()
    } catch (error) {
      console.error('Enrolment failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEnrolmentKey('')
    onClose()
  }

  if (!classInfo) return null

  const background = CARD_BACKGROUNDS[cardIndex % CARD_BACKGROUNDS.length]

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && handleClose()}
      placement='center'
      motionPreset='slide-in-bottom'
    >
      <Portal>
        <Dialog.Backdrop bg='blackAlpha.600' backdropFilter='blur(4px)' />
        <Dialog.Positioner>
          <Dialog.Content
            borderRadius='2xl'
            shadow='2xl'
            maxW='2xl'
            w='full'
            mx={4}
            overflow='hidden'
            bg='white'
          >
            <Dialog.Header p={6} pb={4}>
              <Dialog.Title fontSize='xl' fontWeight='bold' color='gray.800'>
                Enrolment options
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body px={6} pb={6}>
              <HStack align='flex-start' gap={8} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
                {/* Left: Class Card Preview */}
                <Box
                  w={{ base: 'full', md: '200px' }}
                  flexShrink={0}
                  borderRadius='xl'
                  overflow='hidden'
                  shadow='md'
                >
                  {/* Card Image */}
                  <Box
                    h='120px'
                    position='relative'
                    bgGradient={background}
                  >
                    {/* Subject Badge */}
                    <Box
                      position='absolute'
                      top={3}
                      left={3}
                      bg='#dd7323'
                      color='white'
                      px={2}
                      py={0.5}
                      borderRadius='md'
                      fontSize='xs'
                      fontWeight='semibold'
                      maxW='150px'
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
                      p={1.5}
                      borderRadius='full'
                      shadow='md'
                    >
                      <Icon asChild color='#dd7323'>
                        <Key size={14} />
                      </Icon>
                    </Box>
                  </Box>

                  {/* Card Footer */}
                  <Box bg='white' p={3} borderTop='1px solid' borderColor='gray.100'>
                    <Text fontSize='xs' color='#dd7323' fontWeight='medium' truncate>
                      {classInfo.name} - {classInfo.teacher_name}
                    </Text>
                  </Box>
                </Box>

                {/* Right: Enrolment Form */}
                <VStack align='stretch' flex={1} gap={4}>
                  {/* Collapsible Header */}
                  <HStack
                    as='button'
                    onClick={() => setIsExpanded(!isExpanded)}
                    gap={2}
                    cursor='pointer'
                    _hover={{ opacity: 0.8 }}
                  >
                    <Icon
                      asChild
                      color='#dd7323'
                      transform={isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'}
                      transition='transform 0.2s'
                    >
                      <ChevronDown size={20} />
                    </Icon>
                    <Text fontWeight='bold' fontSize='lg' color='gray.800'>
                      Self enrolment (Student)
                    </Text>
                  </HStack>

                  {/* Enrolment Form */}
                  {isExpanded && (
                    <VStack align='stretch' gap={4} pl={7}>
                      <HStack gap={4} flexWrap={{ base: 'wrap', sm: 'nowrap' }}>
                        <Text fontSize='sm' color='gray.600' whiteSpace='nowrap'>
                          Enrolment key
                        </Text>
                        <Input
                          type='password'
                          value={enrolmentKey}
                          onChange={(e) => setEnrolmentKey(e.target.value)}
                          placeholder='Enter enrolment key'
                          size='sm'
                          borderRadius='lg'
                          borderColor='gray.300'
                          _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                          maxW='200px'
                        />
                      </HStack>

                      <Button
                        bg='#dd7323'
                        color='white'
                        size='sm'
                        borderRadius='lg'
                        px={6}
                        w='fit-content'
                        _hover={{ bg: '#c5651f' }}
                        onClick={handleEnrol}
                        loading={isLoading}
                        loadingText='Đang xử lý...'
                        disabled={!enrolmentKey.trim()}
                      >
                        Enrol me
                      </Button>
                    </VStack>
                  )}
                </VStack>
              </HStack>
            </Dialog.Body>

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
  )
}
