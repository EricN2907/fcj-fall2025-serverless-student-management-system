'use client'

import { useState } from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Textarea,
  NativeSelect,
  Field,
  Dialog,
  Portal,
  CloseButton
} from '@chakra-ui/react'
import { FileText, Upload, X } from 'lucide-react'
import type { AssignmentType, AssignmentFormData } from '../../types'

interface CreateAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AssignmentFormData) => Promise<void>
  classId: string | number
}

// Re-export for backward compatibility
export type { AssignmentFormData }

const TYPE_OPTIONS: { value: AssignmentType; label: string; weight: string }[] = [
  { value: 'homework', label: 'Bài tập', weight: '20%' },
  { value: 'project', label: 'Dự án', weight: '30%' },
  { value: 'midterm', label: 'Giữa kỳ', weight: '25%' },
  { value: 'final', label: 'Cuối kỳ', weight: '25%' }
]

export default function CreateAssignmentModal({ isOpen, onClose, onSubmit }: CreateAssignmentModalProps) {
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    type: 'homework',
    deadline: '',
    max_score: 10,
    weight: 0.2, // Default weight for homework
    is_published: true,
    files: []
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof AssignmentFormData, value: string | number | boolean | File[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleChange('files', [...formData.files, ...files])
  }

  const removeFile = (index: number) => {
    handleChange(
      'files',
      formData.files.filter((_, i) => i !== index)
    )
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề'
    if (!formData.deadline) {
      newErrors.deadline = 'Vui lòng chọn deadline'
    } else {
      // Validate deadline format (datetime-local returns YYYY-MM-DDTHH:mm)
      const deadlineDate = new Date(formData.deadline)
      if (isNaN(deadlineDate.getTime())) {
        newErrors.deadline = 'Deadline không hợp lệ'
      }
    }
    setErrors(newErrors)
    console.log('Validation errors:', newErrors, 'Form data:', formData)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    console.log('Submitting form data:', formData)
    if (!validate()) {
      console.log('Validation failed')
      return
    }
    setLoading(true)
    try {
      console.log('Calling onSubmit with:', { ...formData, is_published: true })
      await onSubmit({ ...formData, is_published: true })
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'homework',
        deadline: '',
        max_score: 10,
        weight: 0.2,
        is_published: true,
        files: []
      })
      onClose()
    } catch (err) {
      console.error('Failed to create assignment:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      type: 'homework',
      deadline: '',
      max_score: 10,
      weight: 0.2,
      is_published: true,
      files: []
    })
    setErrors({})
    onClose()
  }

  const selectedType = TYPE_OPTIONS.find((t) => t.value === formData.type)

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
                  <FileText size={20} color='white' />
                </Box>
                <Dialog.Title fontSize='xl' fontWeight='bold' color='gray.800'>
                  Tạo bài tập mới
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
                    placeholder='Nhập tiêu đề bài tập...'
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    borderColor={errors.title ? 'red.500' : 'orange.200'}
                    _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                  />
                  {errors.title && <Field.ErrorText>{errors.title}</Field.ErrorText>}
                </Field.Root>

                {/* Type & Weight */}
                <HStack gap={4}>
                  <Field.Root flex={1}>
                    <Field.Label fontWeight='medium'>Loại bài tập</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        value={formData.type}
                        onChange={(e) => handleChange('type', e.target.value as AssignmentType)}
                        borderColor='orange.200'
                        _hover={{ borderColor: '#dd7323' }}
                      >
                        {TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator color='#dd7323' />
                    </NativeSelect.Root>
                  </Field.Root>

                  <Field.Root flex={1}>
                    <Field.Label fontWeight='medium'>Trọng số</Field.Label>
                    <Input
                      type='number'
                      min={0}
                      max={100}
                      step={1}
                      value={Math.round((formData.weight || 0.2) * 100)}
                      onChange={(e) => handleChange('weight', parseFloat(e.target.value) / 100)}
                      borderColor='orange.200'
                      _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                      placeholder='VD: 30'
                    />
                    <Text fontSize='xs' color='gray.500' mt={1}>
                      Nhập % (VD: 30 = 30%)
                    </Text>
                  </Field.Root>
                </HStack>

                {/* Deadline */}
                <Field.Root invalid={!!errors.deadline}>
                  <Field.Label fontWeight='medium'>
                    Deadline{' '}
                    <Text as='span' color='red.500'>
                      *
                    </Text>
                  </Field.Label>
                  <Input
                    type='datetime-local'
                    value={formData.deadline}
                    onChange={(e) => handleChange('deadline', e.target.value)}
                    borderColor={errors.deadline ? 'red.500' : 'orange.200'}
                    _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                  />
                  {errors.deadline && <Field.ErrorText>{errors.deadline}</Field.ErrorText>}
                </Field.Root>

                {/* Description */}
                <Field.Root>
                  <Field.Label fontWeight='medium'>Mô tả</Field.Label>
                  <Textarea
                    placeholder='Nhập mô tả bài tập...'
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    borderColor='orange.200'
                    _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                  />
                </Field.Root>

                {/* File Upload - Full Width */}
                <Field.Root>
                  <Field.Label fontWeight='medium'>File đính kèm</Field.Label>
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
                    onClick={() => document.getElementById('assignment-file-upload')?.click()}
                  >
                    <Upload size={32} color='#dd7323' style={{ margin: '0 auto 12px' }} />
                    <Text fontSize='sm' color='gray.600' fontWeight='medium'>
                      Click để chọn file hoặc kéo thả vào đây
                    </Text>
                    <Text fontSize='xs' color='gray.400' mt={1}>
                      Hỗ trợ: PDF, DOC, DOCX, ZIP, RAR, hình ảnh
                    </Text>
                    <input
                      id='assignment-file-upload'
                      type='file'
                      multiple
                      hidden
                      onChange={handleFileChange}
                      accept='.pdf,.doc,.docx,.zip,.rar,.png,.jpg,.jpeg,.gif,.ppt,.pptx,.xls,.xlsx'
                    />
                  </Box>

                  {/* File List */}
                  {formData.files.length > 0 && (
                    <VStack gap={2} mt={3} align='stretch'>
                      {formData.files.map((file, index) => (
                        <HStack key={index} p={2} bg='orange.50' borderRadius='lg' justify='space-between'>
                          <Text fontSize='sm' color='gray.700' lineClamp={1}>
                            {file.name}
                          </Text>
                          <Button size='xs' variant='ghost' color='red.500' onClick={() => removeFile(index)}>
                            <X size={14} />
                          </Button>
                        </HStack>
                      ))}
                    </VStack>
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
                  Tạo bài tập
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
