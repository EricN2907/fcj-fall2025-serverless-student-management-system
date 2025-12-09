'use client'

import { useNavigate } from 'react-router'
import { Avatar, Menu, Portal, Float, Circle, Box, Skeleton, HStack, Stack, Text } from '@chakra-ui/react'
import { User, LogOut, BookOpen, Settings, CalendarDays } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { toaster } from '../ui/toaster'

interface UserMenuProps {
  variant?: 'light' | 'dark'
}

interface MenuItem {
  value: string
  label: string
  icon: React.ReactNode
  path: string
  danger?: boolean
}

export default function UserMenu({ variant }: UserMenuProps) {
  const navigate = useNavigate()
  const { user, logoutFromCognito } = useAuthStore()

  // Auto-detect variant based on user role if not specified
  const effectiveVariant = variant ?? (user?.role === 'Admin' ? 'light' : 'dark')
  const isDark = effectiveVariant === 'dark'

  // Get initials from user name
  const getInitials = (name?: string): string => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Get menu items based on role
  const getMenuItems = (): MenuItem[] => {
    switch (user?.role) {
      case 'Student':
        return [
          { value: 'profile', label: 'Profile', icon: <User size={18} />, path: '/profile' },
          { value: 'my-courses', label: 'My Courses', icon: <BookOpen size={18} />, path: '/student/my-courses' },
          { value: 'calendar', label: 'Deadline Calendar', icon: <CalendarDays size={18} />, path: '/student/calendar' }
        ]
      case 'Lecturer':
        return [
          { value: 'profile', label: 'Profile', icon: <User size={18} />, path: '/profile' },
          { value: 'my-courses', label: 'My Classes', icon: <BookOpen size={18} />, path: '/lecturer/my-courses' }
        ]
      case 'Admin':
      default:
        return [
          { value: 'profile', label: 'Profile', icon: <User size={18} />, path: '/profile' },
          { value: 'settings', label: 'Settings', icon: <Settings size={18} />, path: '/admin/settings' }
        ]
    }
  }

  const handleLogout = async () => {
    try {
      await logoutFromCognito()

      toaster.create({
        title: 'Logged out successfully',
        type: 'success',
        duration: 2000
      })

      // Redirect ngay lập tức về trang login
      window.location.href = '/login'
    } catch (error: any) {
      toaster.create({
        title: 'Logout failed',
        description: error.message || 'An error occurred',
        type: 'error',
        duration: 3000
      })
      // Vẫn redirect về login ngay cả khi có lỗi
      window.location.href = '/login'
    }
  }

  const handleMenuClick = (path: string) => {
    navigate(path)
  }

  // Loading state
  if (!user) {
    return (
      <HStack gap={3}>
        <Stack gap={1} display={{ base: 'none', sm: 'flex' }} alignItems='flex-end'>
          <Skeleton height='14px' width='80px' />
          <Skeleton height='12px' width='60px' />
        </Stack>
        <Skeleton borderRadius='full' width='36px' height='36px' />
      </HStack>
    )
  }

  const menuItems = getMenuItems()

  return (
    <Menu.Root positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger
        asChild
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem 0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderRadius: '8px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.backgroundColor = isDark ? 'rgba(227, 130, 20, 0.1)' : 'rgba(241, 245, 249, 0.8)'
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <button>
          {/* User Info */}
          <Box textAlign='right' display={{ base: 'none', sm: 'flex' }} flexDirection='column' alignItems='flex-end'>
            <Text fontSize='14px' fontWeight='700' color={isDark ? '#ffffff' : '#1e293b'} lineHeight='1.2'>
              {user.fullName || user.username || 'User'}
            </Text>
            <Text fontSize='12px' color={isDark ? '#94a3b8' : '#64748b'} marginTop='2px'>
              {user.role === 'Admin' ? 'Administrator' : user.role === 'Lecturer' ? 'Lecturer' : 'Student'}
            </Text>
          </Box>

          {/* Avatar with online badge */}
          <Avatar.Root size='sm' colorPalette='orange'>
            <Avatar.Fallback name={user.fullName || user.username}>
              {getInitials(user.fullName || user.username)}
            </Avatar.Fallback>
            {user.avatar && <Avatar.Image src={user.avatar} alt={user.fullName} />}
            <Float placement='bottom-end' offsetX='1' offsetY='1'>
              <Circle bg='green.500' size='10px' outline='2px solid' outlineColor={isDark ? '#293548' : 'white'} />
            </Float>
          </Avatar.Root>
        </button>
      </Menu.Trigger>

      <Portal>
        <Menu.Positioner>
          <Menu.Content
            minW='220px'
            padding='0.5rem'
            bg='white'
            boxShadow='0 10px 25px rgba(0, 0, 0, 0.15)'
            borderRadius='12px'
            border='1px solid'
            borderColor='gray.200'
          >
            {/* Menu Items */}
            {menuItems.map((item) => (
              <Menu.Item
                key={item.value}
                value={item.value}
                onClick={() => handleMenuClick(item.path)}
                cursor='pointer'
                display='flex'
                alignItems='center'
                padding='0.75rem 1rem'
                borderRadius='8px'
                _hover={{ bg: 'gray.50' }}
              >
                <Box color='gray.500' mr='10px'>
                  {item.icon}
                </Box>
                <Text fontSize='14px' fontWeight='500' color='gray.700'>
                  {item.label}
                </Text>
              </Menu.Item>
            ))}

            <Menu.Separator margin='0.5rem 0' borderColor='gray.200' />

            {/* Logout */}
            <Menu.Item
              value='logout'
              onClick={handleLogout}
              cursor='pointer'
              display='flex'
              alignItems='center'
              padding='0.75rem 1rem'
              borderRadius='8px'
              _hover={{ bg: 'red.50' }}
            >
              <Box color='red.500' mr='10px'>
                <LogOut size={18} />
              </Box>
              <Text fontSize='14px' fontWeight='600' color='red.500'>
                Logout
              </Text>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
