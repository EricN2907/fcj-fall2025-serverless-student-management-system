'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { Box, VStack, HStack, Text, Spinner, Card, Badge, SimpleGrid, Button } from '@chakra-ui/react'
import { Search, BookOpen, Users, ArrowLeft, X, Calendar, Hash, Info } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { search, type SearchResult, type SearchType } from '../../services/searchApi'

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const keyword = searchParams.get('keyword') || ''

  // Lưu kết quả riêng cho classes và subjects
  const [classResults, setClassResults] = useState<SearchResult[]>([])
  const [subjectResults, setSubjectResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<SearchType>('classes')

  // Subject detail modal
  const [selectedSubject, setSelectedSubject] = useState<SearchResult | null>(null)

  // Fetch cả 2 loại cùng lúc
  const fetchResults = useCallback(async () => {
    if (!keyword.trim()) {
      setClassResults([])
      setSubjectResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Gọi cả 2 API cùng lúc
      const [classesResponse, subjectsResponse] = await Promise.all([
        search({ type: 'classes', keyword }),
        search({ type: 'subjects', keyword })
      ])

      console.log('Classes results:', classesResponse)
      console.log('Subjects results:', subjectsResponse)

      setClassResults(classesResponse.data || [])
      setSubjectResults(subjectsResponse.data || [])
    } catch (error) {
      console.error('Search error:', error)
      setClassResults([])
      setSubjectResults([])
    } finally {
      setLoading(false)
    }
  }, [keyword])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  // Lấy results theo tab đang active
  const results = activeType === 'classes' ? classResults : subjectResults
  const totalResults = classResults.length + subjectResults.length

  // Handle type change - chỉ đổi tab, không fetch lại
  const handleTypeChange = (newType: SearchType) => {
    setActiveType(newType)
  }

  // Handle card click
  const handleCardClick = (result: SearchResult) => {
    if (result.type === 'class') {
      // Navigate to course details - extract class ID from id (e.g., "CLASS#8BC151F4" -> "8BC151F4")
      const classId = result.id.replace('CLASS#', '')
      navigate(`/student/course-details/${classId}`)
    } else if (result.type === 'subject') {
      // Show subject detail modal
      setSelectedSubject(result)
    }
  }

  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status label
  const getStatusLabel = (status?: number | null) => {
    if (status === 1) return { label: 'Hoạt động', color: 'green' }
    if (status === 0) return { label: 'Không hoạt động', color: 'red' }
    return { label: 'Không xác định', color: 'gray' }
  }

  // Get display info based on type
  const getCardInfo = (result: SearchResult) => {
    if (result.type === 'class') {
      return {
        icon: Users,
        badgeColor: 'blue',
        badgeText: 'Lớp học',
        subtitle: result.subtitle || result.extraInfo || '',
        extraInfo: result.extraInfo ? `Phòng: ${result.extraInfo}` : null
      }
    } else {
      return {
        icon: BookOpen,
        badgeColor: 'green',
        badgeText: 'Môn học',
        subtitle: result.subtitle || '',
        extraInfo: null
      }
    }
  }

  return (
    <Box w='full' py={8} px={{ base: 4, sm: 6, lg: 8 }} bg='gray.50' minH='100vh'>
      <Box maxW='6xl' mx='auto'>
        {/* Back Button */}
        <HStack
          mb={4}
          gap={2}
          cursor='pointer'
          color='gray.600'
          _hover={{ color: '#dd7323' }}
          onClick={() => navigate(-1)}
          w='fit-content'
        >
          <ArrowLeft size={20} />
          <Text fontWeight='medium'>Quay lại</Text>
        </HStack>

        {/* Header */}
        <PageHeader
          icon={Search}
          title={`Kết quả tìm kiếm: "${keyword}"`}
          subtitle={`Tìm thấy ${totalResults} kết quả`}
        />

        {/* Type Filter Tabs */}
        <HStack gap={3} mb={6} px={6}>
          <button
            onClick={() => handleTypeChange('classes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeType === 'classes'
                ? 'bg-[#dd7323] text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#dd7323]'
            }`}
          >
            <Users size={18} />
            <span>Lớp học ({classResults.length})</span>
          </button>
          <button
            onClick={() => handleTypeChange('subjects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeType === 'subjects'
                ? 'bg-[#dd7323] text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-[#dd7323]'
            }`}
          >
            <BookOpen size={18} />
            <span>Môn học ({subjectResults.length})</span>
          </button>
        </HStack>

        {/* Results */}
        <Box px={6}>
          {loading ? (
            <VStack gap={3} py={12}>
              <Spinner size='xl' color='#dd7323' />
              <Text color='gray.500'>Đang tìm kiếm...</Text>
            </VStack>
          ) : results.length === 0 ? (
            <Card.Root bg='white' borderRadius='xl' border='1px solid' borderColor='gray.200' p={12}>
              <VStack gap={4}>
                <Box p={4} bg='gray.100' borderRadius='full'>
                  <Search size={48} className='text-gray-400' />
                </Box>
                <Text fontSize='lg' fontWeight='semibold' color='gray.700'>
                  Không tìm thấy kết quả
                </Text>
                <Text color='gray.500' textAlign='center'>
                  Không có {activeType === 'classes' ? 'lớp học' : 'môn học'} nào phù hợp với từ khóa "{keyword}"
                </Text>
              </VStack>
            </Card.Root>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
              {results.map((result) => {
                const cardInfo = getCardInfo(result)
                const IconComponent = cardInfo.icon

                return (
                  <Card.Root
                    key={result.id}
                    bg='white'
                    borderRadius='xl'
                    border='1px solid'
                    borderColor='gray.200'
                    overflow='hidden'
                    cursor='pointer'
                    transition='all 0.2s'
                    _hover={{
                      borderColor: '#dd7323',
                      shadow: 'lg',
                      transform: 'translateY(-2px)'
                    }}
                    onClick={() => handleCardClick(result)}
                  >
                    {/* Card Header with gradient */}
                    <Box
                      h='80px'
                      bg={
                        result.type === 'class'
                          ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                          : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                      }
                      position='relative'
                    >
                      <Box
                        position='absolute'
                        bottom='-20px'
                        left='16px'
                        w='50px'
                        h='50px'
                        bg='white'
                        borderRadius='xl'
                        display='flex'
                        alignItems='center'
                        justifyContent='center'
                        shadow='md'
                      >
                        <IconComponent
                          size={24}
                          className={result.type === 'class' ? 'text-blue-500' : 'text-green-500'}
                        />
                      </Box>
                    </Box>

                    <Card.Body pt={8} pb={4} px={4}>
                      <VStack align='stretch' gap={2}>
                        <HStack justify='space-between' align='start'>
                          <Text fontWeight='bold' fontSize='lg' color='gray.800' lineClamp={1}>
                            {result.title}
                          </Text>
                          <Badge
                            colorPalette={cardInfo.badgeColor}
                            variant='subtle'
                            borderRadius='full'
                            px={2}
                            fontSize='xs'
                          >
                            {cardInfo.badgeText}
                          </Badge>
                        </HStack>

                        {cardInfo.subtitle && (
                          <Text fontSize='sm' color='gray.600' lineClamp={1}>
                            {cardInfo.subtitle}
                          </Text>
                        )}

                        {cardInfo.extraInfo && (
                          <Text fontSize='xs' color='gray.500'>
                            {cardInfo.extraInfo}
                          </Text>
                        )}

                        {/* ID display */}
                        <Text fontSize='xs' color='gray.400' fontFamily='mono'>
                          ID: {result.id.replace('CLASS#', '').replace('SUBJECT#', '')}
                        </Text>
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                )
              })}
            </SimpleGrid>
          )}
        </Box>
      </Box>

      {/* Subject Detail Modal */}
      {selectedSubject && (
        <Box
          position='fixed'
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg='blackAlpha.500'
          zIndex={1000}
          display='flex'
          alignItems='center'
          justifyContent='center'
          onClick={() => setSelectedSubject(null)}
        >
          <Box
            bg='white'
            borderRadius='2xl'
            w='full'
            maxW='500px'
            mx={4}
            overflow='hidden'
            shadow='2xl'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with gradient */}
            <Box h='100px' bg='linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' position='relative'>
              <Button
                position='absolute'
                top={3}
                right={3}
                variant='ghost'
                size='sm'
                color='white'
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={() => setSelectedSubject(null)}
              >
                <X size={20} />
              </Button>
              <Box
                position='absolute'
                bottom='-25px'
                left='50%'
                transform='translateX(-50%)'
                w='60px'
                h='60px'
                bg='white'
                borderRadius='xl'
                display='flex'
                alignItems='center'
                justifyContent='center'
                shadow='lg'
              >
                <BookOpen size={28} className='text-green-500' />
              </Box>
            </Box>

            {/* Modal Body */}
            <Box pt={10} pb={6} px={6}>
              <VStack gap={4} align='stretch'>
                {/* Title */}
                <VStack gap={1}>
                  <Text fontSize='xl' fontWeight='bold' color='gray.800' textAlign='center'>
                    {selectedSubject.title}
                  </Text>
                  {selectedSubject.subtitle && (
                    <Text fontSize='md' color='gray.600' textAlign='center'>
                      {selectedSubject.subtitle}
                    </Text>
                  )}
                </VStack>

                {/* Status Badge */}
                <HStack justify='center'>
                  <Badge
                    colorPalette={getStatusLabel(selectedSubject.status).color}
                    variant='solid'
                    borderRadius='full'
                    px={3}
                    py={1}
                  >
                    {getStatusLabel(selectedSubject.status).label}
                  </Badge>
                </HStack>

                {/* Detail Info */}
                <Card.Root bg='gray.50' borderRadius='xl'>
                  <Card.Body p={4}>
                    <VStack gap={3} align='stretch'>
                      {/* ID */}
                      <HStack gap={3}>
                        <Box p={2} bg='green.100' borderRadius='lg'>
                          <Hash size={16} className='text-green-600' />
                        </Box>
                        <VStack align='start' gap={0} flex={1}>
                          <Text fontSize='xs' color='gray.500'>
                            Mã môn học
                          </Text>
                          <Text fontSize='sm' fontWeight='medium' color='gray.800' fontFamily='mono'>
                            {selectedSubject.id.replace('SUBJECT#', '')}
                          </Text>
                        </VStack>
                      </HStack>

                      {/* Type */}
                      <HStack gap={3}>
                        <Box p={2} bg='blue.100' borderRadius='lg'>
                          <Info size={16} className='text-blue-600' />
                        </Box>
                        <VStack align='start' gap={0} flex={1}>
                          <Text fontSize='xs' color='gray.500'>
                            Loại
                          </Text>
                          <Text fontSize='sm' fontWeight='medium' color='gray.800'>
                            {selectedSubject.type === 'subject' ? 'Môn học' : selectedSubject.type}
                          </Text>
                        </VStack>
                      </HStack>

                      {/* Created At */}
                      {selectedSubject.createdAt && (
                        <HStack gap={3}>
                          <Box p={2} bg='orange.100' borderRadius='lg'>
                            <Calendar size={16} className='text-orange-600' />
                          </Box>
                          <VStack align='start' gap={0} flex={1}>
                            <Text fontSize='xs' color='gray.500'>
                              Ngày tạo
                            </Text>
                            <Text fontSize='sm' fontWeight='medium' color='gray.800'>
                              {formatDate(selectedSubject.createdAt)}
                            </Text>
                          </VStack>
                        </HStack>
                      )}

                      {/* Extra Info */}
                      {selectedSubject.extraInfo && (
                        <HStack gap={3}>
                          <Box p={2} bg='purple.100' borderRadius='lg'>
                            <Info size={16} className='text-purple-600' />
                          </Box>
                          <VStack align='start' gap={0} flex={1}>
                            <Text fontSize='xs' color='gray.500'>
                              Thông tin thêm
                            </Text>
                            <Text fontSize='sm' fontWeight='medium' color='gray.800'>
                              {selectedSubject.extraInfo}
                            </Text>
                          </VStack>
                        </HStack>
                      )}
                    </VStack>
                  </Card.Body>
                </Card.Root>

                {/* Action Button */}
                <Button
                  bg='#dd7323'
                  color='white'
                  borderRadius='xl'
                  _hover={{ bg: '#c5651f' }}
                  onClick={() => {
                    const subjectId = selectedSubject.id.replace('SUBJECT#', '')
                    navigate(`/student/all-courses?subject=${subjectId}`)
                  }}
                >
                  <Search size={18} />
                  <Text ml={2}>Xem các lớp học của môn này</Text>
                </Button>
              </VStack>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
}
