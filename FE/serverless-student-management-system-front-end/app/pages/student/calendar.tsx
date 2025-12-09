import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Text,
  IconButton,
  Button,
  Circle,
  HStack,
  VStack,
  Spinner,
  Center,
  Card
} from '@chakra-ui/react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { fetchCalendarAssignments } from '~/services/studentApi'
import { AssignmentModal } from '~/components'
import PageHeader from '~/components/ui/PageHeader'
import type { CalendarAssignment, CalendarDay } from '~/types'

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
]

// Assignment type colors
const TYPE_COLORS: Record<CalendarAssignment['type'], string> = {
  homework: 'green.500',
  project: 'purple.500',
  midterm: '#dd7323',
  final: 'red.500'
}

const TYPE_BG: Record<CalendarAssignment['type'], string> = {
  homework: 'green.50',
  project: 'purple.50',
  midterm: 'orange.50',
  final: 'red.50'
}

// Extended CalendarDay with assignments for this page
interface CalendarDayWithAssignments extends CalendarDay {
  assignments: CalendarAssignment[]
}

export default function StudentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedAssignment, setSelectedAssignment] = useState<CalendarAssignment | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Fetch assignments
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['calendar-assignments', currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: () => fetchCalendarAssignments(currentDate.getMonth() + 1, currentDate.getFullYear())
  })

  // Generate calendar days
  const calendarDays = useMemo<CalendarDayWithAssignments[]>(() => {
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
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0]
      const dayAssignments = assignments.filter((a) => {
        const assignmentDate = new Date(a.deadline).toISOString().split('T')[0]
        return assignmentDate === dateStr
      })

      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.getTime() === today.getTime(),
        assignments: dayAssignments
      })

      current.setDate(current.getDate() + 1)
    }

    return days
  }, [currentDate, assignments])

  // Navigate months
  const goToPrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Handle assignment click
  const handleAssignmentClick = (assignment: CalendarAssignment) => {
    setSelectedAssignment(assignment)
    setModalOpen(true)
  }

  return (
    <Box w='full' py={8} px={{ base: 4, sm: 6, lg: 8 }} bg='white' minH='100vh'>
      <Box maxW='1200px' mx='auto'>
        {/* Header */}
        <PageHeader icon={CalendarIcon} title='Lịch học' subtitle='Theo dõi deadline và lịch trình học tập'>
          <HStack gap={2}>
            <Button
              variant='outline'
              size='sm'
              borderColor='orange.200'
              color='#dd7323'
              _hover={{ bg: 'orange.50' }}
              onClick={goToToday}
            >
              Hôm nay
            </Button>
          </HStack>
        </PageHeader>

        {/* Calendar Navigation */}
        <Card.Root bg='white' borderRadius='xl' border='1px solid' borderColor='orange.200' shadow='sm' mb={6}>
          <Card.Body p={4}>
            <Flex justify='space-between' align='center'>
              <HStack gap={2}>
                <IconButton
                  aria-label='Tháng trước'
                  variant='ghost'
                  size='sm'
                  color='#dd7323'
                  _hover={{ bg: 'orange.50' }}
                  onClick={goToPrevMonth}
                >
                  <ChevronLeft size={20} />
                </IconButton>
                <IconButton
                  aria-label='Tháng sau'
                  variant='ghost'
                  size='sm'
                  color='#dd7323'
                  _hover={{ bg: 'orange.50' }}
                  onClick={goToNextMonth}
                >
                  <ChevronRight size={20} />
                </IconButton>
              </HStack>

              <Text fontSize='xl' fontWeight='bold' color='#dd7323'>
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>

              {/* Legend */}
              <Flex gap={4} flexWrap='wrap'>
                <HStack gap={2}>
                  <Circle size='3' bg='green.500' />
                  <Text fontSize='sm' color='gray.600'>Bài tập</Text>
                </HStack>
                <HStack gap={2}>
                  <Circle size='3' bg='purple.500' />
                  <Text fontSize='sm' color='gray.600'>Dự án</Text>
                </HStack>
                <HStack gap={2}>
                  <Circle size='3' bg='#dd7323' />
                  <Text fontSize='sm' color='gray.600'>Giữa kỳ</Text>
                </HStack>
                <HStack gap={2}>
                  <Circle size='3' bg='red.500' />
                  <Text fontSize='sm' color='gray.600'>Cuối kỳ</Text>
                </HStack>
              </Flex>
            </Flex>
          </Card.Body>
        </Card.Root>

        {isLoading ? (
          <Center h='400px'>
            <VStack gap={4}>
              <Spinner size='xl' color='#dd7323' borderWidth='4px' />
              <Text color='gray.500'>Đang tải lịch...</Text>
            </VStack>
          </Center>
        ) : (
          <Card.Root bg='white' borderRadius='xl' border='1px solid' borderColor='orange.200' shadow='sm' overflow='hidden'>
            {/* Day headers */}
            <Grid templateColumns='repeat(7, 1fr)' bg='orange.50'>
              {DAYS.map((day) => (
                <GridItem key={day} p={3} textAlign='center'>
                  <Text fontWeight='semibold' color='#dd7323' fontSize='sm'>
                    {day}
                  </Text>
                </GridItem>
              ))}
            </Grid>

            {/* Calendar grid */}
            <Grid
              templateColumns='repeat(7, 1fr)'
              templateRows={`repeat(${Math.ceil(calendarDays.length / 7)}, 1fr)`}
            >
              {calendarDays.map((day, index) => (
                <GridItem
                  key={index}
                  p={2}
                  minH='100px'
                  bg={day.isToday ? 'orange.50' : day.isCurrentMonth ? 'white' : 'gray.50'}
                  borderTop='1px solid'
                  borderLeft={index % 7 === 0 ? 'none' : '1px solid'}
                  borderColor='orange.100'
                  position='relative'
                  _hover={{ bg: day.isCurrentMonth ? 'orange.50' : 'gray.100' }}
                  transition='all 0.2s'
                >
                  {/* Date number */}
                  <Text
                    fontSize='sm'
                    fontWeight={day.isToday ? 'bold' : 'normal'}
                    color={day.isCurrentMonth ? (day.isToday ? '#dd7323' : 'gray.800') : 'gray.400'}
                    mb={1}
                  >
                    {day.isToday ? (
                      <Circle
                        size='7'
                        bg='#dd7323'
                        color='white'
                        display='inline-flex'
                        fontSize='sm'
                        fontWeight='bold'
                      >
                        {day.date.getDate()}
                      </Circle>
                    ) : (
                      day.date.getDate()
                    )}
                  </Text>

                  {/* Assignments */}
                  <VStack align='stretch' gap={1}>
                    {day.assignments.slice(0, 3).map((assignment) => (
                      <Box
                        key={assignment.id}
                        px={2}
                        py={1}
                        bg={TYPE_COLORS[assignment.type]}
                        color='white'
                        borderRadius='md'
                        fontSize='xs'
                        cursor='pointer'
                        _hover={{ opacity: 0.8, transform: 'scale(1.02)' }}
                        transition='all 0.2s'
                        onClick={() => handleAssignmentClick(assignment)}
                        lineClamp={1}
                      >
                        {assignment.title}
                      </Box>
                    ))}
                    {day.assignments.length > 3 && (
                      <Text fontSize='xs' color='#dd7323' fontWeight='medium' pl={1}>
                        +{day.assignments.length - 3} khác
                      </Text>
                    )}
                  </VStack>
                </GridItem>
              ))}
            </Grid>
          </Card.Root>
        )}

        {/* Assignment Modal */}
        <AssignmentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          assignment={selectedAssignment}
        />
      </Box>
    </Box>
  )
}
