'use client'

import { Link, useLocation, useNavigate } from 'react-router'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Search, X, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import ChatSidebar from '../chat/ChatSidebar'
import NotificationBell from '../notifications/NotificationBell'
import UserMenu from './UserMenu'
import { search, type SearchResult, type SearchType } from '../../services/searchApi'
import '../../style/navbar.css'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get search type based on user role
  // Tạm thời tất cả role đều search theo type 'classes' vì BE chưa hỗ trợ type khác
  const getSearchType = (): SearchType => {
    // TODO: Sau này khi BE hỗ trợ thêm type khác thì sửa lại theo role
    return 'classes'
  }

  // Handle search
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setShowResults(true) // Show dropdown ngay khi bắt đầu search
    try {
      const searchType = getSearchType()
      // Gửi keyword nguyên bản, BE sẽ tự xử lý case-insensitive
      const response = await search({
        type: searchType,
        keyword: query
      })
      console.log('Search results:', response)
      setSearchResults(response.data || [])
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value)
    }, 300)
  }

  // Handle Enter key - navigate to search results page
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowResults(false)
      // Navigate to search results page with keyword
      navigate(`/student/search?keyword=${encodeURIComponent(searchQuery)}&type=classes`)
    }
  }

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    setShowResults(false)
    setSearchQuery('')
    // Navigate to course details for class type
    if (result.type === 'class') {
      const classId = result.id.replace('CLASS#', '')
      navigate(`/student/course-details/${classId}`)
    } else if (result.type === 'subject') {
      const subjectId = result.id.replace('SUBJECT#', '')
      navigate(`/student/all-courses?subject=${subjectId}`)
    }
  }

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Role-based navigation items
  const getNavItems = () => {
    if (!user) return []

    switch (user.role) {
      case 'Admin':
        return [
          { label: 'Cấu hình', href: '/admin/settings' },
          { label: 'Người dùng', href: '/admin/users-management/list' },
          { label: 'Môn học', href: '/admin/subjects-management/list' },
          { label: 'Lớp học', href: '/admin/classes-management/list' },
          { label: 'Nhật ký', href: '/admin/audit-logs' }
        ]

      case 'Lecturer':
        return [
          { label: 'Dashboard', href: '/lecturer/dashboard' },
          { label: 'My Courses', href: '/lecturer/my-courses' },
          { label: 'Gửi thông báo', href: '/lecturer/notifications-send' }
        ]

      case 'Student':
        return [
          { label: 'Home', href: '/home' },
          { label: 'My Courses', href: '/student/my-courses' },
          { label: 'Thông báo', href: '/student/notifications-receive' }
        ]

      default:
        return []
    }
  }

  const navItems = getNavItems()

  // Get home path based on role - Admin goes to settings
  const getHomePath = () => {
    if (!user) return '/home'
    switch (user.role) {
      case 'Admin':
        return '/admin/settings'
      case 'Lecturer':
        return '/lecturer/dashboard'
      case 'Student':
        return '/home'
      default:
        return '/home'
    }
  }

  return (
    <div className='navbar-wrapper'>
      <nav className='navbar'>
        <div className='navbar-container'>
          <Link to={getHomePath()} className='navbar-logo'>
            <img src='/Logo_AWS_FCJ.png' alt='LMS FCJ' style={{ height: '40px' }} />
          </Link>

          <div className='navbar-menu'>
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`navbar-item ${location.pathname === item.href ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div
            className='navbar-actions'
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            {/* Search bar */}
            <div ref={searchRef} style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  gap: '0.5rem',
                  minWidth: '200px'
                }}
              >
                <Search size={18} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                <input
                  type='text'
                  placeholder='Search... (Enter để xem tất cả)'
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => searchQuery && setShowResults(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: '14px',
                    width: '100%'
                  }}
                />
                {isSearching && <Loader2 size={16} className='animate-spin' style={{ color: '#e38214' }} />}
                {searchQuery && !isSearching && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSearchResults([])
                      setShowResults(false)
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={16} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showResults && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.5rem',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 1000
                  }}
                >
                  {searchResults.length > 0 ? (
                    <>
                      {searchResults.slice(0, 5).map((result, index) => (
                        <div
                          key={`${result.type}-${result.id}-${index}`}
                          onClick={() => handleResultClick(result)}
                          style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div style={{ fontWeight: 500, color: '#333', fontSize: '14px' }}>{result.title}</div>
                          {result.subtitle && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{result.subtitle}</div>
                          )}
                          <div
                            style={{
                              fontSize: '11px',
                              color: result.type === 'class' ? '#3b82f6' : '#22c55e',
                              marginTop: '4px',
                              textTransform: 'capitalize'
                            }}
                          >
                            {result.type === 'class' ? 'Lớp học' : 'Môn học'}
                          </div>
                        </div>
                      ))}
                      {/* Show "View all" link */}
                      <div
                        onClick={() => {
                          setShowResults(false)
                          navigate(`/student/search?keyword=${encodeURIComponent(searchQuery)}&type=classes`)
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                          color: '#e38214',
                          fontWeight: 500,
                          fontSize: '14px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fff7ed')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        Xem tất cả kết quả →
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#666', fontSize: '14px' }}>
                      Không tìm thấy kết quả
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat icon */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              title='Chat'
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                borderRadius: '6px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(227, 130, 20, 0.1)'
                e.currentTarget.style.color = '#e38214'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#fff'
              }}
            >
              <MessageCircle size={20} />
            </button>

            {/* Notification bell */}
            <NotificationBell />

            {/* User Menu with Avatar and Dropdown */}
            <UserMenu />
          </div>
        </div>
      </nav>

      {/* Chat Sidebar */}
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}
