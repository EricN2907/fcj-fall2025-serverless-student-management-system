'use client'

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Grid,
  GridItem,
  Text,
  Heading,
  Badge,
  Card,
  HStack,
  VStack,
  Circle,
  Spinner,
  Center,
  IconButton,
  Button
} from '@chakra-ui/react'
import {
  Bell,
  BookOpen,
  Calendar,
  Award,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ArrowRight,
  FileText,
  Users
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import PageHeader from '../../components/ui/PageHeader'
import StatsCard from '../../components/ui/StatsCard'
import { lecturerClassApi, lecturerNotificationApi } from '../../services/lecturerApi'
import type { ClassDTO, NotificationDTO } from '../../types'

// ============================================
// USE REAL API DATA
// ============================================

// ============================================
// HELPER FUNCTIONS
// ============================================
const getVietnameseDay = (day: number): string => {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  return days[day]
}

const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const getRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays === 1) return 'Hôm qua'
  if (diffDays < 7) return `${diffDays} ngày trước`
  return formatDate(date)
}

// Calendar constants
const DAYS_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

// Extended CalendarDay for lecturer dashboard
interface LecturerCalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  hasDeadline: boolean
}

export default function LecturerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const today = new Date()

  // Fetch classes - API trả về { data: [...], count, message, status }
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['lecturer-classes'],
    queryFn: async () => {
      const response = await lecturerClassApi.getClasses()
      return response
    }
  })

  // Fetch notifications - API trả về array trực tiếp
  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['lecturer-notifications'],
    queryFn: async () => {
      try {
        const response = await lecturerNotificationApi.getReceivedNotifications()
        // API đã trả về array trực tiếp
        return Array.isArray(response) ? response : []
      } catch {
        // Nếu API lỗi, trả về empty array
        return []
      }
    }
  })

  // Parse classes from API response - handle both formats
  const classes = useMemo(() => {
    const data = (classesData as any)?.data || classesData?.results || []
    return Array.isArray(data) ? data : []
  }, [classesData])

  // Parse notifications - API đã trả về array trực tiếp
  const notifications = useMemo(() => {
    return Array.isArray(notificationsData) ? notificationsData : []
  }, [notificationsData])

  // Calculate stats
  const unreadCount = notifications.filter((n: any) => !n.is_read && !n.isRead).length
  const activeClasses = classes.filter((c: any) => c.status === 1 || c.status === 'active').length
  const totalStudents = classes.reduce((sum: number, c: any) => sum + (c.student_count || c.studentCount || 0), 0)

  const statsLoading = classesLoading || notificationsLoading

  // Generate mini calendar days
  const calendarDays = useMemo<LecturerCalendarDay[]>(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const endDate = new Date(lastDay)
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()))

    const days: LecturerCalendarDay[] = []
    const current = new Date(startDate)
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)

    // Mock deadlines (7 days after assignment deadlines)
    const mockDeadlineDays = [10, 15, 22, 28]

    while (current <= endDate) {
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.getTime() === todayDate.getTime(),
        hasDeadline: mockDeadlineDays.includes(current.getDate()) && current.getMonth() === month
      })
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [currentDate])

  // Calendar navigation
  const goToPrevMonth = () => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  const goToNextMonth = () => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))

  return (
    <Box minH='100vh' bg='white' py={8} px={{ base: 4, md: 6, lg: 8 }}>
      <Box maxW='1400px' mx='auto'>
        {/* Hero Section */}
        <Box mb={8}>
          <PageHeader
            icon={Award}
            title={`Chào mừng quay trở lại, ${user?.fullName || 'Giảng viên'}!`}
            subtitle={`Hôm nay là ${getVietnameseDay(today.getDay())}, ngày ${formatDate(today)}`}
          />

          {/* Quick Stats Grid */}
          <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4} px={6}>
            <StatsCard
              label='Thông báo chưa đọc'
              value={unreadCount}
              icon={Bell}
              isLoading={statsLoading}
              onClick={() => navigate('/lecturer/notifications')}
            />
            <StatsCard
              label='Lớp đang giảng dạy'
              value={activeClasses}
              icon={BookOpen}
              isLoading={statsLoading}
              onClick={() => navigate('/lecturer/my-courses')}
            />
            <StatsCard label='Tổng sinh viên' value={totalStudents} icon={Users} isLoading={statsLoading} />
            <StatsCard label='Bài tập chưa chấm' value='--' icon={FileText} isLoading={statsLoading} />
          </Grid>
        </Box>

        {/* Main Content - 2 Columns */}
        <Grid templateColumns={{ base: '1fr', lg: '1fr 400px' }} gap={8} px={6}>
          {/* Left Column - Recent Notifications */}
          <Card.Root bg='white' borderRadius='xl' border='1px solid' borderColor='orange.100' shadow='sm'>
            <Card.Header pb={3} pt={5} px={6}>
              <HStack justify='space-between'>
                <HStack gap={3}>
                  <Box p={2} bg='#dd7323' borderRadius='lg'>
                    <Bell size={20} color='white' />
                  </Box>
                  <Heading size='md' color='gray.800'>
                    Thông báo gần đây
                  </Heading>
                </HStack>
                <Button
                  variant='ghost'
                  size='sm'
                  color='#dd7323'
                  _hover={{ bg: 'orange.50' }}
                  onClick={() => navigate('/lecturer/notifications')}
                >
                  Xem tất cả
                  <ArrowRight size={16} />
                </Button>
              </HStack>
            </Card.Header>

            <Card.Body pt={2}>
              <VStack gap={3} align='stretch'>
                {notificationsLoading ? (
                  <Center py={8}>
                    <Spinner size='lg' color='#dd7323' />
                  </Center>
                ) : !notifications || notifications.length === 0 ? (
                  <Center py={8}>
                    <VStack gap={3}>
                      <Circle size='16' bg='orange.50'>
                        <Bell size={32} color='#dd7323' />
                      </Circle>
                      <Text color='gray.500'>Không có thông báo mới</Text>
                    </VStack>
                  </Center>
                ) : (
                  notifications.slice(0, 5).map((notification: any) => {
                    const isRead = notification.is_read || notification.isRead
                    const createdAt = notification.created_at || notification.createdAt
                    return (
                      <Box
                        key={notification.id}
                        p={4}
                        bg={isRead ? 'gray.50' : 'orange.50'}
                        borderRadius='xl'
                        borderLeft='4px solid'
                        borderLeftColor='#dd7323'
                        cursor='pointer'
                        _hover={{ bg: isRead ? 'gray.100' : 'orange.100', transform: 'translateX(4px)' }}
                        transition='all 0.2s'
                      >
                        <HStack gap={3} align='flex-start'>
                          <Circle size='10' bg='orange.100' flexShrink={0}>
                            <Megaphone size={18} color='#dd7323' />
                          </Circle>
                          <VStack align='flex-start' gap={1} flex={1} minW={0}>
                            <HStack gap={2} flexWrap='wrap'>
                              <Text fontWeight='semibold' fontSize='sm' color='gray.800' lineClamp={1}>
                                {notification.title}
                              </Text>
                              {!isRead && (
                                <Badge bg='#dd7323' color='white' size='sm' borderRadius='full'>
                                  Mới
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize='sm' color='gray.600' lineClamp={2}>
                              {notification.content}
                            </Text>
                            <Text fontSize='xs' color='gray.500'>
                              {createdAt ? getRelativeTime(createdAt) : ''}
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>
                    )
                  })
                )}
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Right Column - Mini Calendar */}
          <Card.Root
            bg='white'
            borderRadius='xl'
            border='1px solid'
            borderColor='orange.100'
            shadow='sm'
            height='fit-content'
          >
            <Card.Header pb={2} pt={5} px={6}>
              <HStack justify='space-between'>
                <HStack gap={3}>
                  <Box p={2} bg='#dd7323' borderRadius='lg'>
                    <Calendar size={20} color='white' />
                  </Box>
                  <Heading size='md' color='gray.800'>
                    Lịch chấm bài
                  </Heading>
                </HStack>
              </HStack>
            </Card.Header>

            <Card.Body pt={2} pb={4}>
              {/* Calendar Navigation */}
              <HStack justify='space-between' mb={3}>
                <IconButton
                  aria-label='Tháng trước'
                  variant='ghost'
                  size='sm'
                  color='#dd7323'
                  _hover={{ bg: 'orange.50' }}
                  onClick={goToPrevMonth}
                >
                  <ChevronLeft size={18} />
                </IconButton>
                <Text fontWeight='semibold' color='#dd7323'>
                  Tháng {currentDate.getMonth() + 1}/{currentDate.getFullYear()}
                </Text>
                <IconButton
                  aria-label='Tháng sau'
                  variant='ghost'
                  size='sm'
                  color='#dd7323'
                  _hover={{ bg: 'orange.50' }}
                  onClick={goToNextMonth}
                >
                  <ChevronRight size={18} />
                </IconButton>
              </HStack>

              {/* Day Headers */}
              <Grid templateColumns='repeat(7, 1fr)' gap={1} mb={2}>
                {DAYS_SHORT.map((day) => (
                  <Text key={day} textAlign='center' fontSize='xs' fontWeight='semibold' color='#dd7323'>
                    {day}
                  </Text>
                ))}
              </Grid>

              {/* Calendar Grid */}
              <Grid templateColumns='repeat(7, 1fr)' gap={1}>
                {calendarDays.map((day, index) => (
                  <GridItem
                    key={index}
                    p={1}
                    textAlign='center'
                    borderRadius='md'
                    bg={day.isToday ? '#dd7323' : 'transparent'}
                    color={day.isToday ? 'white' : day.isCurrentMonth ? 'gray.800' : 'gray.400'}
                    position='relative'
                    minH='32px'
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                  >
                    <Text fontSize='sm' fontWeight={day.isToday ? 'bold' : 'normal'}>
                      {day.date.getDate()}
                    </Text>
                    {day.hasDeadline && !day.isToday && (
                      <Circle
                        size='2'
                        bg='red.500'
                        position='absolute'
                        bottom='2px'
                        left='50%'
                        transform='translateX(-50%)'
                      />
                    )}
                  </GridItem>
                ))}
              </Grid>

              {/* Legend */}
              <HStack gap={4} mt={4} justify='center'>
                <HStack gap={1}>
                  <Circle size='2' bg='red.500' />
                  <Text fontSize='xs' color='gray.600'>
                    Deadline chấm bài
                  </Text>
                </HStack>
              </HStack>
            </Card.Body>
          </Card.Root>
        </Grid>
      </Box>
    </Box>
  )
}
