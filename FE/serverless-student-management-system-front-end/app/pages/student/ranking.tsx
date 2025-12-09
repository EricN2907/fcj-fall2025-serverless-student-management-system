'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trophy, TrendingUp, Award } from 'lucide-react'
import { Box, Text, VStack, HStack, Card, Circle, Spinner, Grid, NativeSelect } from '@chakra-ui/react'
import api from '../../utils/axios'
import { ErrorDisplay } from '../../components/ui/ErrorDisplay'
import PageHeader from '../../components/ui/PageHeader'
import StatsCard from '../../components/ui/StatsCard'
import EmptyState from '../../components/ui/EmptyState'

interface RankingData {
  rank: number
  score: number
  totalStudents: number
  className: string
  classCode: string
}

interface ClassOption {
  id: number
  name: string
  code: string
}

interface EnrolledClassFromAPI {
  class_id: number
  name: string
  subject_name?: string
}

interface RankingFromAPI {
  rank: number
  score: number
  total_students: number
  class_name?: string
  class_id?: number
}

export default function RankingRoute() {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [ranking, setRanking] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [rankingLoading, setRankingLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch enrolled classes
  const fetchEnrolledClasses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get<{ data: EnrolledClassFromAPI[] }>('/api/student/classes/enrolled')
      // BE trả về { data: [...], count, message, status }
      const enrolledClasses = (response.data as any)?.data || response.data?.results || []

      const mappedClasses: ClassOption[] = enrolledClasses.map((c) => ({
        id: c.class_id,
        name: c.subject_name || c.name,
        code: c.name
      }))

      setClasses(mappedClasses)

      // Auto-select first class
      if (mappedClasses.length > 0) {
        setSelectedClassId(mappedClasses[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch enrolled classes:', err)
      setError('Không thể tải danh sách lớp học. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch ranking for selected class
  const fetchRanking = useCallback(
    async (classId: number) => {
      setRankingLoading(true)
      try {
        const response = await api.get<RankingFromAPI>(`/student/ranking/${classId}`)
        const data = response.data

        const selectedClass = classes.find((c) => c.id === classId)

        setRanking({
          rank: data.rank || 0,
          score: data.score || 0,
          totalStudents: data.total_students || 0,
          className: selectedClass?.name || data.class_name || '',
          classCode: selectedClass?.code || String(classId)
        })
      } catch (err) {
        console.error('Failed to fetch ranking:', err)
        setRanking(null)
      } finally {
        setRankingLoading(false)
      }
    },
    [classes]
  )

  useEffect(() => {
    fetchEnrolledClasses()
  }, [fetchEnrolledClasses])

  useEffect(() => {
    if (selectedClassId) {
      fetchRanking(selectedClassId)
    }
  }, [selectedClassId, fetchRanking])

  const getRankingBadge = (rank: number) => {
    if (rank === 1) return '�'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return '📍'
  }

  if (loading) {
    return (
      <Box minH='60vh' display='flex' alignItems='center' justifyContent='center' bg='white'>
        <VStack gap={3}>
          <Spinner size='xl' color='#dd7323' borderWidth='4px' />
          <Text color='gray.600'>Đang tải danh sách lớp...</Text>
        </VStack>
      </Box>
    )
  }

  if (error) {
    return <ErrorDisplay variant='fetch' message={error} onRetry={fetchEnrolledClasses} />
  }

  if (classes.length === 0) {
    return (
      <Box w='full' py={8} px={{ base: 4, sm: 6, lg: 8 }} bg='white' minH='100vh'>
        <Box maxW='4xl' mx='auto'>
          <PageHeader icon={Trophy} title='Xếp hạng cá nhân' subtitle='Xem xếp hạng của bạn trong từng lớp học' />
          <Box px={6}>
            <EmptyState
              icon={Trophy}
              title='Bạn chưa đăng ký lớp học nào'
              description='Hãy đăng ký lớp học để xem xếp hạng'
            />
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box w='full' py={8} px={{ base: 4, sm: 6, lg: 8 }} bg='white' minH='100vh'>
      <Box maxW='4xl' mx='auto'>
        {/* Header */}
        <PageHeader icon={Trophy} title='Xếp hạng cá nhân' subtitle='Xem xếp hạng của bạn trong từng lớp học' />

        {/* Class Selection */}
        <Box px={6} mb={6}>
          <Card.Root bg='white' borderRadius='xl' border='1px solid' borderColor='orange.200' shadow='sm'>
            <Card.Body p={6}>
              <Text fontSize='sm' fontWeight='semibold' color='gray.700' mb={3}>
                Chọn lớp học
              </Text>
              <NativeSelect.Root size='lg'>
                <NativeSelect.Field
                  value={selectedClassId || ''}
                  onChange={(e) => setSelectedClassId(Number(e.target.value))}
                  bg='orange.50'
                  borderColor='orange.200'
                  borderRadius='xl'
                  _hover={{ borderColor: '#dd7323' }}
                  _focus={{ borderColor: '#dd7323', boxShadow: '0 0 0 1px #dd7323' }}
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code})
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator color='#dd7323' />
              </NativeSelect.Root>
            </Card.Body>
          </Card.Root>
        </Box>

        {/* Ranking Content */}
        {rankingLoading ? (
          <Box px={6}>
            <VStack gap={3} py={12}>
              <Spinner size='lg' color='#dd7323' />
              <Text color='gray.500'>Đang tải xếp hạng...</Text>
            </VStack>
          </Box>
        ) : ranking ? (
          <VStack gap={6} px={6}>
            {/* Main Ranking Display */}
            <Card.Root
              w='full'
              bg='linear-gradient(135deg, #dd7323 0%, #ff9a56 100%)'
              borderRadius='2xl'
              shadow='xl'
              overflow='hidden'
            >
              <Card.Body p={8}>
                <VStack gap={4}>
                  <Text fontSize='6xl'>{getRankingBadge(ranking.rank)}</Text>
                  <Text fontSize='lg' color='whiteAlpha.900'>
                    Xếp hạng của bạn
                  </Text>
                  <HStack gap={2} align='baseline'>
                    <Text fontSize='5xl' fontWeight='bold' color='white'>
                      {ranking.rank}
                    </Text>
                    <Text fontSize='2xl' color='whiteAlpha.800'>
                      / {ranking.totalStudents}
                    </Text>
                  </HStack>
                  <Text fontSize='sm' color='whiteAlpha.800'>
                    {ranking.className} ({ranking.classCode})
                  </Text>
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Stats Grid */}
            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4} w='full'>
              <StatsCard label='Điểm số' value={ranking.score.toFixed(1)} icon={TrendingUp} />
              <StatsCard label='Xếp hạng' value={`#${ranking.rank}`} icon={Trophy} />
              <StatsCard label='Tổng sinh viên' value={ranking.totalStudents} icon={Award} />
            </Grid>

            {/* Progress Bar */}
            <Card.Root w='full' bg='white' border='1px solid' borderColor='orange.200' borderRadius='xl' shadow='sm'>
              <Card.Body p={6}>
                <HStack justify='space-between' mb={3}>
                  <Text fontWeight='semibold' color='gray.800'>
                    Tiến độ xếp hạng
                  </Text>
                  <Text fontSize='sm' color='#dd7323' fontWeight='medium'>
                    Top {ranking.totalStudents > 0 ? Math.round((ranking.rank / ranking.totalStudents) * 100) : 0}%
                  </Text>
                </HStack>
                <Box w='full' bg='orange.100' borderRadius='full' h='12px' overflow='hidden'>
                  <Box
                    h='full'
                    bg='linear-gradient(90deg, #dd7323 0%, #ff9a56 100%)'
                    borderRadius='full'
                    transition='all 0.5s'
                    style={{
                      width: `${ranking.totalStudents > 0 ? Math.max((1 - ranking.rank / ranking.totalStudents) * 100, 5) : 0}%`
                    }}
                  />
                </Box>
                <Text fontSize='xs' color='gray.500' mt={3}>
                  Bạn đứng trên {ranking.totalStudents - ranking.rank} sinh viên khác trong lớp
                </Text>
              </Card.Body>
            </Card.Root>
          </VStack>
        ) : (
          <Box px={6}>
            <EmptyState icon={Trophy} title='Chưa có dữ liệu xếp hạng cho lớp này' />
          </Box>
        )}
      </Box>
    </Box>
  )
}
