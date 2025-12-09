'use client'

import { useState } from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Checkbox,
  Field,
  Dialog,
  Portal,
  CloseButton
} from '@chakra-ui/react'
import { MessageSquare, Upload, X, Pin } from 'lucide-react'
import MDEditor from '@uiw/react-md-editor'

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PostFormData) => Promise<void>
  classId: string
}

export interface PostFormData {
  title: string
  content: string
  is_pinned: boolean
  attachment: File | null
}

export default function CreatePostModal({ isOpen, onClose, onSubmit }: CreatePostModalProps) {
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    is_pinned: false,
    attachment: null
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof PostFormData, value: string | boolean | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleChange('attachment', file)
  }

  const removeFile = () => {
    handleChange('attachment', null)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề'
    if (!formData.content.trim()) newErrors.content = 'Vui lòng nhập nội dung'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    console.log('CreatePostModal - Submitting:', formData)
    if (!validate()) {
      console.log('CreatePostModal - Validation failed')
      return
    }
    setLoading(true)
    try {
      console.log('CreatePostModal - Calling onSubmit')
      await onSubmit(formData)
      // Reset form
      setFormData({
        title: '',
        content: '',
        is_pinned: false,
        attachment: null
      })
      onClose()
    } catch (err) {
      console.error('Failed to create post:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      is_pinned: false,
      attachment: null
    })
    setErrors({})
    onClose()
  }

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
          <Dialog.Content borderRadius='2xl' shadow='2xl' maxW='xl' w='full' mx={4} overflow='hidden' bg='white'>
            <Dialog.Header p={6} pb={4}>
              <HStack gap={3}>
                <Box p={2} bg='#dd7323' borderRadius='lg'>
                  <MessageSquare size={20} color='white' />
                </Box>
                <Dialog.Title fontSize='xl' fontWeight='bold' color='gray.800'>
                  Tạo bài đăng mới
                </Dialog.Title>
              </HStack>
            </Dialog.Header>

            <Dialog.Body px={6} pb={6}>
              <VStack gap={4} align='stretch'>
                {/* Title */}
                <Field.Root invalid={!!errors.title}>
                  <Field.Label fontWeight='medium'>
                    Tiêu đề{' '}
                    <Text as='span' color='red.500'>
                      *
                    </Text>
                  </Field.Label>
                  <Input
                    placeholder='Nhập tiêu đề bài đăng...'
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    borderColor={errors.title ? 'red.500' : 'orange.200'}
                    _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                  />
                  {errors.title && <Field.ErrorText>{errors.title}</Field.ErrorText>}
                </Field.Root>

                {/* Content - Markdown Editor */}
                <Field.Root invalid={!!errors.content}>
                  <Field.Label fontWeight='medium'>
                    Nội dung{' '}
                    <Text as='span' color='red.500'>
                      *
                    </Text>
                  </Field.Label>
                  <Box
                    data-color-mode='light'
                    border='1px solid'
                    borderColor={errors.content ? 'red.500' : 'orange.200'}
                    borderRadius='xl'
                    overflow='hidden'
                    _focusWithin={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                    w='full'
                  >
                    <MDEditor
                      value={formData.content}
                      onChange={(val) => handleChange('content', val || '')}
                      height={200}
                      preview='edit'
                      hideToolbar={false}
                      enableScroll={true}
                      visibleDragbar={false}
                      style={{
                        backgroundColor: 'white',
                        width: '100%'
                      }}
                    />
                  </Box>
                  {errors.content && <Field.ErrorText>{errors.content}</Field.ErrorText>}
                </Field.Root>

                {/* Pin Option */}
                <HStack>
                  <Checkbox.Root
                    checked={formData.is_pinned}
                    onCheckedChange={(e) => handleChange('is_pinned', !!e.checked)}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control
                      borderWidth='2px'
                      borderColor='gray.300'
                      _checked={{ bg: '#dd7323', borderColor: '#dd7323' }}
                      _hover={{ borderColor: '#dd7323' }}
                    >
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Label>
                      <HStack gap={1}>
                        <Pin size={14} color='#dd7323' />
                        <Text>Ghim bài đăng này</Text>
                      </HStack>
                    </Checkbox.Label>
                  </Checkbox.Root>
                </HStack>

                {/* File Upload - Full Width */}
                <Field.Root>
                  <Field.Label fontWeight='medium'>File đính kèm</Field.Label>
                  {!formData.attachment ? (
                    <Box
                      w='full'
                      border='2px dashed'
                      borderColor='orange.200'
                      borderRadius='xl'
                      p={6}
                      textAlign='center'
                      cursor='pointer'
                      _hover={{ borderColor: '#dd7323', bg: 'orange.50' }}
                      transition='all 0.2s'
                      onClick={() => document.getElementById('post-file-upload')?.click()}
                    >
                      <Upload size={32} color='#dd7323' style={{ margin: '0 auto 12px' }} />
                      <Text fontSize='sm' color='gray.600' fontWeight='medium'>
                        Click để chọn file hoặc kéo thả vào đây
                      </Text>
                      <Text fontSize='xs' color='gray.400' mt={1}>
                        Hỗ trợ: PDF, DOC, DOCX, ZIP, hình ảnh
                      </Text>
                      <input
                        id='post-file-upload'
                        type='file'
                        hidden
                        onChange={handleFileChange}
                        accept='.pdf,.doc,.docx,.zip,.rar,.png,.jpg,.jpeg,.gif'
                      />
                    </Box>
                  ) : (
                    <HStack p={3} bg='orange.50' borderRadius='lg' justify='space-between'>
                      <Text fontSize='sm' color='gray.700' lineClamp={1}>
                        {formData.attachment.name}
                      </Text>
                      <Button size='xs' variant='ghost' color='red.500' onClick={removeFile}>
                        <X size={14} />
                      </Button>
                    </HStack>
                  )}
                </Field.Root>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer p={6} pt={4} borderTop='1px solid' borderColor='gray.100'>
              <HStack gap={3} justify='flex-end'>
                <Button variant='outline' borderColor='orange.200' onClick={handleClose}>
                  Hủy
                </Button>
                <Button bg='#dd7323' color='white' _hover={{ bg: '#c5651f' }} onClick={handleSubmit} loading={loading}>
                  Đăng bài
                </Button>
              </HStack>
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild>
              <CloseButton size='sm' pos='absolute' top={4} right={4} borderRadius='full' _hover={{ bg: 'gray.100' }} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
