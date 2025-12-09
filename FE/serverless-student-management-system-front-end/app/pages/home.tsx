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
  Button,
  Avatar
} from '@chakra-ui/react'
import {
  Bell,
  BookOpen,
  Calendar,
  Award,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Clock,
  ChevronRight as ArrowRight
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useNotificationUIStore } from '../store/notificationUIStore'
import api from '../utils/axios'
import { fetchCalendarAssignments } from '../services/studentApi'
import PageHeader from '../components/ui/PageHeader'
import StatsCard from '../components/ui/StatsCard'
import type { CalendarAssignment } from '../types'

// Import types from centralized types
import type { StudentDashboardStats, RecentNotification, StudentEnrolledClassDTO, CalendarDay } from '../types'

// Local type alias for dashboard stats with additional field
interface DashboardStats extends StudentDashboardStats {
  unreadNotifications: number
}

// API Response Types (specific to this page's API calls)
interface NotificationFromAPI {
  id: number
  title: string
  content: string
  type: string // 'system' | 'class'
  class_id?: number
  sent_at: string
  is_read?: boolean
}

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
  if (diffDays < 7) return `${diffDays} ngày trước`
  return formatDate(date)
}

// Calendar constants
const DAYS_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

// Extended CalendarDay with assignments
interface CalendarDayWithAssignments extends CalendarDay {
  assignments: CalendarAssignment[]
}

export default function HomeRoute() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { openNotificationPanel } = useNotificationUIStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const today = new Date()

  // Fetch enrolled classes
  const { data: enrolledClasses = [], isLoading: classesLoading } = useQuery<ClassFromAPI[]>({
    queryKey: ['enrolled-classes'],
    queryFn: async () => {
      const response = await api.get<{ data: ClassFromAPI[] }>('/api/student/classes/enrolled')
      // BE trả về { data: [...], count, message, status }
      return (response.data as any)?.data || response.data?.results || []
    }
  })

  // Fetch notifications from API
  const { data: notificationsRaw = [], isLoading: notificationsLoading } = useQuery<NotificationFromAPI[]>({
    queryKey: ['student-notifications'],
    queryFn: async () => {
      const response = await api.get<{ results: NotificationFromAPI[] }>('/api/student/notifications')
      return response.data?.results || []
    }
  })

  // Transform API notifications to UI format
  const notifications: RecentNotification[] = useMemo(() => {
    return notificationsRaw.map((n) => ({
      id: String(n.id),
      type: n.type === 'system' ? 'admin' : 'lecturer',
      title: n.title,
      content: n.content,
      createdAt: n.sent_at,
      isRead: n.is_read ?? false,
      classId: n.class_id
    }))
  }, [notificationsRaw])

  // Calculate unread count
  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length
  }, [notifications])

  // Fetch calendar assignments
  const { data: assignments = [], isLoading: calendarLoading } = useQuery({
    queryKey: ['calendar-assignments', currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: () => fetchCalendarAssignments(currentDate.getMonth() + 1, currentDate.getFullYear())
  })

  // Calculate upcoming deadlines (within 7 days)
  const upcomingDeadlinesCount = useMemo(() => {
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return assignments.filter((a) => {
      const deadline = new Date(a.deadline)
      return deadline >= now && deadline <= weekFromNow
    }).length
  }, [assignments])

  // Dashboard stats computed from real data
  const stats: DashboardStats = useMemo(
    () => ({
      enrolledClasses: enrolledClasses.length,
      upcomingDeadlines: upcomingDeadlinesCount,
      unreadNotifications: unreadNotificationsCount,
      averageScore: 0 // TODO: Get from grades API when available
    }),
    [enrolledClasses.length, upcomingDeadlinesCount, unreadNotificationsCount]
  )

  const statsLoading = classesLoading || notificationsLoading || calendarLoading

  // Generate mini calendar days
  const calendarDays = useMemo<CalendarDay[]>(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const endDate = new Date(lastDay)
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()))

    const days: CalendarDay[] = []
    const current = new Date(startDate)
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0]
      const dayAssignments = assignments.filter((a) => {
        const assignmentDate = new Date(a.deadline).toISOString().split('T')[0]
        return assignmentDate === dateStr
      })

      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.getTime() === todayDate.getTime(),
        assignments: dayAssignments
      })

      current.setDate(current.getDate() + 1)
    }

    return days
  }, [currentDate, assignments])

  // Calendar navigation
  const goToPrevMonth = () => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  const goToNextMonth = () => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))

  // Handle notification click - navigate to class if it's a class notification
  const handleNotificationClick = (notification: RecentNotification) => {
    if (notification.classId) {
      navigate(`/student/classes/${notification.classId}`)
    }
  }

  return (
    <Box minH='100vh' bg='white' py={8} px={{ base: 4, md: 6, lg: 8 }}>
      <Box maxW='1400px' mx='auto'>
        {/* ============================================
            HERO SECTION - White/Orange Theme
        ============================================ */}
        <Box mb={8}>
          {/* Header */}
          <PageHeader
            icon={Award}
            title={`Chào mừng, ${user?.fullName || 'Sinh viên'}!`}
            subtitle={`Hôm nay là ${getVietnameseDay(today.getDay())}, ngày ${formatDate(today)}`}
          />

          {/* Quick Stats Grid - Orange/White Theme */}
          <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4} px={6}>
            <StatsCard
              label='Thông báo chưa đọc'
              value={stats?.unreadNotifications || 0}
              icon={Bell}
              isLoading={statsLoading}
              onClick={openNotificationPanel}
            />
            <StatsCard
              label='Lớp đã đăng ký'
              value={stats?.enrolledClasses || 0}
              icon={BookOpen}
              isLoading={statsLoading}
              onClick={() => navigate('/student/my-courses')}
            />
            <StatsCard
              label='Deadline tuần này'
              value={stats?.upcomingDeadlines || 0}
              icon={Clock}
              isLoading={statsLoading}
              onClick={() => navigate('/student/calendar')}
            />
            <StatsCard
              label='Điểm trung bình'
              value={stats?.averageScore?.toFixed(1) || '0.0'}
              icon={Award}
              isLoading={statsLoading}
              onClick={() => navigate('/student/ranking')}
            />
          </Grid>
        </Box>

        {/* ============================================
            MAIN CONTENT - 2 Columns
        ============================================ */}
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
                  onClick={openNotificationPanel}
                >
                  Xem tất cả
                  <ArrowRight size={16} />
                </Button>
              </HStack>
            </Card.Header>

            <Card.Body pt={2}>
              <VStack gap={3} align='stretch'>
                {notifications.slice(0, 5).map((notification) => (
                  <Box
                    key={notification.id}
                    p={4}
                    bg={notification.isRead ? 'gray.50' : 'orange.50'}
                    borderRadius='xl'
                    borderLeft='4px solid'
                    borderLeftColor='#dd7323'
                    cursor='pointer'
                    _hover={{ bg: notification.isRead ? 'gray.100' : 'orange.100', transform: 'translateX(4px)' }}
                    transition='all 0.2s'
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <HStack gap={3} align='flex-start'>
                      {/* Icon/Avatar */}
                      {notification.type === 'admin' ? (
                        <Circle size='10' bg='orange.100' flexShrink={0}>
                          <Megaphone size={18} color='#dd7323' />
                        </Circle>
                      ) : (
                        <Box position='relative' flexShrink={0}>
                          <Avatar.Root size='sm'>
                            <Avatar.Image src={notification.senderAvatar} />
                            <Avatar.Fallback name={notification.senderName} />
                          </Avatar.Root>
                          <Circle
                            size='5'
                            bg='#dd7323'
                            position='absolute'
                            bottom='-2px'
                            right='-2px'
                            border='2px solid white'
                          >
                            <Bell size={10} color='white' />
                          </Circle>
                        </Box>
                      )}

                      {/* Content */}
                      <VStack align='flex-start' gap={1} flex={1} minW={0}>
                        <HStack gap={2} flexWrap='wrap'>
                          <Text fontWeight='semibold' fontSize='sm' color='gray.800' lineClamp={1}>
                            {notification.title}
                          </Text>
                          {!notification.isRead && (
                            <Badge bg='#dd7323' color='white' size='sm' borderRadius='full'>
                              Mới
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize='sm' color='gray.600' lineClamp={2}>
                          {notification.content}
                        </Text>
                        <HStack gap={2} fontSize='xs' color='gray.500'>
                          {notification.senderName && (
                            <>
                              <Text>{notification.senderName}</Text>
                              <Text>•</Text>
                            </>
                          )}
                          <Text>{getRelativeTime(notification.createdAt)}</Text>
                        </HStack>
                      </VStack>
                    </HStack>
                  </Box>
                ))}

                {notifications.length === 0 && (
                  <Center py={8}>
                    <VStack gap={3}>
                      <Circle size='16' bg='orange.50'>
                        <Bell size={32} color='#dd7323' />
                      </Circle>
                      <Text color='gray.500'>Không có thông báo mới</Text>
                    </VStack>
                  </Center>
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
                    Lịch
                  </Heading>
                </HStack>
                <Button
                  variant='ghost'
                  size='sm'
                  color='#dd7323'
                  _hover={{ bg: 'orange.50' }}
                  onClick={() => navigate('/student/calendar')}
                >
                  Xem đầy đủ
                  <ArrowRight size={16} />
                </Button>
              </HStack>
            </Card.Header>

            <Card.Body pt={2} pb={4}>
              {/* Calendar Navigation */}
              <HStack justify='space-between' mb={3}>
                <IconButton
                  aria-label='Previous month'
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
                  aria-label='Next month'
                  variant='ghost'
                  size='sm'
                  color='#dd7323'
                  _hover={{ bg: 'orange.50' }}
                  onClick={goToNextMonth}
                >
                  <ChevronRight size={18} />
                </IconButton>
              </HStack>

              {calendarLoading ? (
                <Center h='200px'>
                  <Spinner size='lg' color='#dd7323' />
                </Center>
              ) : (
                <>
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
                        bg={day.isToday ? '#dd7323' : day.assignments.length > 0 ? 'orange.50' : 'transparent'}
                        color={day.isToday ? 'white' : day.isCurrentMonth ? 'gray.800' : 'gray.400'}
                        position='relative'
                        minH='32px'
                        display='flex'
                        alignItems='center'
                        justifyContent='center'
                        cursor={day.assignments.length > 0 ? 'pointer' : 'default'}
                        _hover={day.assignments.length > 0 ? { bg: day.isToday ? '#c5651f' : 'orange.100' } : {}}
                        onClick={() => {
                          if (day.assignments.length > 0) {
                            navigate('/student/calendar')
                          }
                        }}
                      >
                        <Text fontSize='sm' fontWeight={day.isToday ? 'bold' : 'normal'}>
                          {day.date.getDate()}
                        </Text>
                        {day.assignments.length > 0 && !day.isToday && (
                          <Circle
                            size='2'
                            bg='#dd7323'
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
                  <HStack gap={3} mt={4} justify='center' flexWrap='wrap'>
                    <HStack gap={1}>
                      <Circle size='2' bg='green.500' />
                      <Text fontSize='xs' color='gray.600'>
                        Bài tập
                      </Text>
                    </HStack>
                    <HStack gap={1}>
                      <Circle size='2' bg='purple.500' />
                      <Text fontSize='xs' color='gray.600'>
                        Dự án
                      </Text>
                    </HStack>
                    <HStack gap={1}>
                      <Circle size='2' bg='#dd7323' />
                      <Text fontSize='xs' color='gray.600'>
                        Giữa kỳ
                      </Text>
                    </HStack>
                    <HStack gap={1}>
                      <Circle size='2' bg='red.500' />
                      <Text fontSize='xs' color='gray.600'>
                        Cuối kỳ
                      </Text>
                    </HStack>
                  </HStack>
                </>
              )}
            </Card.Body>
          </Card.Root>
        </Grid>
      </Box>
    </Box>
  )
}
